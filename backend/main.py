from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from uuid import uuid4
from typing import Dict, List, Literal
from evaluator import evaluate_hr_answer
from db import Base, engine
from models import InterviewSession, Message
from sqlalchemy.orm import Session
from db import SessionLocal
from fastapi import Depends
from jose import jwt, JWTError

from models import User, InterviewSession, Message
from auth import hash_password, verify_password, create_access_token,SECRET_KEY, ALGORITHM

from fastapi import Header
from pydantic import BaseModel
from typing import List, Optional
from fastapi import HTTPException
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from errors import error_response
from jose import JWTError
import logging
from utils.profile_score import calculate_profile_score

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

logger = logging.getLogger("interview-api")
logger.info("Interview Coach API started")


Base.metadata.create_all(bind=engine)



app = FastAPI(title="Interview Coach Copilot API")

# CORS (so frontend can call backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# In-memory session storage
# -------------------------
SESSIONS: Dict[str, dict] = {}

HR_QUESTIONS = [
    "Tell me about yourself.",
    "Why do you want this role?",
    "Tell me about a challenge you faced and how you handled it.",
    "Describe a time you showed leadership.",
]

DSA_QUESTIONS = [
    "Explain how you would solve Two Sum. What is the optimal approach?",
    "Explain binary search and its time complexity.",
    "How would you detect a cycle in a linked list?",
    "Explain the difference between BFS and DFS with use cases.",
]

SD_QUESTIONS = [
    "Design a URL Shortener. Start with requirements.",
    "Design a rate limiter. What approach will you use?",
    "Design a scalable chat system (like WhatsApp).",
    "Design a news feed system (like Instagram).",
]

class MsgOut(BaseModel):
    role: str
    content: str
    created_at: str

class ResumeSessionResponse(BaseModel):
    session_id: str
    round: str
    difficulty: str
    created_at: str
    messages: List[MsgOut]
    evaluation: Optional[dict] = None
    
class StartInterviewRequest(BaseModel):
    round: Literal["HR", "DSA", "SD"] = "HR"
    difficulty: str = "medium"


class MessageRequest(BaseModel):
    session_id: str
    message: str
    
class EvaluateRequest(BaseModel):
    round: Literal["HR", "DSA", "SD"]
    question: str
    answer: str

class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    college: str | None = None
    department: str | None = None
    graduation_year: int | None = None



class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """
    Reads JWT from Authorization header: 'Bearer <token>'
    """
    if authorization is None:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization format")

    token = parts[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int | None = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed")
    except JWTError:
        logger.warning("JWT authentication failed")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user





@app.get("/health")
def health():
    return {"status": "ok"}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()





def get_first_question(round_type: str) -> str:
    if round_type == "HR":
        return HR_QUESTIONS[0]
    if round_type == "DSA":
        return DSA_QUESTIONS[0]
    return SD_QUESTIONS[0]


def generate_followup(round_type: str, user_message: str, q_index: int) -> str:
    """
    Rule-based interviewer follow-up generation.
    Later this will be replaced by LLM + rubric evaluation.
    """
    user_message = user_message.strip().lower()

    if round_type == "HR":
        if len(user_message) < 20:
            return "Can you add more detail and quantify the result?"
        return "What was your specific contribution and what did you learn from it?"

    if round_type == "DSA":
        if "time" in user_message or "o(" in user_message:
            return "Good. Now discuss edge cases and how you'd test your solution."
        return "What is the time and space complexity? Can you optimize it further?"

    # SD
    if "cache" in user_message or "database" in user_message:
        return "How would you scale this to 10M users and handle failures?"
    return "What are the key components, data model, and major scalability bottlenecks?"


@app.post("/api/interview/start")
def start_interview(
    payload: StartInterviewRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session_id = f"session_{uuid4().hex[:8]}"
    first_question = get_first_question(payload.round)

    # 1) create session row
    db_session = InterviewSession(
        id=session_id,
        user_id=user.id,
        round=payload.round,
        difficulty=payload.difficulty
    )
    db.add(db_session)

    # 2) store assistant first message
    db.add(Message(session_id=session_id, role="assistant", content=first_question))

    db.commit()

    logger.info(
        f"Session created | user_id={user.id} | session_id={session_id} | round={payload.round}"
    )

    return {
        "session_id": session_id,
        "round": payload.round,
        "difficulty": payload.difficulty,
        "first_question": first_question,
    }



@app.post("/api/interview/message")
def interview_message(
    payload: MessageRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db_session = (
    db.query(InterviewSession)
    .filter(InterviewSession.id == payload.session_id, InterviewSession.user_id == user.id)
    .first()
)


    # Find last assistant message (question)
    last_assistant = (
        db.query(Message)
        .filter(Message.session_id == payload.session_id, Message.role == "assistant")
        .order_by(Message.id.desc())
        .first()
    )
    last_question = last_assistant.content if last_assistant else "Tell me about yourself."

    # store user message first (we'll update it with evaluation later for HR)
    user_msg = Message(session_id=payload.session_id, role="user", content=payload.message)
    db.add(user_msg)
    db.flush()  # Get the ID without committing

    # follow-up
    round_type = db_session.round
    reply = generate_followup(round_type, payload.message, 0)

    # store assistant reply
    db.add(Message(session_id=payload.session_id, role="assistant", content=reply))

    # evaluation only HR
    response = {
        "session_id": payload.session_id,
        "reply": reply,
    }

    if round_type == "HR":
        profile = {
            "full_name": user.full_name,
            "college": user.college,
            "department": user.department,
            "graduation_year": user.graduation_year,
        }

        evaluation = evaluate_hr_answer(last_question, payload.message, profile)

        # Store evaluation on the user message (not session)
        user_msg.evaluation = evaluation
        
        # Also keep latest evaluation on session for quick access
        db_session.evaluation = evaluation
        db.add(db_session)

        response["evaluation"] = evaluation

    logger.info(
        f"Message | user_id={user.id} | session_id={payload.session_id} | round={round_type}"
    )

    db.commit()
    return response



@app.post("/api/evaluate")
def evaluate(
    payload: EvaluateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.round != "HR":
        return {"note": "Only HR evaluation implemented on Day 3"}

    profile = {
    "full_name": user.full_name,
    "college": user.college,
    "department": user.department,
    "graduation_year": user.graduation_year,
    }
    return evaluate_hr_answer(payload.question, payload.answer, profile)


@app.get("/api/sessions")
def list_sessions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == user.id)
        .order_by(InterviewSession.created_at.desc())
        .all()
    )

    return [
    {
        "session_id": s.id,
        "round": s.round,
        "difficulty": s.difficulty,
        "created_at": s.created_at,
        "latest_score": (s.evaluation.get("score") if s.evaluation else None),
    }
    for s in sessions
]



@app.get("/api/sessions/{session_id}")
def get_session_messages(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db_session = (
    db.query(InterviewSession)
    .filter(InterviewSession.id == session_id, InterviewSession.user_id == user.id)
    .first()
)

    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    msgs = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.id.asc())
        .all()
    )

    return {
        "session_id": db_session.id,
        "round": db_session.round,
        "difficulty": db_session.difficulty,
        "created_at": db_session.created_at,
        "messages": [
            {
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at,
                "evaluation": m.evaluation if hasattr(m, "evaluation") else None,
            }
            for m in msgs
        ],
    }
    
@app.post("/api/auth/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "registered", "user_id": user.id}

@app.post("/api/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Recompute profile score if it's None or if profile is incomplete
    if user.profile_score is None or user.profile_score < 100:
        user.profile_score = calculate_profile_score(user)
        db.commit()

    token = create_access_token({"user_id": user.id, "email": user.email})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/api/me")
def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "college": user.college,
        "department": user.department,
        "graduation_year": user.graduation_year,
        "created_at": user.created_at,
    }



@app.get("/api/users/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "college": user.college,
        "department": user.department,
        "graduation_year": user.graduation_year,
        "created_at": user.created_at,
        "profile_score": user.profile_score,
    }


@app.put("/api/users/me")
def update_me(
    payload: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Re-query the user in this session to avoid detached instance issues
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # only update fields that are provided
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.college is not None:
        user.college = payload.college
    if payload.department is not None:
        user.department = payload.department
    if payload.graduation_year is not None:
        user.graduation_year = payload.graduation_year

    # Recalculate and store profile score
    user.profile_score = calculate_profile_score(user)

    logger.info(
        f"Profile updated | user_id={user.id} | score={calculate_profile_score(user)}"
    )

    db.commit()
    db.refresh(user)

    return {
        "message": "profile_updated",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "college": user.college,
            "department": user.department,
            "graduation_year": user.graduation_year,
        },
    }

@app.get("/api/interview/session/{session_id}", response_model=ResumeSessionResponse)
def resume_session(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # 1) fetch session row
    s = (
        db.query(InterviewSession)
        .filter(InterviewSession.id == session_id)
        .first()
    )

    if not s:
        raise HTTPException(status_code=404, detail="Session not found")

    # 2) verify ownership
    if s.user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # 3) fetch messages (your model is Message, not InterviewMessage)
    msgs = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    # 4) build response messages
    out_msgs = [
        {
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat() if m.created_at else "",
        }
        for m in msgs
    ]

    return {
        "session_id": s.id,
        "round": s.round,
        "difficulty": s.difficulty,
        "created_at": s.created_at.isoformat() if s.created_at else "",
        "messages": out_msgs,
        "evaluation": s.evaluation,
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code = "HTTP_ERROR"
    if exc.status_code == 401:
        code = "UNAUTHORIZED"
    elif exc.status_code == 403:
        code = "FORBIDDEN"
    elif exc.status_code == 404:
        code = "NOT_FOUND"

    return error_response(code, exc.detail, exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return error_response(
        "VALIDATION_ERROR",
        "Invalid request payload",
        422,
    )


@app.exception_handler(JWTError)
async def jwt_exception_handler(request: Request, exc: JWTError):
    return error_response(
        "UNAUTHORIZED",
        "Invalid or expired token",
        401,
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", exc_info=exc)
    return error_response(
        "INTERNAL_SERVER_ERROR",
        "Something went wrong",
        500,
    )
