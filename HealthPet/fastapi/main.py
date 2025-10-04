import os
import base64
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

load_dotenv()

# --------- 환경설정 ---------
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
LANGUAGE_CODE = os.getenv("LANGUAGE_CODE", "ko-KR")
ENCODING = os.getenv("ENCODING")          # 예: "LINEAR16", "WEBM_OPUS", "OGG_OPUS"
SAMPLE_RATE = os.getenv("SAMPLE_RATE")    # 예: "16000" (문자열로 들어오므로 int로 변환)
PORT = int(os.getenv("PORT", "8000"))

if not GOOGLE_API_KEY:
    print(GOOGLE_API_KEY)
    raise RuntimeError("환경변수 GOOGLE_API_KEY를 설정하세요.")

STT_ENDPOINT = f"https://speech.googleapis.com/v1/speech:recognize?key={GOOGLE_API_KEY}"
MAX_REQUEST_BYTES = 10 * 1024 * 1024  # v1 REST 요청 권장 상한(대략적인 가드)

# --------- 앱/미들웨어 ---------
app = FastAPI(title="Google Cloud STT (API Key / v1 REST)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # 운영 시 실제 도메인으로 제한 권장
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("stt")

# --------- 모델 ---------
class STTResponse(BaseModel):
    text: str
    raw: dict | None = None

# --------- 유틸 ---------
def build_config():
    return {
        "languageCode": LANGUAGE_CODE,
        "enableAutomaticPunctuation": True,
        "encoding": "LINEAR16",
        "sampleRateHertz": 16000,
    }
# --------- 라우트 ---------
@app.get("/healthz")
async def healthz():
    return {"ok": True}

@app.post("/stt", response_model=STTResponse)
async def stt(file: UploadFile = File(...)):
    """
    동기 인식(짧은 파일용). 권장: 60초 이하 또는 전체 요청 10MB 이내.
    더 길거나 큰 파일은 GCS URI + 비동기(LongRunningRecognize) 권장(=서비스 계정 필요).
    """
    raw = await file.read()

    # base64로 불면 사이즈가 ~1.33배 → 대략적인 가드
    est = len(raw) * 4 // 3
    if est > MAX_REQUEST_BYTES:
        raise HTTPException(
            status_code=413,
            detail="파일이 너무 큽니다. 10MB 이하로 보내거나 GCS 업로드 방식으로 전환하세요."
        )

    audio_b64 = base64.b64encode(raw).decode("ascii")
    payload = {
        "config": build_config(),
        "audio": {"content": audio_b64}
    }
    print(payload, audio_b64)

    # 중요한 포인트: 요청 시점에 키/엔드포인트 구성
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY가 설정되지 않았습니다 (.env 또는 환경변수).")
    stt_endpoint = f"https://speech.googleapis.com/v1/speech:recognize?key={api_key}"

    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(stt_endpoint, json=payload)
        if r.status_code != 200:
            try:
                err = r.json()
            except Exception:
                err = {"error": r.text}
            raise HTTPException(status_code=502, detail={"google_error": err})

        data = r.json()
        results = data.get("results", [])
        text = " ".join(
            alt.get("transcript", "")
            for res in results
            for alt in res.get("alternatives", [])[:1]
        ).strip()
        print(data, results, text)
        # 빈 텍스트일 때 디버그 힌트
        if not text:
            log.info("Empty transcript. Check LANG/ENCODING/rate and audio content.")
        return STTResponse(text=text, raw=data)