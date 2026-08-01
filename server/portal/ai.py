"""Groq-powered symptom checker.

Uses Groq's OpenAI-compatible chat completions API via the standard library so
no extra dependency is added. The key lives in the environment (never shipped to
the app), and the model is instructed to triage — not diagnose — and to always
steer the user toward a real clinician, with Cameroon-appropriate advice.
"""
import json
import urllib.error
import urllib.request

from django.conf import settings

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = (
    "You are CamHealth Assistant, a friendly health guide for patients in Cameroon. "
    "You are NOT a doctor and must never give a definitive diagnosis or prescribe. "
    "Given a person's symptoms, you: (1) reflect back what you understood, "
    "(2) suggest possible common causes in plain language, "
    "(3) give safe self-care advice, and "
    "(4) clearly recommend whether to book a consultation, and how urgently. "
    "Always name RED-FLAG symptoms that need immediate care (e.g. difficulty breathing, "
    "severe bleeding, chest pain, convulsions, stiff neck with fever, sign of severe "
    "dehydration, high fever in an infant). Malaria and typhoid are common in Cameroon — "
    "if fever is present, advise getting tested. Keep answers short, warm and easy to read "
    "with a few bullet points. End with: 'This is general guidance, not a diagnosis — "
    "please book a consultation on CamHealth for proper care.'"
)


def call_groq(messages, max_tokens=600, temperature=0.4):
    if not settings.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured on the server.")
    body = json.dumps({
        "model": settings.GROQ_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }).encode()
    req = urllib.request.Request(GROQ_URL, data=body, method="POST")
    req.add_header("Authorization", f"Bearer {settings.GROQ_API_KEY}")
    req.add_header("Content-Type", "application/json")
    # A real User-Agent is required — Groq's edge blocks the default urllib UA.
    req.add_header("User-Agent", "CamHealth/1.0 (+https://www.ndimihboclair.com)")
    with urllib.request.urlopen(req, timeout=45) as resp:
        data = json.loads(resp.read().decode())
    return data["choices"][0]["message"]["content"].strip()


def symptom_reply(message, history=None):
    """history: list of {role, content} from earlier turns (optional)."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for turn in (history or [])[-8:]:
        role = "assistant" if turn.get("role") == "assistant" else "user"
        messages.append({"role": role, "content": str(turn.get("content", ""))[:2000]})
    messages.append({"role": "user", "content": str(message)[:2000]})
    return call_groq(messages)
