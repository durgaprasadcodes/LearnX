from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles

from auth.auth import router as auth_router
from resume.resume import router as resume_router

from tokens.dependency import get_current_user
from models.model import User

from auth.google_auth import (
    oauth,
    SessionMiddleware,
    CORSMiddleware
)

from config import (
    ALLOWED_ORIGINS,
    GOOGLE_SESSION_SECRET
)

import os


app = FastAPI(
    title="Production Authentication API"
)


# ============================================
# SESSION
# ============================================

app.add_middleware(
    SessionMiddleware,
    secret_key=GOOGLE_SESSION_SECRET,
    https_only=False,       # True in production
    same_site="lax"
)


# ============================================
# CORS
# ============================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"]
)


# ============================================
# ROUTERS
# ============================================

app.include_router(auth_router)

app.include_router(resume_router)


# ============================================
# UPLOAD DIRECTORY
# ============================================

UPLOAD_ROOT = os.path.join(
    os.path.dirname(
        os.path.abspath(__file__)
    ),
    "uploads"
)

os.makedirs(
    UPLOAD_ROOT,
    exist_ok=True
)


app.mount(
    "/uploads",
    StaticFiles(
        directory=UPLOAD_ROOT
    ),
    name="uploads"
)


# ============================================
# ROOT
# ============================================

@app.get("/")
def root():

    return {
        "message": "Authentication API is running"
    }


# ============================================
# CURRENT USER
# ============================================

@app.get("/me")
async def get_me(
    current_user: User = Depends(
        get_current_user
    )
):

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "picture": current_user.picture,
        "image_url": current_user.picture
    }