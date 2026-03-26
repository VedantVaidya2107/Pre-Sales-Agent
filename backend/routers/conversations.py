from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from utils.supabase_client import supabase

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])

class ConversationData(BaseModel):
    convo: List[dict]
    rn: int
    discovery_complete: bool

@router.get("/{client_id}")
async def get_conversation(client_id: str):
    try:
        res = supabase.table("conversations").select("*").eq("client_id", client_id).execute()
        if res.data:
            return res.data[0]
        return {"convo": [], "rn": 0, "discovery_complete": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{client_id}")
async def save_conversation(client_id: str, data: ConversationData):
    try:
        # Upsert conversation
        payload = {
            "client_id": client_id,
            "convo": data.convo,
            "rn": data.rn,
            "discovery_complete": data.discovery_complete,
            "updated_at": "now()"
        }
        res = supabase.table("conversations").upsert(payload, on_conflict="client_id").execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
