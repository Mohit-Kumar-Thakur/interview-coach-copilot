

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


## Day 7 — UI Theme + Design System + UX polish

### Goal
Make the frontend UI consistent and professional by introducing a shared color palette + reusable UI utility classes, then refactor pages to use them.

---

### What was implemented

#### 1) Global Theme Palette (CSS Variables)
Added a **single source of truth theme palette** in `frontend/app/globals.css` using CSS variables like:
- `--bg`, `--card`, `--muted`, `--border`
- `--text`, `--subtext`
- `--primary`, `--primary-hover`, `--ring`
- `--danger`

This enables consistent colors across all pages without hardcoding Tailwind colors everywhere.

---

#### 2) Reusable UI Component Classes (Tailwind @layer components)
Created reusable classes in `globals.css` under:
```css
@layer components { ... }
```


## Day 8 — UI Shell + Persistent Interview State (Frontend)

### Goal
Introduce a reusable layout wrapper (AppShell) and persist Interview session state in the browser so users don’t lose chat on refresh/navigation.

---

### What was implemented

#### 1) AppShell (Reusable Layout Wrapper)
- Added a shared `AppShell` component to standardize:
  - Page title + subtitle header
  - Top navigation links
  - Auth-based navigation controls
- Fixed **Next.js hydration mismatch** by:
  - Avoiding token/localStorage usage during first render
  - Rendering auth UI only after client hydration (`useEffect`)

**Component**
- `frontend/components/AppShell.tsx`

---

#### 2) Persistent Interview State (LocalStorage)
The Interview page now persists:
- selected round (HR/DSA/SD)
- current `sessionId`
- messages chat history
- evaluation object

So refresh doesn’t reset user progress.

**Storage keys**
- `icc_round`
- `icc_session_id`
- `icc_messages`
- `icc_evaluation`

**Implemented in**
- `frontend/app/interview/page.tsx`

---

#### 3) Clear Chat Button (UI Reset)
Added a UI-only clear option:
- clears messages
- clears evaluation
- clears input
- updates persisted storage accordingly

---

### API impact
No backend changes required.
This was a frontend-only improvement focused on UX and stability.

---

### Result
- Consistent UI layout across pages
- No hydration errors
- Interview chat persists across refresh
- Clear Chat provides clean UX reset


## Day 9 — Resume Session API + Frontend State Persistence

### Goal
Allow users to resume any previous interview session and persist chat state across refresh/reload.

---

### Backend Updates

#### Resume Session Endpoint
- Added **Resume Session API**
  - `GET /api/interview/session/{session_id}`
- Response includes:
  - `session_id`
  - `round`
  - `difficulty`
  - `created_at`
  - ordered `messages[]` (role, content, created_at)
  - optional `evaluation` (if available)

#### Security
- Uses JWT auth via `Authorization: Bearer <token>`
- Ownership check: user can resume only their own sessions
- Returns:
  - `404` if not found
  - `403` if forbidden (not owner)

---

### Frontend Updates

#### 1) Persistence (LocalStorage)
Interview page now stores state so refresh does not lose progress.

Stored keys:
- `icc_round`
- `icc_session_id`
- `icc_messages`
- `icc_evaluation`

Persisted data:
- `round`
- `sessionId`
- `messages[]`
- `evaluation`

Safeguards:
- `typeof window !== "undefined"` checks
- corrupted storage JSON is ignored safely

---

#### 2) Resume Session UI (Interview Page)
Added:
- input field: `Resume Session ID`
- button: `Resume Session`

Flow:
- user enters `session_xxxxxxxx`
- frontend calls:
  - `GET /api/interview/session/{session_id}`
- loads:
  - round, sessionId, messages, evaluation
- saves to localStorage immediately

---

### Result
- Current interview chat survives refresh/reload
- Any past session can be resumed by session_id
- Resume endpoint is secure + user-owned


## Day 10 — User Profiles + Profile-Aware Evaluation + Score Analytics

### Goal
Add user profile management, make evaluations context-aware using profile data, persist evaluations at message level for analytics, and add score tracking to the Dashboard.

---

### Backend Updates

#### 1) User Profile Fields
Added profile fields to `User` model:
- `full_name` (String)
- `college` (String)
- `department` (String)
- `graduation_year` (Integer)
- `created_at` (DateTime)

Database migration: `migrate_add_profile_fields.py`

#### 2) Profile Management APIs
- `GET /api/me` → returns full user profile including new fields
- `GET /api/users/me` → alias for profile retrieval
- `PUT /api/users/me` → update profile fields
  - accepts: `full_name`, `college`, `department`, `graduation_year`
  - validates user ownership via JWT

#### 3) Profile-Aware Evaluation
Updated `evaluator.py`:
- `evaluate_hr_answer(question, answer, profile)` now accepts optional profile dict
- Generates profile summary for context:
  - User's name, college, department, graduation year
- Returns additional fields in evaluation:
  - `profile_used` (bool)
  - `profile_summary` (formatted string)

Updated interview message endpoint:
- Fetches user profile from authenticated user
- Passes profile to evaluator for context-aware feedback

#### 4) Evaluation Persistence (Message Level)
Added `evaluation` JSON column to `Message` model:
- Stores evaluation result with each user message
- Database migration: `migrate_add_message_evaluation.py`

Updated `/api/interview/message`:
- Stores evaluation on user message (not just session)
- Also keeps latest evaluation on session for quick access
- Enables per-message score tracking

#### 5) Score Analytics APIs
Updated `/api/sessions`:
- Returns `latest_score` extracted from session evaluation
- Format: `{ session_id, round, difficulty, created_at, latest_score }`

Updated `/api/sessions/{session_id}`:
- Includes `evaluation` field with each message
- Enables score history retrieval

---

### Frontend Updates

#### 1) Profile Page (`/profile`)
New page for profile management:
- Display current profile (email, name, college, dept, grad year)
- Edit profile fields
- Save/refresh profile data
- Shows account creation date
- Profile completion tracking

#### 2) Profile Completion Tracking
Added profile completion percentage calculation:
- Checks 4 fields: `full_name`, `college`, `department`, `graduation_year`
- Each filled field = 25% completion
- Validates non-null, non-empty values

Dashboard updates:
- Shows "Profile: X%" badge in top bar
- Shows "Complete Profile" CTA button when < 50% complete
- Both Dashboard and Interview pages display profile completion

Interview page updates:
- Shows profile summary in session controls
- Displays "Complete Profile" warning when < 50%
- Links to profile page for easy completion

#### 3) Dashboard Score Analytics
Session list enhancements:
- Displays latest score badge next to each session
- Format: "Score: X/10"

Session detail panel:
- Shows score history (last 5 evaluations)
- Displays score + timestamp for each evaluation
- Horizontal scrollable cards for easy viewing

---

### Database Schema Updates

**users table**
- Added: `full_name`, `college`, `department`, `graduation_year`

**sessions table**
- Already has: `evaluation` (JSON)

**messages table**
- Added: `evaluation` (JSON) for per-message score tracking

---

### Result
- Users can manage comprehensive profiles
- Evaluations are personalized based on user context
- Score history tracked at message level
- Dashboard shows score trends and analytics
- Profile completion encourages better evaluation quality


## Day 11 — Session Export + Dashboard Analytics Enhancements

### Goal
Add comprehensive session export functionality and enhance dashboard with analytics insights, progress metrics, and score tracking.

---

### Frontend Updates

#### 1) Session Export Features
Added multiple export formats for interview sessions:

**Export to PDF** (`lib/pdf.ts`)
- Uses jsPDF library for PDF generation
- Includes session metadata (ID, round, difficulty, date)
- Renders full conversation transcript
- Shows evaluation scores inline
- Downloads as `session_{id}.pdf`

**Export to JSON** (`lib/exporter.ts`)
- Raw JSON export of session data
- Includes all messages with timestamps
- Contains evaluation results
- Downloads as `{session_id}.json`

**Export to Markdown** (`lib/exporter.ts`)
- Human-readable Markdown format
- Session metadata header
- Formatted conversation transcript
- Evaluation summary with strengths/improvements
- Downloads as `{session_id}.md`

Dashboard UI updates:
- Added "Export PDF" button above message list
- Added "Export JSON" and "Export Markdown" buttons in session detail header
- All buttons conditionally render when session is selected

---

#### 2) Dashboard Analytics Enhancements

**Analytics Panel** (`lib/analytics.ts`)
4-card grid showing:
- Total Sessions count
- HR Sessions count
- DSA Sessions count
- Average HR Score (rounded to 1 decimal)

**Progress Summary** (`lib/metrics.ts`)
Detailed metrics panel with:
- Total Interviews count
- HR Interviews count
- Average HR Score
- Last Interview Date (formatted)

**Interview Insights** (`lib/insights.ts`)
AI-powered insights panel displaying:
- Top Strength (most frequently mentioned in evaluations)
- Needs Improvement (most common improvement area)
- Personalized Recommendation text

---

#### 3) Score Tracking & Display

**Session List Enhancements**
- Added score badge to each session item
- Format: "Score: X/10"
- Uses `typeof check` for safe rendering
- Only shows when score is available

**Score Trend Section**
- Displays last 5 scores vertically
- Shows timestamp + score for each evaluation
- Clean list format with borders
- Auto-updates when session changes

---

### Type Safety Improvements

Updated `Msg` type in dashboard:
```typescript
evaluation?: {
  score: number;
} | null;
```

Backend safe access:
- Added `hasattr(m, "evaluation")` check before accessing evaluation field
- Prevents attribute errors on messages without evaluations

---

### Backend Impact
**None** — All Day 11 features are frontend-only changes:
- Session export uses existing session data
- Analytics computed from existing evaluations
- No new API endpoints required
- No database schema changes

---

### Result
- Users can export sessions in 3 formats (PDF, JSON, Markdown)
- Dashboard provides comprehensive analytics at a glance
- Progress tracking shows interview history and trends
- AI-powered insights help identify strengths and areas to improve
- Score tracking visualizes performance over time
- All features use existing backend APIs with no modifications
```
