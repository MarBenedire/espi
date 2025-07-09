import os
import tempfile
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel
import requests
from transformers import pipeline
import uvicorn

app = FastAPI()

# Load Whisper model (tiny for serverless)
whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")

# Load summarization pipeline (T5-small)
summarizer = pipeline("summarization", model="t5-small")

def diarize_dummy(transcript):
    # Dummy diarization: alternate speakers every 5 sentences
    sentences = transcript.split('. ')
    diarized = []
    for i, sent in enumerate(sentences):
        speaker = f"Speaker {i%2+1}"
        diarized.append({"speaker": speaker, "text": sent})
    return diarized

@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)):
    # Save uploaded file to temp
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    # Transcribe
    segments, info = whisper_model.transcribe(tmp_path, beam_size=1)
    transcript = " ".join([seg.text for seg in segments])
    # Dummy diarization
    diarized = diarize_dummy(transcript)
    # Detect language
    lang = info["language"] if "language" in info else "unknown"
    # Translate to English using LibreTranslate public instance
    resp = requests.post(
        "https://libretranslate.de/translate",
        data={"q": transcript, "source": lang, "target": "en"}
    )
    translation = resp.json().get("translatedText", "")
    # Summarize
    summary = summarizer(transcript, max_length=100, min_length=20, do_sample=False)[0]["summary_text"]
    # Clean up temp file
    os.remove(tmp_path)
    return JSONResponse({
        "transcript": transcript,
        "diarized": diarized,
        "language": lang,
        "translation": translation,
        "summary": summary
    })

# For local testing
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 