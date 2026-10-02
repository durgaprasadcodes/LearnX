from pydantic import BaseModel,EmailStr,field_validator,Field

class RegistrationSchema(BaseModel):
    name:str = Field(min_length=3,max_length=200)
    email:EmailStr 
    password:str = Field(min_length=8)
    
class LoginSchema(BaseModel):
    email:EmailStr
    password:str 
    
class GoogleUser(BaseModel):
    id:str
    name:str
    email:EmailStr
    google_id:str
    picture:str

class VerifyOTP(BaseModel):
    google_id:str
    email:EmailStr
    otp:str

class VerifyEmail(BaseModel):
    email:EmailStr
    otp:str

class PageContentSchema(BaseModel):
    page_number: int
    content: str
    metadata: dict = {}

class ChunkSchema(BaseModel):
    chunk_index: int
    page_number: int
    content: str
    metadata: dict = {}

class DocumentExtractionResponse(BaseModel):
    status: str = "success"
    message: str = "Document uploaded, extracted, and chunked successfully"
    filename: str
    storage_path: str
    public_url: str | None = None
    resume_id: int | None = None
    user_id: int | None = None
    total_pages: int
    total_chunks: int
    extracted_text: str
    pages: list[PageContentSchema]
    chunks: list[ChunkSchema]


class ResumeItemResponse(BaseModel):
    id: int
    filename: str
    storage_path: str
    public_url: str
    created_at: str