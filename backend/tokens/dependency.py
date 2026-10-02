from typing import Optional
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.orm import Session
from database.database import get_db
from models.model import User
from tokens.jwt import decode_access_token


def _extract_access_token(request: Request) -> Optional[str]:
    # Check HttpOnly cookie first
    token = request.cookies.get("access_token")
    if token:
        return token

    # Check Authorization header (Bearer <token>)
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]

    return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    access_token = _extract_access_token(request)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access Token Not Found"
        )

    try:
        payload = decode_access_token(access_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Access Token"
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Access Token"
        )

    user = db.query(User).filter(User.id == int(user_id)).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User Not Found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User Account Is Inactive"
        )

    return user


def get_optional_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    access_token = _extract_access_token(request)
    if not access_token:
        return None

    try:
        payload = decode_access_token(access_token)
        user_id = payload.get("sub")
        if not user_id:
            return None

        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.is_active:
            return None

        return user
    except Exception:
        return None