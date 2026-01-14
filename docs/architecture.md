
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
