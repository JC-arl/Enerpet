import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import stt as stt_router

app = FastAPI(title="HealthPet FastAPI")

# RN 개발 중 CORS 허용 (필요시 도메인 제한)
origins = [
    "http://localhost:19006",
    "http://localhost:8081",
    "http://127.0.0.1:19006",
    "*",  # 개발 편의 (배포 전 반드시 좁히기)
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# start
# .venv\Scripts\activate
# uvicorn main:app --reload --host 0.0.0.0 --port 8000

@app.get("/health")
def health():
    return {"status": "ok"}

#app.include_router(stt_router.router)
