import base64
import io
import math
import os
import struct
import time
import wave
import json
import logging
from datetime import datetime
from collections import defaultdict
from typing import Dict, Any, Tuple

import requests
from flask import Flask, jsonify, request, send_from_directory, abort


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("astro.app")

app = Flask(__name__, static_folder="static", static_url_path="/static")

PRIMARY_MODEL = os.getenv("GROQ_PRIMARY_MODEL", "openai/gpt-oss-120b")
FALLBACK_MODEL = os.getenv("GROQ_FALLBACK_MODEL", "llama-3.3-70b-versatile")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
# Updated Configuration
GROQ_TTS_MODEL = "playai-tts"
GROQ_TTS_VOICE = "Aaliyah-PlayAI"
GROQ_STT_MODEL = "whisper-large-v3"

# API Endpoints
CHAT_PATH = "https://api.groq.com/openai/v1/chat/completions"
TTS_PATH = "https://api.groq.com/openai/v1/audio/speech"
STT_PATH = "https://api.groq.com/openai/v1/audio/transcriptions"

# Fallback Configuration
FALLBACK_TTS_VOICES = ["Aaliyah-PlayAI", "en-US-AriaNeural", "en-GB-SoniaNeural"]
FALLBACK_TTS_FORMATS = ["mp3", "wav"]
FALLBACK_BEEP_BASE64 = "UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"  # Short truncated beep for fallback

def error_response(status_code: int, message: str, hint: str = "") -> Tuple[Any, int]:
    payload = {"error": {"message": message}}
    if hint:
        payload["error"]["hint"] = hint
    return jsonify(payload), status_code

def perform_request_with_retry(method: str, url: str, headers: Dict[str, str], json: Dict[str, Any] = None, files: Dict[str, Any] = None, data: Dict[str, Any] = None, retries: int = 3) -> Tuple[requests.Response, Any]:
    for attempt in range(retries):
        try:
            resp = requests.request(method, url, headers=headers, json=json, files=files, data=data, timeout=30)
            if resp.status_code == 429:
                time.sleep(2 ** attempt)  # Exponential backoff
                continue
            try:
                return resp, resp.json()
            except ValueError:
                return resp, resp.text
        except requests.RequestException:
            if attempt == retries - 1:
                raise
            time.sleep(1)
    raise requests.Timeout("Max retries exceeded")

def invoke_chat_model(message: str, context: Dict[str, Any], local_birth: Dict[str, Any], chart_data: Dict[str, Any], is_voice: bool = False, history: list = None) -> Dict[str, Any]:
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    
    current_date = datetime.now().strftime("%Y-%m-%d")
    
    # Conditional Language Instruction
    if is_voice:
        lang_instruction = "**LANGUAGE**: You MUST speak in pure, elegant English only. Do NOT use Hindi or Hinglish."
    else:
        lang_instruction = "**LANGUAGE**: You MUST mix English and Hindi (Hinglish) naturally. Example: 'Tumhara Sun strong hai, but Rahu thoda pareshan kar sakta hai.'"

    system_prompt = (
        f"You are Astrix, a powerful and cool Vedic & KP Astrologer. Current Date: {current_date}.\n"
        "You speak in a natural, engaging, and slightly mysterious tone. "
        f"{lang_instruction}\n\n"
        "RULES:\n"
        "1. **KP & Vedic Analysis**: Use the 'kp_table' and 'planets' data. Mention Star Lords (Nakshatra Lords) and Sub Lords when predicting. "
        "   - Example: 'Since your Moon is in the star of Venus and sub of Rahu...'\n"
        "2. **Time Context**: You know the Current Date. If a Dasha or event is in the PAST relative to {current_date}, discuss it as a PAST event (e.g., 'In 2020, you might have felt...'). Do NOT predict it as future.\n"
        "3. **Human-like Flow**: Do NOT write one giant paragraph. Break your response into multiple short, punchy messages.\n"
        "4. **No Formatting**: Plain text only. No bold/italics.\n"
        "5. **Reactions**: Include a 'reaction' emoji if appropriate.\n"
        "6. **UI Commands**: If the user asks to see their chart, or if you are explaining the chart in detail, include a 'command' field with value 'SHOW_CHART'.\n"
        "7. **Dated Predictions**: ONLY mention specific dates if the user explicitly asks for 'When will X happen?' or 'Daily Horoscope'. Otherwise, focus on the current period (Dasha).\n"
        "8. **Output Format**: You MUST return a JSON object with 'messages' (list), 'reaction' (string), and optional 'command' (string).\n"
        "   - Example: {{\"messages\": [\"Here is your chart.\"], \"command\": \"SHOW_CHART\"}}"
    )

    base_payload = {
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
        ],
        "temperature": 0.7,
        "max_completion_tokens": 1024,
        "top_p": 0.95,
        "stream": False,
        "response_format": {"type": "json_object"},
    }
    
    if context:
        base_payload["messages"].append({
            "role": "system",
            "content": f"Previous Context: {json.dumps(context, ensure_ascii=False)}",
        })
    
    if chart_data:
        essential_chart = {
            "planets": chart_data.get("planets"),
            "houses": chart_data.get("houses"),
            "ascendant": chart_data.get("ascendant"),
            "kp_table": chart_data.get("kp_table"),
            "vimshottari": chart_data.get("vimshottari", {}).get("current"),
        }
        base_payload["messages"].append({
            "role": "system",
            "content": f"USER'S CHART (KP & Vedic Data): {json.dumps(essential_chart, ensure_ascii=False)}",
        })
    elif local_birth:
        base_payload["messages"].append({
            "role": "system",
            "content": f"Birth Details: {json.dumps(local_birth, ensure_ascii=False)}",
        })

    # Append History (Last N messages)
    if history:
        # Validate and sanitize history
        for msg in history:
            if isinstance(msg, dict) and "role" in msg and "content" in msg:
                # Ensure role is valid
                if msg["role"] in ["user", "assistant"]:
                    base_payload["messages"].append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })
        
    base_payload["messages"].append({"role": "user", "content": message})
    meta = {"model": PRIMARY_MODEL, "fallback_used": False}
    
    try:
        response, data = perform_request_with_retry("POST", CHAT_PATH, headers, json={**base_payload, "model": PRIMARY_MODEL})
        if response.status_code != 200:
            raise requests.HTTPError(f"Status {response.status_code}")
        return {"raw": data, "meta": meta}
    except Exception as primary_exc:
        logger.warning("Primary model failed: %s", primary_exc)
        meta["fallback_used"] = True
        meta["model"] = FALLBACK_MODEL
        response, data = perform_request_with_retry("POST", CHAT_PATH, headers, json={**base_payload, "model": FALLBACK_MODEL})
        return {"raw": data, "meta": meta}


def extract_message_content(chat_payload: Dict[str, Any]) -> Tuple[list, str, str]:
    choices = chat_payload.get("choices", [])
    if not choices:
        return [], "", ""
    content = choices[0].get("message", {}).get("content", "").strip()
    try:
        data = json.loads(content)
        messages = data.get("messages", [])
        if isinstance(messages, str):
            messages = [messages]
        return messages, data.get("reaction", ""), data.get("command", "")
    except json.JSONDecodeError:
        return [content], "", ""


def invoke_stt(audio_file) -> Dict[str, Any]:
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
    # Reset file pointer just in case
    audio_file.seek(0)
    files = {
        "file": (audio_file.filename, audio_file.read(), audio_file.content_type),
        "model": (None, "whisper-large-v3"),
        "temperature": (None, "0"),
        "response_format": (None, "verbose_json"),
    }
    response, data = perform_request_with_retry("POST", STT_PATH, headers, files=files)
    if response.status_code != 200:
        raise requests.HTTPError(f"Status {response.status_code}")
    return data


def invoke_tts(text: str) -> Dict[str, Any]:
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "playai-tts",
        "voice": "Cillian-PlayAI",
        "input": text,
        "response_format": "wav",
    }
    
    try:
        resp = requests.post(TTS_PATH, headers=headers, json=payload, timeout=30)
        if resp.status_code != 200:
            raise requests.HTTPError(f"Status {resp.status_code}: {resp.text}")
            
        # Convert to base64 for frontend
        audio_b64 = base64.b64encode(resp.content).decode("utf-8")
        return {
            "audio_base64": audio_b64,
            "format": "wav",
            "voice": "Cillian-PlayAI"
        }
    except Exception as e:
        logger.error(f"TTS Failed: {e}")
        raise


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    if not GROQ_API_KEY:
        return error_response(500, "Internal configuration error", "Set GROQ_API_KEY")
    try:
        payload = request.get_json(force=True)
    except Exception:  # noqa: BLE001
        return error_response(400, "Missing request body", "Send JSON payload")

    message = payload.get("message")
    if not message:
        return error_response(400, "Missing required field: message", "Provide chat message text")

    context = payload.get("context", {})
    local_birth = payload.get("local_birth", {})
    chart_data = payload.get("chart_data", {})
    is_voice = payload.get("is_voice", False)
    history = payload.get("history", [])

    try:
        # Log the incoming request for debugging
        logger.info(f"Chat request: {message[:50]}... Context: {context.keys()}")
        
        chat_result = invoke_chat_model(message, context, local_birth, chart_data, is_voice=is_voice, history=history)
        messages, reaction, command = extract_message_content(chat_result["raw"])
        
        if not messages:
            messages = ["The stars are silent right now. Try again?"]
            
    except requests.HTTPError as http_err:
        logger.exception("Chat upstream unavailable: %s", http_err)
        return error_response(503, "Upstream service unavailable", "Try again later")
    except Exception as exc:
        logger.exception("Unexpected chat pipeline error: %s", exc)
        # Return the actual error message for debugging (in dev mode)
        return error_response(500, "Internal calculation failure", str(exc))

    audio_warning = None
    tts_payload = None
    
    # Only generate audio if it was a voice interaction
    if is_voice:
        # Combine messages for TTS, or just speak the first/summary
        # Speaking all might be too long, let's speak the first 2 sentences or full text
        full_text = " ".join(messages)
        try:
            tts_payload = invoke_tts(full_text)
        except requests.HTTPError as http_err:
            audio_warning = "tts_unavailable"
            logger.warning("TTS request failed: %s", http_err)
        except Exception as exc:  # noqa: BLE001
            audio_warning = "tts_error"
            logger.exception("Unexpected TTS error: %s", exc)
        else:
            if tts_payload and tts_payload.get("warning"):
                audio_warning = tts_payload.get("warning")

    response_body = {
        "meta": {
            "model": chat_result["meta"]["model"],
            "fallback_used": chat_result["meta"]["fallback_used"],
        },
        "messages": messages, # Return list of strings
        "reaction": reaction,
        "command": command,
        "audio": tts_payload,
    }
    if audio_warning:
        response_body["meta"]["audio_warning"] = audio_warning
    return jsonify(response_body)


@app.route("/api/stt", methods=["POST"])
def speech_to_text():
    if not GROQ_API_KEY:
        return error_response(500, "Internal configuration error", "Set GROQ_API_KEY")
    if "file" not in request.files:
        return error_response(400, "Missing required field: file", "Attach audio file under 'file'")
    audio_file = request.files["file"]
    if not audio_file.filename:
        return error_response(422, "Invalid file", "Provide a valid audio recording")
    try:
        transcript = invoke_stt(audio_file)
    except requests.HTTPError:
        logger.exception("STT upstream unavailable")
        return error_response(503, "Speech service unavailable", "Try again later")
    except Exception:
        logger.exception("Unexpected STT error")
        return error_response(500, "Internal calculation failure", "Check inputs or open an issue")

    text = transcript.get("text", "")
    confidence = transcript.get("confidence", None)
    return jsonify({"transcript": text, "confidence": confidence, "raw": transcript})


@app.route("/api/tts", methods=["POST"])
def text_to_speech():
    if not GROQ_API_KEY:
        return error_response(500, "Internal configuration error", "Set GROQ_API_KEY")
    try:
        payload = request.get_json(force=True)
    except Exception:  # noqa: BLE001
        return error_response(400, "Missing request body", "Send JSON payload")
    text = payload.get("text")
    if not text:
        return error_response(400, "Missing required field: text", "Provide text to synthesize")
    try:
        data = invoke_tts(text)
    except requests.HTTPError:
        logger.exception("TTS upstream unavailable")
        return error_response(503, "Voice service unavailable", "Try again later")
    except Exception:
        logger.exception("Unexpected TTS error")
        return error_response(500, "Internal calculation failure", "Check inputs or open an issue")
    return jsonify(data)


@app.errorhandler(404)
def not_found(_err):
    return error_response(404, "Endpoint not found", "Check the route path")


if __name__ == "__main__":
    app.run(debug=True)
