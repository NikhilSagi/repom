from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import asyncio
import os
from src.frontend.call_agent import AgentCaller

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class ChatRequest(BaseModel):
    message: str
    user_id: str
    chat_id: str
    file_paths: Optional[List[str]] = []
    agent_mode: Optional[str] = "unified"

class ChatResponse(BaseModel):
    response: str

# Global AgentCaller instance (simplified for now)
# In a real app, you might want to manage instances per user/session or use a dependency injection system
agent_caller = AgentCaller()

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message to the agent and get a response.
    """
    # Mocking st.session_state for AgentCaller compatibility (temporary hack)
    # Ideally AgentCaller should be refactored to not depend on streamlit
    import streamlit as st
    if not hasattr(st, "session_state"):
        st.session_state = {}
    
    st.session_state["agent_mode"] = request.agent_mode
    # Ensure messages list exists
    if "messages" not in st.session_state:
        st.session_state["messages"] = []
    
    # Process the message
    response = agent_caller.create_chat_completion(
        messages=request.message,
        user_id=request.user_id,
        chat_id=request.chat_id,
        file_paths=request.file_paths
    )
    
    return ChatResponse(response=response)

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
