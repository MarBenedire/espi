import os
import tempfile
from flask import Flask, request, jsonify
from faster_whisper import WhisperModel
import requests
from transformers import pipeline

app = Flask(__name__)

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

@app.route("/api/transcribe", methods=["POST"])
def transcribe():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    # Save uploaded file to temp
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        file.save(tmp)
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
    return jsonify({
        "transcript": transcript,
        "diarized": diarized,
        "language": lang,
        "translation": translation,
        "summary": summary
    })

# For local testing
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000) 