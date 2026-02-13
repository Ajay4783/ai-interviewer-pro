from fastapi import FastAPI, Depends, File, UploadFile
import PyPDF2
import io
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from sqlalchemy import create_engine, Column, Integer, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL_NAME = "llama-3.3-70b-versatile"

engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class InterviewHistory(Base):
    __tablename__ = "interviews"
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text)
    user_answer = Column(Text)
    ai_feedback = Column(Text)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InterviewRequest(BaseModel):
    user_answer: str
    question: str

class QuestionRequest(BaseModel):
    topic: str

def get_ai_response(prompt):
    completion = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
    )
    return completion.choices[0].message.content

@app.post("/generate_question")
def generate_question(request: QuestionRequest):
    prompt = f"Generate a single, strict technical interview question about {request.topic} for a Python Full Stack Developer. Return ONLY the question text."
    try:
        response_text = get_ai_response(prompt)
        return {"question": response_text.strip()}
    except Exception as e:
        return {"question": "Error generating question via Groq."}

@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    return db.query(InterviewHistory).order_by(InterviewHistory.id.desc()).all()

@app.post("/analyze_answer")
def analyze_answer(request: InterviewRequest, db: Session = Depends(get_db)):
    prompt = f"You are a strict technical interviewer. Question: {request.question} Candidate's Answer: {request.user_answer} Please analyze the answer, give a rating out of 10, and provide constructive feedback."
    try:
        feedback_text = get_ai_response(prompt)
        new_entry = InterviewHistory(
            question=request.question,
            user_answer=request.user_answer,
            ai_feedback=feedback_text
        )
        db.add(new_entry)
        db.commit()
        return {"ai_feedback": feedback_text}
    except Exception as e:
        return {"ai_feedback": f"Error: {str(e)}"}

@app.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    try:
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
            
        prompt = f"Based on this resume content, ask a specific technical interview question:\n{text[:2000]}"
        response_text = get_ai_response(prompt)
        return {"question": response_text.strip(), "message": "Resume analyzed successfully!"}
    except Exception as e:
        return {"question": "Error reading PDF or Groq issue.", "message": str(e)}