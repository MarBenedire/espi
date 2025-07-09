import React, { useState, useRef } from "react";

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const audioChunks = useRef([]);

  const handleFileChange = (e) => {
    setAudioFile(e.target.files[0]);
    setAudioUrl(URL.createObjectURL(e.target.files[0]));
  };

  const handleUpload = async () => {
    if (!audioFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", audioFile);
    const res = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  const handleRecord = async () => {
    if (recording) {
      mediaRecorder.stop();
      setRecording(false);
    } else {
      if (!navigator.mediaDevices) {
        alert("Audio recording not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new window.MediaRecorder(stream);
      audioChunks.current = [];
      recorder.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        setAudioFile(new File([audioBlob], "recording.webm"));
        setAudioUrl(URL.createObjectURL(audioBlob));
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    }
  };

  const downloadText = (filename, text) => {
    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const downloadDocx = async (filename, text) => {
    // Simple .docx: just use text/plain with .docx extension for now
    const blob = new Blob([text], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-6">ESPI Meeting Transcriber</h1>
      <div className="bg-white p-6 rounded shadow w-full max-w-xl mb-6">
        <input type="file" accept="audio/*" onChange={handleFileChange} className="mb-4" />
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleRecord}
            className={`px-4 py-2 rounded ${recording ? "bg-red-600" : "bg-green-600"} text-white`}
            disabled={loading}
          >
            {recording ? "Stop Recording" : "Record Audio"}
          </button>
          {audioUrl && (
            <audio controls src={audioUrl} className="h-10" />
          )}
        </div>
        <button
          onClick={handleUpload}
          disabled={!audioFile || loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Transcribing..." : "Upload & Transcribe"}
        </button>
      </div>
      {result && (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-2">Original Transcript ({result.language})</h2>
            <div className="whitespace-pre-wrap text-sm mb-2">
              {result.diarized.map((seg, i) => (
                <div key={i}><b>{seg.speaker}:</b> {seg.text}</div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                className="bg-gray-200 px-2 py-1 rounded text-xs"
                onClick={() => downloadText("transcript.txt", result.transcript)}
              >
                Download .txt
              </button>
              <button
                className="bg-gray-200 px-2 py-1 rounded text-xs"
                onClick={() => downloadDocx("transcript.docx", result.transcript)}
              >
                Download .docx
              </button>
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-2">English Translation</h2>
            <div className="whitespace-pre-wrap text-sm mb-2">{result.translation}</div>
            <h2 className="font-semibold mt-4 mb-2">Summary</h2>
            <div className="whitespace-pre-wrap text-sm mb-2">{result.summary}</div>
            <div className="flex gap-2 mt-2">
              <button
                className="bg-gray-200 px-2 py-1 rounded text-xs"
                onClick={() => downloadText("summary.txt", result.summary)}
              >
                Download .txt
              </button>
              <button
                className="bg-gray-200 px-2 py-1 rounded text-xs"
                onClick={() => downloadDocx("summary.docx", result.summary)}
              >
                Download .docx
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 