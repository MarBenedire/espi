from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route("/", methods=["POST"])
def transcribe():
    return jsonify({"status": "ok", "method": request.method})

if __name__ == "__main__":
    app.run() 