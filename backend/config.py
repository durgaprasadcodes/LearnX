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
    ALLOWED_ORIGINS = json.loads(raw_origins) if isinstance(raw_origins, str) and raw_origins.startswith("[") else [o.strip() for o in raw_origins.split(",") if o.strip()]
except Exception:
    ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:5173"]
ACCESS_TOKEN_EXPIRY_TIME=int(os.getenv("ACCESS_TOKEN_EXPIRY_TIME"))
REFRESH_TOKEN_EXPIRY_TIME=int(os.getenv("REFRESH_TOKEN_EXPIRY_TIME"))

GOOGLE_CLIENT_ID=os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET=os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI=os.getenv("GOOGLE_REDIRECT_URI")
GOOGLE_SESSION_SECRET=os.getenv("GOOGLE_SESSION_SECRET")

MAIL_USERNAME=os.getenv("MAIL_USERNAME")
MAIL_PASSWORD=os.getenv("MAIL_PASSWORD")
MAIL_FROM=os.getenv("MAIL_FROM")
MAIL_SERVER=os.getenv("MAIL_SERVER")
MAIL_PORT=os.getenv("MAIL_PORT")


async def send_email(to_email: str, otp: int):
    message = EmailMessage()
    message["From"]=MAIL_FROM
    message["To"]=to_email
    message["Subject"]="OTP Verfication"
    message.add_alternative( f"""
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

                <!-- Main Card -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="max-width:560px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.06);">

                    <!-- Header -->
                    <tr>
                        <td style="padding:28px 36px; border-bottom:1px solid #eef0f4;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td>
                                        <span style="font-size:22px; font-weight:700; color:#111827;">
                                            YourApp<span style="color:#2563eb;">.</span>
                                        </span>
                                    </td>
                                    <td align="right">
                                        <span style="font-size:12px; color:#9ca3af;">
                                            SECURITY
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding:40px 36px 36px;">

                            <h1 style="margin:0 0 14px; font-size:26px; line-height:1.3; color:#111827; font-weight:700;">
                                Verify your email
                            </h1>

                            <p style="margin:0 0 26px; font-size:15px; line-height:1.7; color:#6b7280;">
                                Use the verification code below to continue securely.
                                This code is valid for a limited time.
                            </p>

                            <!-- OTP Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                                style="background-color:#f0f6ff; border:1px solid #dbeafe; border-radius:10px;">
                                <tr>
                                    <td align="center" style="padding:24px 16px;">

                                        <div style="font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:2px; margin-bottom:10px;">
                                            Verification Code
                                        </div>

                                        <div style="font-size:36px; font-weight:700; letter-spacing:10px; color:#1d4ed8; padding-left:10px;">
                                            {otp}
                                        </div>

                                    </td>
                                </tr>
                            </table>

                            <p style="margin:24px 0 0; font-size:13px; line-height:1.6; color:#9ca3af; text-align:center;">
                                This code expires in <strong style="color:#6b7280;">1 minute</strong>.
                            </p>

                            <!-- Security Notice -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                                style="margin-top:32px; background-color:#fffbeb; border-left:4px solid #f59e0b;">
                                <tr>
                                    <td style="padding:14px 16px;">
                                        <p style="margin:0; font-size:13px; line-height:1.6; color:#92400e;">
                                            <strong>Security notice:</strong>
                                            Never share this code with anyone.
                                            Our team will never ask for your verification code.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:30px 0 0; font-size:14px; line-height:1.7; color:#6b7280;">
                                If you didn't request this code, you can safely ignore this email.
                                Your account remains secure.
                            </p>

                            <p style="margin:28px 0 0; font-size:14px; color:#374151;">
                                Regards,<br>
                                <strong>The YourApp Team</strong>
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:22px 36px; background-color:#f9fafb; border-top:1px solid #eef0f4;">

                            <p style="margin:0; font-size:12px; line-height:1.6; color:#9ca3af; text-align:center;">
                                © 2026 YourApp. All rights reserved.
                            </p>

                            <p style="margin:6px 0 0; font-size:12px; color:#9ca3af; text-align:center;">
                                This is an automated security email. Please do not reply.
                            </p>

                        </td>
                    </tr>

                </table>

                <!-- Bottom Text -->
                <p style="margin:20px 0 0; font-size:11px; color:#9ca3af; text-align:center;">
                    You received this email because a verification request was made for your account.
                </p>

            </td>
        </tr>
    </table>

</body>
</html>""",subtype="html")


    await aiosmtplib.send(
        message,
        hostname=MAIL_SERVER,
        port=MAIL_PORT,
        start_tls=True,
        username=MAIL_USERNAME,
        password=MAIL_PASSWORD
    )

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