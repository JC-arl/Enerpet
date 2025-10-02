import os
import base64
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

# 환경변수: GOOGLE_API_KEY, LANGUAGE_CODE, SAMPLE_RATE, ENCODING
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
LANGUAGE_CODE = os.getenv("LANGUAGE_CODE", "ko-KR")
# SAMPLE_RATE는 WAV/FLAC는 헤더로 추론되는 경우가 많아 생략 가능하지만
# 원시 PCM 등일 땐 지정 권장 (예: 16000)
SAMPLE_RATE = os.getenv("SAMPLE_RATE")
# ENCODING: LINEAR16, WEBM_OPUS, OGG_OPUS 등 (WAV/FLAC은 생략 가능)
ENCODING = os.getenv("ENCODING")  # 예: "WEBM_OPUS"

if not GOOGLE_API_KEY:
    raise RuntimeError("GOOGLE_API_KEY 환경변수를 설정하세요.")

app = FastAPI(title="Google Cloud STT (v1, API Key)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포시 도메인 제한 권장
    allow_methods=["*"],
    allow_headers=["*"],
)

STT_ENDPOINT = f"https://speech.googleapis.com/v1/speech:recognize?key={GOOGLE_API_KEY}"

MAX_REQUEST_BYTES = 10 * 1024 * 1024  # 10MB (요청 전체 크기 기준) - 권고치 체크용

def build_config():
    cfg = {
        "languageCode": LANGUAGE_CODE,
        "enableAutomaticPunctuation": True,
    }
    if ENCODING:
        cfg["encoding"] = ENCODING
    if SAMPLE_RATE:
        try:
            cfg["sampleRateHertz"] = int(SAMPLE_RATE)
        except ValueError:
            pass
    return cfg

@app.post("/stt")
async def stt(file: UploadFile = File(...)):
    """
    동기 인식 (짧은 음성용, ~60초 / 요청 10MB 이내 권장)
    프론트는 wav/ogg/webm 등을 업로드.
    """
    data = await file.read()

    # 요청 10MB 제한을 맞추기 위해 대략적인 가드
    # base64 인코딩하면 크기가 ~1.33배 늘어난다는 점을 감안
    estimated_req = len(data) * 4 // 3
    if estimated_req > MAX_REQUEST_BYTES:
        raise HTTPException(
            status_code=413,
            detail="파일이 너무 큽니다. 10MB 이하로 보내거나 GCS URI 방식(백엔드에서 업로드)으로 전환하세요."
        )

    audio_b64 = base64.b64encode(data).decode("ascii")

    payload = {
        "config": build_config(),
        "audio": {"content": audio_b64}
    }

    # Google STT v1 REST 호출
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(STT_ENDPOINT, json=payload)
        if r.status_code != 200:
            # Google 에러 메시지 전달
            try:
                err = r.json()
            except Exception:
                err = {"error": r.text}
            raise HTTPException(status_code=502, detail={"google_error": err})

        resp = r.json()
        # 결과 합치기
        results = resp.get("results", [])
        transcript = " ".join(
            alt.get("transcript", "")
            for res in results
            for alt in res.get("alternatives", [])[:1]
        ).strip()

        return {
            "text": transcript,
            "raw": resp  # 필요 없으면 제거
        }

@app.get("/health")
def health():
    return {"status": "ok"}