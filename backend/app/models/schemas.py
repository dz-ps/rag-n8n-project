from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ChatRequest(BaseModel):
    message: str
    context_file_ids: Optional[List[str]] = None
    history: Optional[List[Dict[str, str]]] = None

class ChatResponse(BaseModel):
    response: str
    sources: List[Dict[str, Any]]
    context_used: bool

class DocumentResponse(BaseModel):
    id: str
    filename: str
    status: str
    chunk_count: Optional[int] = None
    error: Optional[str] = None

class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: int
    filename: Optional[str] = None
    document_id: Optional[str] = None
    error: Optional[str] = None
