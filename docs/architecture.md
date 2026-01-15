
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
