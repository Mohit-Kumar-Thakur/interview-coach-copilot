
Paste this:

```md
# Architecture — Interview Coach Copilot

## Goal
Build an AI-powered mock interview platform that:
- conducts interviews (HR/DSA/System Design)
- evaluates answers using rubric scoring
- tracks progress over time with analytics dashboard

---

## High-Level Architecture

Frontend (Next.js)
- UI pages: Landing, Interview, Dashboard
- Calls backend APIs for interview sessions, messages, scoring and analytics

Backend (FastAPI)
- Manages sessions, questions, messages
- Integrates LLM for:
  - interview questions + follow-up questions
  - rubric-based scoring
  - improvement suggestions

Database (PostgreSQL) — Next Phase
- Stores user accounts
- Stores interview sessions + messages
- Stores rubric scores and analytics aggregates

---

## Planned Modules

### 1) Interview Engine
Responsible for:
- selecting question based on round/difficulty
- generating follow-ups
- maintaining interview state (current question, round)

### 2) Evaluation Engine
Rubric-based evaluation:
- HR: STAR scoring rubric
- DSA: clarity, correctness, complexity, edge cases
- System Design: requirements, architecture, scalability, tradeoffs

Outputs structured JSON:
- score (0–10)
- feedback bullets
- improvement plan
- ideal answer (short)

### 3) Analytics Engine
- computes topic-wise weak areas
- session-wise score trend
- recommendation plan for next sessions

---

## API Routes (Current)

### Health
- GET `/health`  
Response:
```json
{ "status": "ok" }
```

---

## Day 2 Update — Session Flow (In-Memory)

### Backend
- Added in-memory session store: `SESSIONS` dict
- `/api/interview/start`
  - generates unique `session_id`
  - stores session state: round, difficulty, messages, question index
- `/api/interview/message`
  - validates session_id
  - appends user message
  - generates rule-based interviewer follow-up based on round
  - returns assistant reply + full message history

### Frontend
- Implemented real interview flow on `/interview`
  - Round selector (HR / DSA / System Design)
  - Start Interview (calls backend, receives session_id + first question)
  - Send message (calls backend, receives follow-up reply)
- Shows session_id in UI

---

## Day 3 Update — HR Rubric Evaluation (Rule-Based)

### Backend
- Added rule-based HR evaluator: `backend/evaluator.py`
- Updated `/api/interview/message`
  - For HR round, response includes `evaluation` JSON:
    - score (0–10)
    - rubric breakdown (clarity, structure, relevance, impact)
    - strengths
    - improvements
    - ideal_answer

### Frontend
- Added evaluation panel UI on `/interview`
- After user sends answer, UI renders:
  - score + rubric breakdown
  - strengths list
  - improvements list
  - ideal answer text

---

## Day 4 Update — PostgreSQL Persistence + Session History

### Backend
- Integrated PostgreSQL using SQLAlchemy
- Added DB config in `db.py` with `.env` based DATABASE_URL
- Added models:
  - `sessions` table (InterviewSession)
  - `messages` table (Message)
- Updated APIs to persist data:
  - POST `/api/interview/start` → creates session + first assistant message
  - POST `/api/interview/message` → stores user message + assistant reply
- Added history APIs:
  - GET `/api/sessions` → list sessions (latest first)
  - GET `/api/sessions/{session_id}` → fetch session + messages

### Frontend
- Dashboard upgraded with session history:
  - lists past sessions
  - clicking session loads full message transcript
