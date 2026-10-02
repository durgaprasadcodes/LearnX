import os
import re
import uuid

from pathlib import Path

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    status,
)

from pydantic import BaseModel, Field

from langchain_community.document_loaders import PyMuPDFLoader

from langchain_text_splitters import (
    RecursiveCharacterTextSplitter
)


from langchain_community.vectorstores import (
    FAISS
)

from langchain_groq import ChatGroq

from langchain_core.prompts import (
    ChatPromptTemplate
)

from langchain_core.output_parsers import (
    StrOutputParser
)

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from config import GROQ_API_KEY ,GEMINI_API_KEY 

from dotenv import load_dotenv

load_dotenv()

# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/resume",
    tags=["Resume"]
)


# ============================================================
# DIRECTORIES
# ============================================================

BASE_DIR = Path(
    __file__
).resolve().parent.parent


UPLOAD_DIR = (
    BASE_DIR
    / "uploads"
    / "resumes"
)


FAISS_DIR = (
    BASE_DIR
    / "faiss_indexes"
)


UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)


FAISS_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# CONFIGURATION
# ============================================================

MAX_FILE_SIZE = (
    15 * 1024 * 1024
)


# ============================================================
# TEXT SPLITTER
# ============================================================

text_splitter = RecursiveCharacterTextSplitter(

    chunk_size=800,

    chunk_overlap=150,

    separators=[
        "\n\n",
        "\n",
        " ",
        ""
    ],

    length_function=len
)


# ============================================================
# SENTENCE TRANSFORMER
# ============================================================

embedding_model = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2",
    api_key=GEMINI_API_KEY
)

# ============================================================
# GROQ LLM
# ============================================================

llm = ChatGroq(

    api_key=GROQ_API_KEY,

    model="qwen/qwen3.8-27b",

    temperature=0.4,

    timeout=60,

    max_tokens=800
)




# ============================================================
# REQUEST SCHEMA
# ============================================================

class ChatRequest(BaseModel):

    resume_id: str = Field(
        ...,
        description="FAISS resume ID"
    )

    question: str = Field(
        ...,
        min_length=1,
        description="User's career question"
    )

    k: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Number of resume chunks to retrieve"
    )


# ============================================================
# FILE NAME SANITIZATION
# ============================================================

def sanitize_filename(
    filename: str
) -> str:

    name, ext = os.path.splitext(
        filename
    )

    clean_name = re.sub(
        r"[^\w\-.]",
        "_",
        name
    )

    clean_ext = ext.lower()

    return (
        f"{clean_name[:80]}"
        f"{clean_ext}"
    )


# ============================================================
# LOAD FAISS INDEX
# ============================================================

def load_resume_vector_store(
    resume_id: str
):

    resume_faiss_dir = (
        FAISS_DIR
        / resume_id
    )

    if not resume_faiss_dir.exists():

        raise FileNotFoundError(
            "Resume FAISS index not found."
        )

    vector_store = FAISS.load_local(

        str(
            resume_faiss_dir
        ),

        embedding_model,

        allow_dangerous_deserialization=True
    )

    return vector_store


# ============================================================
# UPLOAD RESUME
# ============================================================

@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
    summary=(
        "Upload resume, extract text, "
        "create chunks, embeddings and FAISS index"
    )
)
async def upload_resume(

    file: UploadFile = File(
        ...,
        description="PDF Resume"
    )

):

    # ========================================================
    # 1. VALIDATE FILE NAME
    # ========================================================

    if not file.filename:

        raise HTTPException(

            status_code=400,

            detail=(
                "Filename is missing."
            )
        )


    # ========================================================
    # 2. VALIDATE PDF
    # ========================================================

    file_extension = (
        Path(
            file.filename
        ).suffix.lower()
    )


    if file_extension != ".pdf":

        raise HTTPException(

            status_code=400,

            detail=(
                "Only PDF files are supported."
            )
        )


    # ========================================================
    # 3. GENERATE RESUME ID
    # ========================================================

    resume_id = uuid.uuid4().hex


    # ========================================================
    # 4. CREATE UNIQUE FILE NAME
    # ========================================================

    clean_filename = (
        sanitize_filename(
            file.filename
        )
    )


    unique_filename = (
        f"{resume_id[:12]}_"
        f"{clean_filename}"
    )


    file_path = (
        UPLOAD_DIR
        / unique_filename
    )


    # ========================================================
    # 5. SAVE PDF
    # ========================================================

    total_size = 0


    try:

        with open(
            file_path,
            "wb"
        ) as buffer:

            while True:

                data = await file.read(
                    1024 * 1024
                )


                if not data:
                    break


                total_size += len(
                    data
                )


                if (
                    total_size
                    > MAX_FILE_SIZE
                ):

                    raise HTTPException(

                        status_code=(
                            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                        ),

                        detail=(
                            "File exceeds "
                            "maximum allowed size "
                            "of 15 MB."
                        )
                    )


                buffer.write(
                    data
                )


    except HTTPException:

        if file_path.exists():

            file_path.unlink()

        raise


    except Exception as e:

        if file_path.exists():

            file_path.unlink()


        raise HTTPException(

            status_code=500,

            detail=(
                f"Failed to save resume: {str(e)}"
            )
        )


    # ========================================================
    # 6. CHECK EMPTY FILE
    # ========================================================

    if total_size == 0:

        if file_path.exists():

            file_path.unlink()


        raise HTTPException(

            status_code=400,

            detail=(
                "Uploaded file is empty."
            )
        )


    # ========================================================
    # 7. EXTRACT TEXT USING PYMUPDF
    # ========================================================

    try:

        loader = PyMuPDFLoader(
            str(file_path)
        )


        documents = (
            loader.load()
        )


    except Exception as e:

        if file_path.exists():

            file_path.unlink()


        raise HTTPException(

            status_code=422,

            detail=(
                "Failed to extract "
                f"PDF text: {str(e)}"
            )
        )


    # ========================================================
    # 8. CHECK EXTRACTION
    # ========================================================

    if not documents:

        if file_path.exists():

            file_path.unlink()


        raise HTTPException(

            status_code=422,

            detail=(
                "No text could be "
                "extracted from PDF."
            )
        )


    # ========================================================
    # 9. EXTRACT FULL TEXT
    # ========================================================

    full_text = "\n\n".join(

        document.page_content

        for document in documents

        if document.page_content
    ).strip()


    if not full_text:

        if file_path.exists():

            file_path.unlink()


        raise HTTPException(

            status_code=422,

            detail=(
                "PDF contains no "
                "extractable text."
            )
        )


    # ========================================================
    # 10. CREATE CHUNKS
    # ========================================================

    chunks = (
        text_splitter.split_documents(
            documents
        )
    )


    if not chunks:

        if file_path.exists():

            file_path.unlink()


        raise HTTPException(

            status_code=422,

            detail=(
                "No chunks were created "
                "from the resume."
            )
        )


    # ========================================================
    # 11. ADD METADATA
    # ========================================================

    for index, chunk in enumerate(
        chunks
    ):

        original_page = (
            chunk.metadata.get(
                "page",
                0
            )
        )


        if isinstance(
            original_page,
            int
        ):

            page_number = (
                original_page + 1
            )

        else:

            page_number = 1


        chunk.metadata.update({

            "resume_id": resume_id,

            "chunk_index": index,

            "page_number": page_number,

            "source": file.filename,

            "document_type": "resume"

        })


    # ========================================================
    # 12. CREATE FAISS VECTOR STORE
    # ========================================================

    resume_faiss_dir = (
        FAISS_DIR
        / resume_id
    )


    try:

        vector_store = (
            FAISS.from_documents(

                chunks,

                embedding_model
            )
        )


        vector_store.save_local(

            str(
                resume_faiss_dir
            )
        )


    except Exception as e:

        if file_path.exists():

            file_path.unlink()


        raise HTTPException(

            status_code=500,

            detail=(
                "Failed to create "
                f"FAISS index: {str(e)}"
            )
        )


    # ========================================================
    # 13. RETURN RESPONSE
    # ========================================================

    return {

        "status": "success",

        "message": (
            "Resume uploaded, text extracted, "
            "chunks created, embeddings generated "
            "and stored in FAISS."
        ),

        "resume_id": resume_id,

        "filename": file.filename,

        "total_pages": len(
            documents
        ),

        "total_chunks": len(
            chunks
        ),

        "extracted_text": full_text,

        "faiss_path": str(
            resume_faiss_dir
        )

    }


# ============================================================
# CHAT WITH RESUME
# ============================================================

@router.post(
    "/chat",
    summary=(
        "Ask personalized career questions "
        "using the uploaded resume"
    )
)
async def chat_with_resume(

    request: ChatRequest

):

    # ========================================================
    # 1. VALIDATE QUESTION
    # ========================================================

    question = (
        request.question.strip()
    )


    if not question:

        raise HTTPException(

            status_code=400,

            detail=(
                "Question cannot be empty."
            )
        )


    # ========================================================
    # 2. LOAD RESUME FAISS
    # ========================================================

    try:

        vector_store = (
            load_resume_vector_store(
                request.resume_id
            )
        )


    except FileNotFoundError:

        raise HTTPException(

            status_code=404,

            detail=(
                "Resume not found. "
                "Upload the resume first."
            )
        )


    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=(
                "Failed to load resume "
                f"vector store: {str(e)}"
            )
        )


    # ========================================================
    # 3. RETRIEVE RELEVANT RESUME CHUNKS
    # ========================================================

    try:

        retrieved_documents = (

            vector_store.similarity_search(

                question,

                k=request.k
            )
        )


    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=(
                "Failed to search resume: "
                f"{str(e)}"
            )
        )


    if not retrieved_documents:

        raise HTTPException(

            status_code=404,

            detail=(
                "No relevant information "
                "was found in the resume."
            )
        )


    # ========================================================
    # 4. BUILD RESUME CONTEXT
    # ========================================================

    context_parts = []


    for document in (
        retrieved_documents
    ):

        page_number = (
            document.metadata.get(
                "page_number",
                "unknown"
            )
        )


        chunk_index = (
            document.metadata.get(
                "chunk_index",
                "unknown"
            )
        )


        context_parts.append(

            f"""
Resume Page: {page_number}

Chunk: {chunk_index}

Content:
{document.page_content}
"""
        )


    context = (
        "\n\n----------------------\n\n"
        .join(
            context_parts
        )
    )


    # ========================================================
    # 5. CAREER ADVISOR PROMPT
    # ========================================================

    prompt = ChatPromptTemplate.from_messages([

        (

            "system",

            """
You are an AI Career Advisor
specialized in personalized career development.

You are analyzing a candidate's resume.

Your goal is to help the candidate understand:

- Their current skills
- Their strengths
- Their missing skills
- Suitable career directions
- Job-role preparation
- Learning priorities
- Personalized roadmaps
- Project recommendations
- Interview preparation
- Future learning plans

IMPORTANT RULES:

1. Use the resume context as the source
   for candidate-specific information.

2. Never invent a skill, project,
   certification, experience or achievement
   that is not supported by the resume.

3. Clearly distinguish between:
   - Skills explicitly present
   - Skills reasonably inferred
   - Skills that appear to be missing

4. If the resume does not contain enough
   information, explicitly say so.

5. Give practical and actionable advice.

6. Do not give a generic roadmap when
   the candidate's existing skills allow
   personalization.

7. Build roadmaps progressively:

   Foundation
       ↓
   Intermediate
       ↓
   Advanced
       ↓
   Projects
       ↓
   Interview Preparation
       ↓
   Job Preparation

8. When discussing skill gaps, prioritize
   the most relevant gaps instead of listing
   every possible technology.

9. When the user asks about a job role,
   explain how their current resume aligns
   with that role and what they should
   develop next.

10. Do not guarantee employment,
    salary, interviews or job offers.

11. If the question is unrelated to the
    resume, explain that the answer cannot
    be personalized from the available
    resume information.

RESUME CONTEXT:

{context}
"""
        ),

        (

            "human",

            """
Candidate Question:

{question}

Provide a personalized, practical and
well-structured answer based on the
candidate's resume context.
"""
        )

    ])


    # ========================================================
    # 6. CREATE LANGCHAIN RAG CHAIN
    # ========================================================

    chain = (

        prompt

        | llm

        | StrOutputParser()

    )


    # ========================================================
    # 7. GENERATE ANSWER USING GROQ
    # ========================================================

    try:

        answer = await chain.ainvoke({

            "context": context,

            "question": question

        })


    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=(
                "Failed to generate AI answer: "
                f"{str(e)}"
            )
        )


    # ========================================================
    # 8. RETURN ANSWER
    # ========================================================

    return {

        "status": "success",

        "resume_id": request.resume_id,

        "question": question,

        "answer": answer,

        "sources": [

            {

                "page_number":
                    document.metadata.get(
                        "page_number"
                    ),

                "chunk_index":
                    document.metadata.get(
                        "chunk_index"
                    ),

                "content":
                    document.page_content

            }

            for document in (
                retrieved_documents
            )

        ]

    }