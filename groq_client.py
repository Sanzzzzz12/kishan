import os
import requests
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def groq_generate(content_prompt: str, user_message: str):
    url = "https://api.groq.com/openai/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": content_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.45,
        "max_tokens": 400
    }

    r = requests.post(url, json=payload, headers=headers, timeout=60)
    r.raise_for_status()

    return r.json()["choices"][0]["message"]["content"]


def generate_content(prompt: str, lang: str) -> dict:
    try:
        if lang == "ne":
            content_prompt = (
                 "You are a friendly chatbot from Nepal.\n"
                "Reply in natural Nepali-English mix as spoken in Nepal.\n"
                "Sound casual, like friends chatting.\n"
                "You may use words like bro, yaar, nai, kkk when natural.\n"
                "STRICT RULE:\n"
                "- Do NOT use Hindi or Hinglish words (kya, baat, tum, main, batao).\n"
                "- Use only Nepali or English words common in Nepal.\n"
                "- Do NOT sound Indian.\n"
                "Keep replies short, clear, and helpful.\n"
                "Avoid formal, academic, or robotic tone.\n"
            )
        else:
            content_prompt = (
                "You are a friendly chatbot.\n"
                "Reply clearly in English.\n"
                "Keep replies short and natural.\n"
            )

        content = groq_generate(content_prompt, prompt)
        return {"content": content}

    except Exception as e:
        return {"error": str(e)}