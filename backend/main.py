from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from uuid import uuid4
from typing import Dict, List, Literal
from evaluator import evaluate_hr_answer


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
def start_interview(payload: StartInterviewRequest):
    session_id = f"session_{uuid4().hex[:8]}"

    first_question = get_first_question(payload.round)

    SESSIONS[session_id] = {
        "round": payload.round,
        "difficulty": payload.difficulty,
        "messages": [
            {"role": "assistant", "content": first_question}
        ],
        "current_question_index": 0,
    }

    return {
        "session_id": session_id,
        "round": payload.round,
        "difficulty": payload.difficulty,
        "first_question": first_question,
    }


@app.post("/api/interview/message")
def interview_message(payload: MessageRequest):
    session = SESSIONS.get(payload.session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Invalid session_id. Start interview again.")

    # Find the latest assistant question (last assistant message)
    last_assistant_question = None
    for m in reversed(session["messages"]):
        if m["role"] == "assistant":
            last_assistant_question = m["content"]
            break

    if not last_assistant_question:
        last_assistant_question = "Tell me about yourself."

    # Add user message
    session["messages"].append({"role": "user", "content": payload.message})

    # Generate interviewer follow-up reply
    round_type = session["round"]
    q_index = session["current_question_index"]
    reply = generate_followup(round_type, payload.message, q_index)

    # Add assistant reply
    session["messages"].append({"role": "assistant", "content": reply})

    # Update question index
    session["current_question_index"] = min(q_index + 1, 999)

    response = {
        "session_id": payload.session_id,
        "reply": reply,
        "messages": session["messages"],
    }

    # Attach evaluation ONLY for HR (Day 3)
    if round_type == "HR":
        evaluation = evaluate_hr_answer(last_assistant_question, payload.message)
        response["evaluation"] = evaluation

    return response


@app.post("/api/evaluate")
def evaluate(payload: EvaluateRequest):
    if payload.round != "HR":
        return {"note": "Only HR evaluation implemented on Day 3"}

    return evaluate_hr_answer(payload.question, payload.answer)
