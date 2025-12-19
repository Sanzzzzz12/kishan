from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from groq_client import generate_content

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return render_template("chat.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True)
    user_message = data.get("message", "").strip()
    lang = data.get("lang", "en")

    if not user_message:
        return jsonify({"reply": "Empty message"}), 400


    result = generate_content(user_message, lang)

    if "error" in result:
        return jsonify({"reply": result["error"]}), 500

    return jsonify({"reply": result["content"]})

if __name__ == "__main__":
    app.run(debug=True)
