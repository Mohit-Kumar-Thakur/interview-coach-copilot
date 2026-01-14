from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Interview Coach Copilot API")

# CORS (so frontend can call backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StartInterviewRequest(BaseModel):
    round: str = "HR"
    difficulty: str = "medium"

class MessageRequest(BaseModel):
    session_id: str
    message: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/interview/start")
def start_interview(payload: StartInterviewRequest):
    # Mock response for Day 1
    return {
        "session_id": "session_001",
        "round": payload.round,
        "difficulty": payload.difficulty,
        "first_question": "Tell me about yourself."
    }


@app.post("/api/interview/message")
def interview_message(payload: MessageRequest):
    # Mock AI response for Day 1
    return {
        "session_id": payload.session_id,
        "reply": f"Mock reply received: '{payload.message}'. (AI integration later)"
    }
