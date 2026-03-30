from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
import json
import asyncio
import os
import hashlib
import joblib
import shutil
import datetime
import time
import random
import pathlib

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Helper constants / paths
# ─────────────────────────────────────────────
DATA_DIR = "data/"
os.makedirs(DATA_DIR, exist_ok=True)


def _users_path():
    return os.path.join(DATA_DIR, "users")


def _past_chats_path(user_id: str):
    return os.path.join(DATA_DIR, f"{user_id}_past_chats")


def _messages_path(user_id: str, chat_id: str):
    return os.path.join(DATA_DIR, f"{user_id}_{chat_id}_messages")


def _display_messages_path(user_id: str, chat_id: str):
    return os.path.join(DATA_DIR, f"{user_id}_{chat_id}_display_messages")


def _work_dir(user_id: str, chat_id: str) -> str:
    pwd = os.getcwd()
    p = os.path.join(pwd, "coding", user_id, chat_id)
    os.makedirs(p, exist_ok=True)
    return p


# ─────────────────────────────────────────────
# Joblib helpers
# ─────────────────────────────────────────────
def _load(path):
    try:
        return joblib.load(path)
    except FileNotFoundError:
        return None


def _save(path, data):
    joblib.dump(data, path)


# ─────────────────────────────────────────────
# Auth helpers
# ─────────────────────────────────────────────
def _hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


def _generate_user_id(username: str, password: str) -> str:
    return hashlib.sha256(f"{username}:{password}".encode()).hexdigest()


def _generate_short_id(length: int = 6) -> str:
    chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    return "".join(random.choice(chars) for _ in range(length))


def _generate_chat_id() -> str:
    return f"{time.time()}".replace(".", "_")


# ─────────────────────────────────────────────
# Request / Response models
# ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    user_id: str
    chat_id: str
    file_paths: Optional[List[str]] = []
    agent_mode: Optional[str] = "unified"


class ChatResponse(BaseModel):
    response: str


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    user_id: str
    username: str
    message: str


class ChatInfo(BaseModel):
    chat_id: str
    title: str
    timestamp: Optional[str] = None
    message_count: int = 0


class MessageItem(BaseModel):
    role: str
    content: str
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None


# ─────────────────────────────────────────────
# AgentCaller lazy initialisation (avoids st import at module level)
# ─────────────────────────────────────────────
_agent_caller_cache: Dict[str, object] = {}


def _get_agent_caller(agent_mode: str = "unified", work_dir: str = ""):
    """Return a cached AgentCaller, keyed by work_dir."""
    from src.frontend.call_agent import AgentCaller as _AC
    import types

    # Provide a minimal fake streamlit session_state so AgentCaller can init
    try:
        import streamlit as _st
        class _DummyState(dict):
            def __getattr__(self, key):
                if key in self: return self[key]
                raise AttributeError(key)
            __setattr__ = dict.__setitem__
            __delattr__ = dict.__delitem__
        if not hasattr(_st, "session_state") or not isinstance(_st.session_state, _DummyState):
            _st.session_state = _DummyState()
    except Exception:
        pass

    try:
        import streamlit as _st
        _st.session_state["work_dir"] = work_dir or os.path.join(os.getcwd(), "coding", "api")
        _st.session_state["agent_mode"] = agent_mode
        if "messages" not in _st.session_state:
            _st.session_state["messages"] = []
    except Exception:
        pass

    cache_key = work_dir or "default"
    if cache_key not in _agent_caller_cache:
        _agent_caller_cache[cache_key] = _AC()
    return _agent_caller_cache[cache_key]


# ─────────────────────────────────────────────
# ──  AUTH ENDPOINTS  ──
# ─────────────────────────────────────────────
@app.post("/api/auth/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    users = _load(_users_path()) or {}
    if req.username in users:
        raise HTTPException(status_code=409, detail="Username already exists")
    users[req.username] = _hash_password(req.password)
    _save(_users_path(), users)
    user_id = _generate_user_id(req.username, req.password)
    return AuthResponse(user_id=user_id, username=req.username, message="Account created successfully")


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    users = _load(_users_path()) or {}
    if req.username not in users or users[req.username] != _hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    user_id = _generate_user_id(req.username, req.password)
    return AuthResponse(user_id=user_id, username=req.username, message="Login successful")


# ─────────────────────────────────────────────
# ──  CHAT HISTORY ENDPOINTS  ──
# ─────────────────────────────────────────────
@app.get("/api/chats/{user_id}", response_model=List[ChatInfo])
async def list_chats(user_id: str):
    past_chats: dict = _load(_past_chats_path(user_id)) or {}
    result = []
    for chat_id, title in sorted(past_chats.items(), key=lambda x: float(x[0].replace("_", ".")), reverse=True):
        msgs = _load(_messages_path(user_id, chat_id)) or []
        display_msgs = _load(_display_messages_path(user_id, chat_id)) or []
        if not display_msgs:
            continue  # only show chats that have actual messages
        try:
            ts = datetime.datetime.fromtimestamp(float(chat_id.replace("_", "."))).strftime("%m/%d %H:%M")
        except Exception:
            ts = ""
        result.append(ChatInfo(
            chat_id=chat_id,
            title=title,
            timestamp=ts,
            message_count=len(msgs),
        ))
    return result


@app.delete("/api/chats/{user_id}/{chat_id}")
async def delete_chat(user_id: str, chat_id: str):
    past_chats: dict = _load(_past_chats_path(user_id)) or {}
    if chat_id in past_chats:
        del past_chats[chat_id]
        _save(_past_chats_path(user_id), past_chats)
    # Delete files
    for suffix in ["_messages", "_display_messages"]:
        p = os.path.join(DATA_DIR, f"{user_id}_{chat_id}{suffix}")
        if os.path.exists(p):
            os.remove(p)
    # Delete work dir
    wd = os.path.join(os.getcwd(), "coding", user_id, chat_id)
    if os.path.exists(wd):
        shutil.rmtree(wd, ignore_errors=True)
    return {"status": "deleted"}


@app.get("/api/chats/{user_id}/{chat_id}/messages")
async def get_chat_messages(user_id: str, chat_id: str):
    display_msgs = _load(_display_messages_path(user_id, chat_id)) or []
    msgs = _load(_messages_path(user_id, chat_id)) or []
    return {"messages": msgs, "display_messages": display_msgs}


@app.post("/api/chats/{user_id}/new")
async def create_new_chat(user_id: str):
    chat_id = _generate_chat_id()
    title = f"Chat-{datetime.datetime.now().strftime('%m/%d %H:%M')}"
    past_chats: dict = _load(_past_chats_path(user_id)) or {}
    past_chats[chat_id] = title
    _save(_past_chats_path(user_id), past_chats)
    _work_dir(user_id, chat_id)
    return {"chat_id": chat_id, "title": title}


# ─────────────────────────────────────────────
# ──  FILE UPLOAD ENDPOINT  ──
# ─────────────────────────────────────────────
@app.post("/api/upload")
async def upload_files(
    user_id: str = Form(...),
    chat_id: str = Form(...),
    files: List[UploadFile] = File(...)
):
    wd = _work_dir(user_id, chat_id)
    saved = []
    for f in files:
        safe = _safe_filename(f.filename)
        dest = os.path.join(wd, safe)
        content = await f.read()
        with open(dest, "wb") as fp:
            fp.write(content)
        saved.append(dest)
    return {"file_paths": saved}


def _safe_filename(name: str) -> str:
    import re
    safe = re.sub(r"[^\w\-_\.]", "_", name)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    parts = safe.rsplit(".", 1)
    return f"{parts[0]}_{ts}.{parts[1]}" if len(parts) == 2 else f"{safe}_{ts}"


# ─────────────────────────────────────────────
# ──  FILE BROWSER  ──
# ─────────────────────────────────────────────
@app.get("/api/files/{user_id}/{chat_id}")
async def list_files(user_id: str, chat_id: str):
    wd = _work_dir(user_id, chat_id)
    files = []
    for root, _, fnames in os.walk(wd):
        for fname in fnames:
            fpath = os.path.join(root, fname)
            rel = os.path.relpath(fpath, wd)
            size = os.path.getsize(fpath)
            files.append({"name": fname, "path": fpath, "relative": rel, "size": size})
    return {"files": files, "work_dir": wd}


# ─────────────────────────────────────────────
# ──  CHAT / AGENT  ──
# ─────────────────────────────────────────────
@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    import streamlit as st

    wd = _work_dir(request.user_id, request.chat_id)

    try:
        class _DummyState(dict):
            def __getattr__(self, key):
                if key in self: return self[key]
                raise AttributeError(key)
            __setattr__ = dict.__setitem__
            __delattr__ = dict.__delitem__
        if not hasattr(st, "session_state") or not isinstance(st.session_state, _DummyState):
            st.session_state = _DummyState()
    except Exception:
        pass

    st.session_state["agent_mode"] = request.agent_mode
    st.session_state["work_dir"] = wd
    if "messages" not in st.session_state:
        # Load persisted messages
        st.session_state["messages"] = _load(_messages_path(request.user_id, request.chat_id)) or []
    if "display_messages" not in st.session_state:
        st.session_state["display_messages"] = _load(_display_messages_path(request.user_id, request.chat_id)) or []

    caller = _get_agent_caller(request.agent_mode, wd)
    response = caller.create_chat_completion(
        messages=request.message,
        user_id=request.user_id,
        chat_id=request.chat_id,
        file_paths=request.file_paths,
    )

    # Persist state
    _save(_messages_path(request.user_id, request.chat_id), st.session_state.get("messages", []))
    _save(_display_messages_path(request.user_id, request.chat_id), st.session_state.get("display_messages", []))

    # Ensure past_chats updated
    past_chats = _load(_past_chats_path(request.user_id)) or {}
    if request.chat_id not in past_chats:
        past_chats[request.chat_id] = f"Chat-{datetime.datetime.now().strftime('%m/%d %H:%M')}"
        _save(_past_chats_path(request.user_id), past_chats)

    return ChatResponse(response=response or "")


# ─────────────────────────────────────────────
# ──  HEALTH  ──
# ─────────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


# ─────────────────────────────────────────────
# ──  SERVE REACT BUILD (production)  ──
# ─────────────────────────────────────────────
_react_dist = pathlib.Path(__file__).parent.parent / "frontend" / "react_app" / "dist"

if _react_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(_react_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        return FileResponse(str(_react_dist / "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
