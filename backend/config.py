from pwdlib import PasswordHash
from dotenv import load_dotenv
import os
import hashlib
from email.message import EmailMessage
import aiosmtplib
import secrets
import redis.asyncio as redis

import json

load_dotenv()

pwd_lib = PasswordHash.recommended()

def hash_password(password:str|int|bytes)->str:
    return pwd_lib.hash(str(password))

def hash_refresh_token(token):
    return hashlib.sha256(token.encode()).hexdigest()

def verify_password(user_password:str|int|bytes,db_password:str)->bool:
    return pwd_lib.verify(str(user_password),db_password)

def generate_otp():
    return str(secrets.randbelow(900000) + 100000)

SUPABASE_DATABASE_URL=os.getenv("SUPABASE_DATABASE_URL")
SECRET_KEY=os.getenv("SECRET_KEY")
ALGORITHM=os.getenv("ALGORITHM")
FRONTEND_URL=os.getenv("FRONTEND_URL")

raw_origins = os.getenv("ALLOWED_ORIGINS", '["http://localhost:3000","http://localhost:5173"]')
try:
    origins_list = json.loads(raw_origins) if isinstance(raw_origins, str) and raw_origins.startswith("[") else [o.strip() for o in raw_origins.split(",") if o.strip()]
except Exception:
    origins_list = []

ALLOWED_ORIGINS = list(set(origins_list + ["http://localhost:3000", "http://localhost:5173", "https://learnx-skillbridge.vercel.app"]))
ACCESS_TOKEN_EXPIRY_TIME=int(os.getenv("ACCESS_TOKEN_EXPIRY_TIME"))
REFRESH_TOKEN_EXPIRY_TIME=int(os.getenv("REFRESH_TOKEN_EXPIRY_TIME"))

GOOGLE_CLIENT_ID=os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET=os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI=os.getenv("GOOGLE_REDIRECT_URI")
GOOGLE_SESSION_SECRET=os.getenv("GOOGLE_SESSION_SECRET")

MAIL_USERNAME=os.getenv("MAIL_USERNAME")
MAIL_PASSWORD=os.getenv("MAIL_PASSWORD")
MAIL_FROM=os.getenv("MAIL_FROM")
MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_PORT=os.getenv("MAIL_PORT", "465")
RESEND_API_KEY=os.getenv("RESEND_API_KEY")


async def send_email(to_email: str, otp: str | int):
    # Always log OTP to server console (visible in Render logs for instant testing)
    print("\n" + "=" * 54, flush=True)
    print(f"🔐 [OTP GENERATED] To: {to_email} | CODE: {otp}", flush=True)
    print("=" * 54 + "\n", flush=True)

    # 1. Prefer HTTP-based email (Resend) if API key is present (Render NEVER blocks port 443 HTTPS)
    if RESEND_API_KEY:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {RESEND_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": os.getenv("RESEND_FROM", "LearnX <onboarding@resend.dev>"),
                        "to": [to_email],
                        "subject": "LearnX Verification Code",
                        "html": f"""
                            <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
                                <h2 style="color: #6d28d9; margin-top: 0;">LearnX Verification Code</h2>
                                <p style="color: #475569; font-size: 15px;">Use the code below to complete your authentication:</p>
                                <div style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #1e1b4b; background: #f5f3ff; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
                                    {otp}
                                </div>
                                <p style="color: #94a3b8; font-size: 13px;">This code is valid for 10 minutes. If you did not request this, you can ignore this email.</p>
                            </div>
                        """,
                    },
                    timeout=10.0,
                )
                if res.status_code < 300:
                    print(f"✅ Email successfully sent via Resend API to {to_email}", flush=True)
                    return
                else:
                    print(f"❌ Resend API returned error {res.status_code}: {res.text}", flush=True)
        except Exception as resend_err:
            print(f"❌ Failed sending via Resend API: {resend_err}", flush=True)

    # 2. SMTP fallback
    try:
        message = EmailMessage()
        message["From"] = MAIL_FROM or MAIL_USERNAME
        message["To"] = to_email
        message["Subject"] = "OTP Verification"
        message.add_alternative(f"""
            <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Verification Code</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f7fb; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7fb; padding:40px 16px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.06);">
                        <tr>
                            <td style="padding:28px 36px; border-bottom:1px solid #eef0f4;">
                                <span style="font-size:22px; font-weight:700; color:#111827;">LearnX<span style="color:#7c3aed;">.</span></span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:40px 36px 36px;">
                                <h1 style="margin:0 0 14px; font-size:24px; color:#111827;">Your Verification Code</h1>
                                <p style="margin:0 0 24px; font-size:15px; color:#6b7280;">Use the code below to complete your authentication:</p>
                                <div style="font-size:36px; font-weight:700; letter-spacing:8px; color:#7c3aed; text-align:center; padding:20px; background:#f5f3ff; border-radius:10px; margin-bottom:20px;">
                                    {otp}
                                </div>
                                <p style="margin:0; font-size:13px; color:#9ca3af; text-align:center;">This code expires in 10 minutes.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>""", subtype="html")

        port_num = int(MAIL_PORT or 465)
        # Port 465 uses direct SSL (use_tls=True, start_tls=False)
        # Port 587 uses STARTTLS (use_tls=False, start_tls=True)
        use_tls = (port_num == 465)
        start_tls = (port_num != 465)

        await aiosmtplib.send(
            message,
            hostname=MAIL_SERVER,
            port=port_num,
            use_tls=use_tls,
            start_tls=start_tls,
            username=MAIL_USERNAME,
            password=MAIL_PASSWORD,
            timeout=10.0,
        )
        print(f"✅ Email delivered via SMTP to {to_email}", flush=True)
    except Exception as e:
        print(f"⚠️ SMTP failed ({e}). Note: Render free tier blocks outbound SMTP ports 25 and 587.", flush=True)
        print(f"👉 Tip: Use port 465 or set RESEND_API_KEY in Render environment variables for HTTPS email delivery.", flush=True)

REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_USERNAME = os.getenv("REDIS_USERNAME", "default")
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    username=REDIS_USERNAME,
    password=REDIS_PASSWORD,
    db=REDIS_DB,
    decode_responses=True,
    protocol=2
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")        