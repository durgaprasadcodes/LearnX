<div align="center">

# 🚀 LearnX

### Stop guessing what's in a resume. **Ask it.**

**AI-powered resume intelligence & career guidance, built on a RAG pipeline that answers with citations, not hallucinations.**

[![Live Demo](https://img.shields.io/badge/▶_Live_Demo-learnx--skillbridge.vercel.app-7c3aed?style=for-the-badge&logo=vercel&logoColor=white)](https://learnx-skillbridge.vercel.app)
[![API Docs](https://img.shields.io/badge/⚡_API_Docs-Swagger-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://learnx-q48f.onrender.com/docs)
[![GitHub](https://img.shields.io/badge/Source-durgaprasadcodes%2FLearnX-181717?style=for-the-badge&logo=github)](https://github.com/durgaprasadcodes/LearnX)

![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?logo=tailwindcss&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?logo=langchain&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?logo=google&logoColor=white)
![FAISS](https://img.shields.io/badge/FAISS-0467DF?logo=meta&logoColor=white)
![Postgres](https://img.shields.io/badge/Supabase_Postgres-3ECF8E?logo=supabase&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

<!-- 👉 REPLACE with your demo GIF or a 60–90s video thumbnail. This is the single highest-impact asset in this README. -->
<!-- [![Watch the demo](./screenshots/demo-thumbnail.png)](YOUR_VIDEO_LINK) -->

**[🌐 Try it live](https://learnx-skillbridge.vercel.app)** · **[⚡ Explore the API](https://learnx-q48f.onrender.com/docs)** · **[🏗️ Architecture](#-architecture)** · **[🔐 Security](#-security-by-design)**

</div>

---

## 💡 The Problem

Recruiters skim **hundreds of resumes** and spend seconds on each. Candidates have no idea how their resume *actually reads* against a role. Generic AI chatbots make it worse: they **hallucinate skills that were never on the page**.

## ✅ The Solution

**LearnX** lets you upload a PDF resume and have a conversation with it. Every answer is **grounded in the document itself** using Retrieval-Augmented Generation (RAG), and every claim comes back with the **source chunk it was retrieved from**, so you can verify instead of trust.

> *"What machine learning frameworks does this candidate know?"*
> *"Analyze skills match for a Backend Engineer role."*
> → Answer + the exact resume passages it came from.

---

## 🎯 Why LearnX Stands Out

| | Typical resume chatbot | **LearnX** |
|:--|:--|:--|
| **Answers grounded in the document** | ❌ Often hallucinated | ✅ RAG over the uploaded PDF |
| **Verifiable output** | ❌ No sources | ✅ Source-chunk citations |
| **Speed** | ⏳ Re-sends the whole doc to the LLM | ⚡ FAISS retrieves only relevant chunks |
| **Mobile login reliability** | ❌ Breaks on iOS Safari / Android Chrome | ✅ Dual-layer auth, no cross-domain cookie loss |
| **Security** | ❌ Plain tokens, weak hashing | ✅ Argon2, hashed rotating refresh tokens, Redis-TTL OTPs |
| **Production-ready** | ❌ Demo-grade | ✅ Deployed: Vercel + Render + Supabase |

---

## ✨ Key Features

### 🧠 1. AI Resume Intelligence (RAG)
- **Fast ingestion:** multi-page PDFs parsed with **PyMuPDF** and split into contextual chunks.
- **Semantic indexing:** chunks embedded with **Google Gemini** (`text-embedding-004`) and stored in a **FAISS** vector index, one per uploaded resume.
- **Grounded answers:** the top-matching chunks are assembled into context by **LangChain**, and the LLM answers *only* from that context.
- **Citations:** each response returns the source passages so users can verify it.

### 🔐 2. Dual-Layer Authentication: *zero cross-domain cookie loss*
Modern mobile browsers (iOS Safari ITP, Android Chrome) block third-party cookies between `vercel.app` and `onrender.com`, so a cookie-only login silently logs users out.

**Our fix:** the backend sets **HttpOnly cookies *and* issues a JWT Bearer token**. The frontend caches it and attaches `Authorization: Bearer <token>` through an Axios interceptor with a **refresh-queue** (concurrent 401s trigger a single refresh).
**Result:** reliable sessions on iPhone, Android, tablets and laptops, even across Google OAuth redirects.

### 🪪 3. Google OAuth 2.0 + Email OTP
Sign in with Google (Authlib / OpenID Connect) or register with email + password and verify via a one-time code stored in **Redis with a short TTL** (never in the primary database).

### 🎨 4. Premium, Responsive UI
Glassmorphic dark theme (Obsidian Purple & Black), **WebGL shader hero** (OGL), an **interactive 3D globe** (Cobe), **Framer Motion** transitions, **Lenis** 60 FPS smooth scroll, and a slide-out **Sider drawer** for one-tap navigation on mobile.

---

## 🏗️ Architecture

```mermaid
flowchart LR
    U([👤 User]) --> FE

    subgraph FE["🖥️ Frontend · Vercel"]
        R[React 19 + Vite 8<br/>Tailwind v4 · Framer Motion]
        AX[Axios interceptor<br/>Bearer + refresh queue]
        R --> AX
    end

    AX -->|HTTPS · JWT + HttpOnly cookie| API

    subgraph BE["⚙️ Backend · Render"]
        API[FastAPI]
        AUTH[Auth module<br/>Argon2 · JWT · OAuth · OTP]
        RAG[Resume module<br/>PyMuPDF → chunk → embed]
        API --> AUTH
        API --> RAG
    end

    AUTH --> PG[(Supabase PostgreSQL<br/>users · refresh_token hashes)]
    AUTH --> RD[(Redis<br/>OTP + TTL)]
    AUTH <--> GO[Google OAuth 2.0]
    RAG --> EM[Gemini Embeddings]
    RAG <--> FX[(FAISS Index<br/>per resume)]
    RAG --> LLM[Gemini LLM<br/>grounded answer + citations]
```

### 🔎 The RAG Pipeline

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant API as FastAPI
    participant PDF as PyMuPDF
    participant EMB as Gemini Embeddings
    participant FX as FAISS
    participant LLM as Gemini LLM

    U->>API: POST /resume/upload (PDF)
    API->>PDF: Extract text
    PDF-->>API: Pages → text
    API->>EMB: Embed chunks
    EMB-->>API: Vectors
    API->>FX: Build & persist index
    API-->>U: ✅ Ready

    U->>API: POST /resume/ask ("Skills match for Backend role?")
    API->>EMB: Embed question
    API->>FX: Similarity search (top-k)
    FX-->>API: Relevant chunks
    API->>LLM: Question + retrieved context
    LLM-->>API: Grounded answer
    API-->>U: Answer + source citations
```

---

## 🔐 Security by Design

Security wasn't an afterthought. It's a core feature.

| Threat | Defense |
|:--|:--|
| GPU brute-force on leaked hashes | **Argon2** (memory-hard) via `pwdlib` |
| Stolen refresh token | Stored as **SHA-256 hash**, **rotated on every use**, **auto-revoked on reuse** |
| XSS token theft | **HttpOnly** cookies for the session layer |
| Mobile third-party cookie blocking | **Dual-layer auth** (cookie + Bearer) |
| OTP leakage / replay | Short-TTL **Redis** storage, never persisted as plaintext in the main DB |
| Unauthorized access | JWT-protected routes through a single dual-auth dependency |

---

## 🛠️ Tech Stack

<table>
<tr><th>Layer</th><th>Technology</th><th>Why we chose it</th></tr>

<tr><td rowspan="8"><b>Frontend</b></td><td>React 19</td><td>Concurrent rendering, modern UI primitives</td></tr>
<tr><td>Vite 8</td><td>Instant HMR, fast builds</td></tr>
<tr><td>Tailwind CSS v4</td><td>Utility-first styling for the Obsidian dark theme</td></tr>
<tr><td>Framer Motion</td><td>Fluid transitions and spring physics</td></tr>
<tr><td>Lenis</td><td>60 FPS smooth scrolling</td></tr>
<tr><td>Cobe + OGL</td><td>Lightweight 3D globe and WebGL shaders</td></tr>
<tr><td>Axios</td><td>Bearer interceptor with refresh queuing</td></tr>
<tr><td>Lucide React</td><td>Consistent SVG icons</td></tr>

<tr><td rowspan="10"><b>Backend</b></td><td>FastAPI</td><td>Async, high-throughput, auto OpenAPI docs</td></tr>
<tr><td>LangChain</td><td>Chunking, embeddings, context assembly</td></tr>
<tr><td>Google Gemini</td><td>LLM + <code>text-embedding-004</code> embeddings</td></tr>
<tr><td>FAISS</td><td>Fast in-memory vector similarity search</td></tr>
<tr><td>PyMuPDF</td><td>Fast, accurate PDF text extraction</td></tr>
<tr><td>Supabase PostgreSQL</td><td>Managed relational store for users and token hashes</td></tr>
<tr><td>Redis</td><td>TTL-based OTP and rate-limit cache</td></tr>
<tr><td>SQLAlchemy 2.0 + Alembic</td><td>ORM and versioned migrations</td></tr>
<tr><td>Authlib + Starlette</td><td>Google OAuth 2.0 / OpenID Connect</td></tr>
<tr><td>Pwdlib (Argon2)</td><td>Secure password hashing</td></tr>

<tr><td><b>Deploy</b></td><td>Vercel · Render · Supabase</td><td>Free-tier friendly, production URLs live</td></tr>
</table>

---

## 📸 Screenshots

| 🖥️ Landing & 3D Hero | 📄 Resume Workspace | 👤 Profile & Sessions |
| :---: | :---: | :---: |
| ![Landing](./screenshots/home.png) | ![Resume](./screenshots/resume.png) | ![Profile](./screenshots/profile.png) |
| WebGL shader hero + interactive globe | RAG chat with source citations | Secure session management |

| 📱 Mobile Drawer | 🔐 Authentication | ⚡ Live Q&A |
| :---: | :---: | :---: |
| ![Mobile](./screenshots/mobile-sider.png) | ![Auth](./screenshots/auth.png) | ![Chat](./screenshots/chat.png) |
| Slide-out navigation | Google OAuth + Email OTP | Instant vector-search answers |

---

## 📡 API Reference

Full interactive docs: **[Swagger UI](https://learnx-q48f.onrender.com/docs)**

| Method | Endpoint | Description |
| :--: | :-- | :-- |
| `POST` | `/auth/register` | Register and issue access + refresh tokens |
| `POST` | `/auth/login` | Authenticate; returns profile + Bearer token |
| `GET` | `/auth/google/login` | Start Google OAuth 2.0 flow |
| `GET` | `/auth/google/callback` | Handle callback and redirect with token |
| `POST` | `/auth/verify-email` | Verify email OTP (Redis-backed) |
| `POST` | `/auth/refresh` | Rotate refresh token, issue new access token |
| `GET` | `/auth/get/me` | Fetch authenticated user profile |
| `POST` | `/auth/logout` | Revoke refresh token, clear credentials |
| `POST` | `/resume/upload` | Ingest PDF → extract → build FAISS index |
| `POST` | `/resume/ask` | Semantic search → grounded answer with citations |

---

## 🚀 Run It Locally

**Prerequisites:** Node.js ≥ 18 · Python ≥ 3.11 · a Supabase (PostgreSQL) project · Redis · Google Gemini API key · Google OAuth credentials

### 1️⃣ Clone

```bash
git clone https://github.com/durgaprasadcodes/LearnX.git
cd LearnX
```

### 2️⃣ Backend

```bash
cd backend

# create & activate a virtual environment
python -m venv venv
# Windows (PowerShell):  .\venv\Scripts\activate
# macOS / Linux:         source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:

```env
FRONTEND_URL=http://localhost:5173
SUPABASE_DATABASE_URL=postgresql+psycopg2://user:password@host:5432/dbname
SECRET_KEY=your_super_secret_jwt_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRY_TIME=15
REFRESH_TOKEN_EXPIRY_TIME=7

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
GOOGLE_SESSION_SECRET=your_session_secret

REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

GEMINI_API_KEY=your_gemini_api_key
```

```bash
alembic upgrade head
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

📖 Swagger docs → `http://localhost:8000/docs`

### 3️⃣ Frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
```

🌐 App → `http://localhost:5173`

---

## 📂 Project Structure

```text
LearnX/
├── backend/
│   ├── alembic/              # DB migrations
│   ├── auth/                 # Register, login, OTP, refresh, Google OAuth
│   ├── database/             # SQLAlchemy engine & session
│   ├── faiss_indexes/        # Per-resume vector stores
│   ├── models/               # User & RefreshToken ORM models
│   ├── resume/               # PDF parsing, FAISS indexing, QA endpoints
│   ├── tokens/               # JWT + dual-auth dependency (cookie / Bearer)
│   ├── config.py             # Env, mailer, CORS
│   ├── main.py               # App init & middleware
│   └── schemas.py            # Pydantic schemas
│
└── frontend/
    └── src/
        ├── components/       # Hero, Navbar, 3D globe, WebGL shaders
        ├── context/          # AuthContext (session + OAuth token capture)
        ├── pages/            # Home, Resume, Profile, Login, Register
        ├── services/         # Axios client + refresh queue
        └── App.jsx           # Routes, ProtectedRoute, Lenis
```

---

## 🧗 Challenges We Solved

1. **Mobile login loops.** iOS Safari and Android Chrome drop third-party cookies. We built a **dual-layer auth model** so sessions survive across `vercel.app` ↔ `onrender.com`.
2. **Hallucinated resume claims.** Instead of prompting an LLM with a whole PDF, we use **RAG with FAISS** so answers come only from retrieved chunks, with citations.
3. **Race conditions on token refresh.** Parallel requests hitting an expired token caused refresh storms. A **request queue in the Axios interceptor** makes it a single refresh.
4. **Safe token storage.** Refresh tokens are **hashed, rotated, and revoked on reuse**, so a leaked database does not leak live sessions.

---

## 🗺️ Roadmap

- [ ] Job-description ↔ resume **match score** with gap analysis
- [ ] **Personalized learning roadmaps** from detected skill gaps
- [ ] Multi-resume comparison for recruiters
- [ ] OTP rate limiting, attempt caps, and resend cooldown
- [ ] Docker + CI/CD pipeline
- [ ] Streaming responses (SSE) for token-by-token answers

---

## 👥 Team

| | |
|:--|:--|
| **Durga Prasad** | Full-stack architecture · AI RAG pipeline · UI/UX design · [@durgaprasadcodes](https://github.com/durgaprasadcodes) |

---

## 📄 License

Built for the **Nexlayer Hackathon** and released under the [MIT License](LICENSE).

<div align="center">

**If LearnX impressed you, drop a ⭐ on the repo.**

</div>