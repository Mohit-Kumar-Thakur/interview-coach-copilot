from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from db import Base


class InterviewSession(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)
    round = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    role = Column(String, nullable=False)  # user / assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
