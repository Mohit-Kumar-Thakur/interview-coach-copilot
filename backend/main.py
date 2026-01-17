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
def start_interview(payload: StartInterviewRequest, db: Session = Depends(get_db)):
    session_id = f"session_{uuid4().hex[:8]}"
    first_question = get_first_question(payload.round)

    # 1) create session row
    db_session = InterviewSession(
        id=session_id,
        round=payload.round,
        difficulty=payload.difficulty
    )
    db.add(db_session)

    # 2) store assistant first message
    db.add(Message(session_id=session_id, role="assistant", content=first_question))

    db.commit()

    return {
        "session_id": session_id,
        "round": payload.round,
        "difficulty": payload.difficulty,
        "first_question": first_question,
    }



@app.post("/api/interview/message")
def interview_message(payload: MessageRequest, db: Session = Depends(get_db)):
    db_session = db.query(InterviewSession).filter(InterviewSession.id == payload.session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Invalid session_id. Start interview again.")

    # Find last assistant message (question)
    last_assistant = (
        db.query(Message)
        .filter(Message.session_id == payload.session_id, Message.role == "assistant")
        .order_by(Message.id.desc())
        .first()
    )
    last_question = last_assistant.content if last_assistant else "Tell me about yourself."

    # store user message
    db.add(Message(session_id=payload.session_id, role="user", content=payload.message))

    # follow-up
    round_type = db_session.round
    reply = generate_followup(round_type, payload.message, 0)

    # store assistant reply
    db.add(Message(session_id=payload.session_id, role="assistant", content=reply))

    db.commit()

    # evaluation only HR
    response = {
        "session_id": payload.session_id,
        "reply": reply,
    }

    if round_type == "HR":
        response["evaluation"] = evaluate_hr_answer(last_question, payload.message)

    return response



@app.post("/api/evaluate")
def evaluate(payload: EvaluateRequest):
    if payload.round != "HR":
        return {"note": "Only HR evaluation implemented on Day 3"}

    return evaluate_hr_answer(payload.question, payload.answer)

@app.get("/api/sessions")
def list_sessions(db: Session = Depends(get_db)):
    sessions = (
        db.query(InterviewSession)
        .order_by(InterviewSession.created_at.desc())
        .all()
    )

    return [
        {
            "session_id": s.id,
            "round": s.round,
            "difficulty": s.difficulty,
            "created_at": s.created_at,
        }
        for s in sessions
    ]


@app.get("/api/sessions/{session_id}")
def get_session_messages(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
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
        "messages": [{"role": m.role, "content": m.content, "created_at": m.created_at} for m in msgs],
    }

