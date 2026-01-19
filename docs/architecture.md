
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


## Day 5 Updates (JWT Auth + User-Owned Sessions)

### Authentication (JWT)

**Flow**
1. User registers → `POST /api/auth/register`
2. User logs in → `POST /api/auth/login`
3. Backend returns `access_token` (JWT)
4. Frontend stores token in `localStorage`
5. Frontend sends token for protected APIs:
   `Authorization: Bearer <token>`

**JWT Payload**
- `user_id`
- `email`
- `exp`


### Authorization Rules (Protected APIs)

These endpoints require JWT:
- `POST /api/interview/start`
- `POST /api/interview/message`
- `GET /api/sessions`
- `GET /api/sessions/{session_id}`

Backend auth dependency:
- `get_current_user()` reads `Authorization: Bearer <token>`
- Decodes JWT → extracts `user_id`
- Finds user in DB → returns `User`
- Throws 401 on invalid/expired token


### User-Owned Sessions

**Rule**
A user can only see their own sessions + messages.

**Implementation**
- `InterviewSession.user_id = current_user.id`
- Fetch sessions filtered by current user:
  - `GET /api/sessions` returns only sessions where `user_id == current_user.id`
- Fetch session messages restricted:
  - `GET /api/sessions/{session_id}` checks ownership before returning messages


### Database Schema (PostgreSQL)

**users**
- `id` (PK)
- `email` (UNIQUE)
- `hashed_password`
- `created_at`

**sessions**
- `id` (PK)  *(session_id)*
- `user_id` (FK → users.id)
- `round`
- `difficulty`
- `created_at`

**messages**
- `id` (PK)
- `session_id` (FK → sessions.id)
- `role`  *(user / assistant)*
- `content`
- `created_at`


### Frontend Auth Integration

**Token storage helper**
File: `frontend/lib/auth.ts`
- `setToken(token)`
- `getToken()`
- `logout()`
- `authHeader()` → returns `{ Authorization: "Bearer <token>" }`

**Protected pages**
- Dashboard redirects to `/login` if token missing:
  - `useEffect(() => { if (!getToken()) router.push("/login"); }, [])`

**Authenticated API requests**
Frontend fetch calls include auth header:
- `headers: { ...authHeader() }`
- or with JSON:
  `headers: { "Content-Type": "application/json", ...authHeader() }`


## Day 6 — Auth UX + Safe Fetch + Token Storage Debugging

### What was implemented
- Implemented **JWT authentication flow** end-to-end:
  - `/api/auth/register` → create user
  - `/api/auth/login` → returns `access_token`
  - Protected endpoints require: `Authorization: Bearer <token>`
- Connected frontend to backend using **authenticated requests**.
- Implemented **token persistence** using `localStorage`:
  - `setToken(token)`
  - `getToken()`
  - `logout()` clears token
  - `authHeader()` returns `{ Authorization: "Bearer <token>" }`

### Frontend changes
- Added `/login` page:
  - Stores token after successful login
  - Redirects to `/dashboard`
- Added `/register` page:
  - Creates user using backend register endpoint
- Added **route protection**:
  - Redirect unauthenticated users to `/login` (useEffect guard)
- Updated `/dashboard`:
  - Shows logged-in user email from `/api/me`
  - Added Logout button
- Replaced raw `fetch()` calls with `safeFetch()` in Dashboard + Interview:
  - Centralizes auth + error handling
  - Handles 401 → redirect to login

### Backend changes
- Added/used `get_current_user()` dependency:
  - Reads JWT from Authorization header
  - Validates token and fetches user from DB
- Linked interview sessions to `user_id`
  - Sessions/messages are user-owned
  - `/api/sessions` returns only current user sessions
  - `/api/sessions/{session_id}` returns only current user session detail

### Issues solved today
- Fixed missing Authorization header errors
- Fixed invalid token formatting issues
- Fixed dashboard `sessions.map is not a function` by normalizing API response
- Fixed TypeScript headers merge typing issue
- Verified PostgreSQL persistence (users, sessions, messages)

### Current status
- Login/Register working
- Token stored and reused correctly
- Dashboard loads user-owned sessions
- Interview endpoints protected and usable with JWT
- PostgreSQL storing everything correctly
