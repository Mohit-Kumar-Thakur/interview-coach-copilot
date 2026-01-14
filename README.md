# Interview Coach Copilot

AI Mock Interviewer + Rubric Evaluator + Progress Dashboard.

## Features (MVP Plan)
- HR / Behavioral interview chat
- DSA interview chat (later: code evaluation)
- System design interview chat
- Rubric-based scoring (STAR + technical rubrics)
- Session history
- Dashboard analytics

## Tech Stack
- Frontend: Next.js (App Router) + Tailwind CSS
- Backend: FastAPI
- Database (next phase): PostgreSQL
- AI (next phase): LLM API with structured JSON outputs

## Repo Structure
interview-coach-copilot/
frontend/ # Next.js UI
backend/ # FastAPI API service
docs/ # project docs


## How to Run Locally

### 1) Backend
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
Check:

http://localhost:8000/health

http://localhost:8000/docs

### 2) Frontend

cd frontend
npm install
npm run dev
Open:

http://localhost:3000

---

