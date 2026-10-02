from fastapi import APIRouter,Depends,status,HTTPException,Request,Response,BackgroundTasks
from config import hash_password,verify_password,ACCESS_TOKEN_EXPIRY_TIME,REFRESH_TOKEN_EXPIRY_TIME,hash_refresh_token
from sqlalchemy.orm import Session
from database.database import get_db
from schemas import RegistrationSchema,LoginSchema,GoogleUser,VerifyOTP,VerifyEmail
from models.model import User,RefreshToken
from tokens.jwt import create_access_token,create_refresh_token
from datetime import datetime,timedelta
import json
from config import FRONTEND_URL,send_email,generate_otp,redis_client,GOOGLE_REDIRECT_URI
from .google_auth import oauth
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
from tokens.dependency import get_current_user

router = APIRouter(prefix="/auth",tags=["Authentication"])

@router.post("/register", status_code=202)
async def register(user:RegistrationSchema, background_tasks:BackgroundTasks, db:Session=Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email Already Existed")
    
    otp = generate_otp()
    
    # Store pending user data + OTP in Redis for 10 minutes
    pending_data = {
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "otp": otp
    }
    await redis_client.set(f"pending_register:{user.email}", json.dumps(pending_data), ex=600)
    
    # Send OTP email in background — user is not blocked
    background_tasks.add_task(send_email, user.email, otp)
    
    return {
        "message": f"OTP sent to {user.email}. Please verify to complete registration."
    }


@router.post("/verify-email")
async def verify_email(response:Response, payload:VerifyEmail, db:Session=Depends(get_db)):
    redis_key = f"pending_register:{payload.email}"
    raw = await redis_client.get(redis_key)
    
    if not raw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No pending registration found. OTP may have expired.")
    
    pending = json.loads(raw)
    
    if pending["otp"] != payload.otp:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect or expired OTP")
    
    # Check again in case someone registered between OTP send and verify
    db_user = db.query(User).filter(User.email == payload.email).first()
    if db_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email Already Existed")
    
    new_user = User(
        name=pending["name"],
        email=pending["email"],
        password=pending["password"]
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Clean up Redis
    await redis_client.delete(redis_key)
    
    access_token = create_access_token(new_user.id, new_user.email)
    refresh_token, refresh_token_hash = create_refresh_token()
    
    refresh_token_record = RefreshToken(
        user_id=new_user.id,
        token_hash=refresh_token_hash,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRY_TIME)
    )
    db.add(refresh_token_record)
    db.commit()
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=60 * ACCESS_TOKEN_EXPIRY_TIME
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=60 * 60 * 24 * REFRESH_TOKEN_EXPIRY_TIME
    )
    
    return {
        "message": f"{new_user.name} Registered & Logged In Successfully"
    }
    
@router.post("/login")
async def login(response:Response,user:LoginSchema,db:Session=Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password,db_user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid Credentials Given")
    access_token = create_access_token(db_user.id,db_user.email)
    refresh_token,refresh_token_hash = create_refresh_token()
    
    refresh_token_data = RefreshToken(
        user_id = db_user.id,
        token_hash = refresh_token_hash,
        expires_at = datetime.now()+timedelta(days=REFRESH_TOKEN_EXPIRY_TIME)
    )
    
    db.add(refresh_token_data)
    db.commit()
    db.refresh(refresh_token_data)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=60*ACCESS_TOKEN_EXPIRY_TIME
    )
    
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=60*60*24*REFRESH_TOKEN_EXPIRY_TIME
    )
    
    return {
        "message": f"{db_user.name} Logged In Successfully"
    }
    
@router.post("/refresh")
async def refresh(request:Request,response:Response,db:Session=Depends(get_db)):

    refresh_token_hash = hash_refresh_token(request.cookies.get("refresh_token",""))
    
    if not refresh_token_hash:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Refresh Token Not Found")
    
    token = db.query(RefreshToken).filter(RefreshToken.token_hash == refresh_token_hash).first()
    
    if not token:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Refresh Token Not Found")
    if  token.revoked_at is not None :
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Refresh Token Revoked")
    if token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Refresh Token Exprired")

    token.revoked_at = datetime.utcnow()
    
    db_user = db.query(User).filter(User.id == token.user_id).first()
    
    if not db_user or not db_user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="User Account Is Invalid")
        
    access_token = create_access_token(db_user.id,db_user.email)
    refresh_token,refresh_token_hash = create_refresh_token()

    
    new_refresh_token_data = RefreshToken(
        user_id = db_user.id,
        token_hash = refresh_token_hash,
        expires_at = datetime.utcnow()+timedelta(days=REFRESH_TOKEN_EXPIRY_TIME)
    )
    
    db.add(new_refresh_token_data)
    db.flush()
    token.replaced_by = new_refresh_token_data.id
    db.commit()
    db.refresh(new_refresh_token_data)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=60*ACCESS_TOKEN_EXPIRY_TIME
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=60*60*24*REFRESH_TOKEN_EXPIRY_TIME
    )
    
    return {
        "message": f"{db_user.name}'s Refresh Token Generated Successfully",
    }
    
@router.post("/logout")
async def logout(response:Response,request:Request ,db:Session=Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        refresh_token_hash = hash_refresh_token(refresh_token)
        token_hash = db.query(RefreshToken).filter(RefreshToken.token_hash == refresh_token_hash).first()
        if token_hash and token_hash.revoked_at is None:
            token_hash.revoked_at = datetime.utcnow()
            db.commit()
            
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        samesite="lax",
        secure=False
    )
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
        secure=False
    )
    return {
        "message":"Logged Out Successfully"
    }

def user_existed_already(existing_google_user:GoogleUser,db:Session):
    if not existing_google_user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )
    # Generate your existing tokens
    access_token=create_access_token(
        existing_google_user.id,
        existing_google_user.email
    )
    raw_refresh_token,refresh_token_hash=create_refresh_token()
    refresh_token_record=RefreshToken(
        user_id=existing_google_user.id,
        token_hash=refresh_token_hash,
        expires_at=datetime.utcnow()+timedelta( days=REFRESH_TOKEN_EXPIRY_TIME )
    )
    db.add(refresh_token_record)
    db.commit()
    
    # Redirect to React and attach cookies
    response=RedirectResponse(
        url=f"{FRONTEND_URL}/dashboard",
        status_code=302
    )
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60*ACCESS_TOKEN_EXPIRY_TIME
    )

    response.set_cookie(
        key="refresh_token",
        value=raw_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60*60*24*REFRESH_TOKEN_EXPIRY_TIME
    )
    return response
    
@router.get("/google/login")
async def google_login(request:Request):
    # redirect_uri = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request,"https://learnx-q48f.onrender.com/auth/google/callback")


@router.get("/google/callback")
async def google_callback(request:Request,background_tasks:BackgroundTasks,db:Session=Depends(get_db)):
    
    token=await oauth.google.authorize_access_token(request)

    user=token.get("userinfo")

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Unable to retrieve Google User Information"
        )

    if not user.get("email_verified"):
        raise HTTPException(
            status_code=403,
            detail="Google Email Is Not Verified"
        )

    google_id=user.get("sub")
    email=user.get("email")
    name=user.get("name")
    picture=user.get("picture")

    existing_google_user = db.query(User).filter( User.google_id==google_id ).first() 

    if existing_google_user:
        return user_existed_already(existing_google_user,db)
    
    existing_google_email = db.query(User).filter( User.email== email ).first() 
    
    if existing_google_email:
        otp = generate_otp()
        await redis_client.set(f"otp:{email}", otp, ex=300)
        background_tasks.add_task(send_email, existing_google_email.email, otp)
        params = urlencode({"email": email, "google_id": google_id})
        return RedirectResponse(url=f"{FRONTEND_URL}/verify-otp?{params}", status_code=302)
    
    new_google_user=User(
    name=name,
    email=email,
    password=None,
    google_id=google_id,
    picture=picture )

    db.add(new_google_user)
    db.commit()
    db.refresh(new_google_user)
    
    access_token=create_access_token(
    new_google_user.id,
    new_google_user.email
)

    raw_refresh_token,refresh_token_hash=create_refresh_token()

    refresh_token_record=RefreshToken(
        user_id=new_google_user.id,
        token_hash=refresh_token_hash,
        expires_at=datetime.utcnow()+timedelta(days=REFRESH_TOKEN_EXPIRY_TIME)
    )

    db.add(refresh_token_record)
    db.commit()
    db.refresh(refresh_token_record)
    
    response=RedirectResponse(
    url=f"{FRONTEND_URL}/dashboard",
    status_code=302
)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60*ACCESS_TOKEN_EXPIRY_TIME
    )

    response.set_cookie(
        key="refresh_token",
        value=raw_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60*60*24*REFRESH_TOKEN_EXPIRY_TIME
    )

    return response

    
@router.post("/verify_otp")
async def verify_otp(response:Response,verify_request:VerifyOTP,db:Session=Depends(get_db)):
    redis_key = f"otp:{verify_request.email}"
    redis_stored_opt = await redis_client.get(redis_key)
    if not redis_stored_opt or redis_stored_opt != verify_request.otp:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Incorrect or expired Otp")
    user = db.query(User).filter(User.email==verify_request.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user.google_id = verify_request.google_id
    db.commit()
    db.refresh(user)

    # Invalidate OTP from Redis to prevent replay
    await redis_client.delete(redis_key)

    access_token=create_access_token(
        user.id,
        user.email
    )
    raw_refresh_token,refresh_token_hash=create_refresh_token()
    refresh_token_record=RefreshToken(
        user_id=user.id,
        token_hash=refresh_token_hash,
        expires_at=datetime.utcnow()+timedelta( days=REFRESH_TOKEN_EXPIRY_TIME )
    )
    db.add(refresh_token_record)
    db.commit()
    db.refresh(refresh_token_record)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60*ACCESS_TOKEN_EXPIRY_TIME
    )
    
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60*60*24*REFRESH_TOKEN_EXPIRY_TIME
    )
    
    return {
        "message": f"{user.name} Authenticated Successfully"
    }
    
    
@router.get("/get/me")
async def get_me(current_user: User = Depends(get_current_user),db:Session=Depends(get_db)):
    user = db.query(User).filter(User.id == current_user.id).first()
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "picture": user.picture,
        "image_url": user.picture
    }