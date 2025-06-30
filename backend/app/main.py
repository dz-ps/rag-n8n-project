from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import asyncio
import logging
from typing import Dict, Any, Optional, List
import uuid
import os
from datetime import datetime

from services.document_service import DocumentService
from services.vector_service import VectorService
from services.chat_service import ChatService
from models.schemas import ChatRequest, ChatResponse, DocumentResponse
from utils.config import get_settings

# Configuração
settings = get_settings()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicialização da aplicação
app = FastAPI(
    title="RAG API with n8n Integration",
    description="API RAG integrada com n8n para automação",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serviços
document_service = DocumentService()
vector_service = VectorService()
chat_service = ChatService()

# Armazenamento de jobs em processamento
processing_jobs: Dict[str, Dict[str, Any]] = {}

@app.post("/process-document")
async def process_document_from_n8n(
    background_tasks: BackgroundTasks,
    file_url: str,
    filename: str,
    file_id: str
):
    """Endpoint chamado pelo n8n para processar documentos"""
    try:
        job_id = str(uuid.uuid4())
        
        # Inicializar job
        processing_jobs[job_id] = {
            "status": "processing",
            "filename": filename,
            "file_id": file_id,
            "started_at": datetime.now(),
            "progress": 0
        }
        
        # Processar em background
        background_tasks.add_task(
            process_document_background,
            job_id, file_url, filename, file_id
        )
        
        return {
            "status": "success",
            "job_id": job_id,
            "message": "Document processing started"
        }
        
    except Exception as e:
        logger.error(f"Erro ao iniciar processamento: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

async def process_document_background(
    job_id: str, file_url: str, filename: str, file_id: str
):
    """Processa documento em background"""
    try:
        # Atualizar progresso
        processing_jobs[job_id]["progress"] = 10
        
        # Download do arquivo
        content = await document_service.download_from_url(file_url)
        processing_jobs[job_id]["progress"] = 30
        
        # Extrair texto
        text, metadata = await document_service.extract_text(content, filename)
        processing_jobs[job_id]["progress"] = 50
        
        # Gerar chunks
        chunks = await document_service.create_chunks(text)
        processing_jobs[job_id]["progress"] = 70
        
        # Gerar embeddings e armazenar
        document_id = await vector_service.store_document(
            chunks=chunks,
            filename=filename,
            original_text=text,
            metadata=metadata
        )
        processing_jobs[job_id]["progress"] = 100
        
        # Finalizar job
        processing_jobs[job_id].update({
            "status": "completed",
            "document_id": document_id,
            "chunk_count": len(chunks),
            "completed_at": datetime.now()
        })
        
        logger.info(f"Documento {filename} processado com sucesso: {document_id}")
        
    except Exception as e:
        logger.error(f"Erro no processamento background: {e}")
        processing_jobs[job_id].update({
            "status": "error",
            "error": str(e),
            "completed_at": datetime.now()
        })

@app.get("/job-status/{job_id}")
async def get_job_status(job_id: str):
    """Consulta status de processamento"""
    if job_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    
    return processing_jobs[job_id]

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Endpoint de chat melhorado"""
    try:
        # Buscar contexto relevante
        context_docs = await vector_service.search_similar(
            query=request.message,
            top_k=5,
            file_ids=request.context_file_ids
        )
        
        # Gerar resposta
        response = await chat_service.generate_response(
            message=request.message,
            context_docs=context_docs,
            conversation_history=request.history
        )
        
        return ChatResponse(
            response=response["text"],
            sources=response["sources"],
            context_used=len(context_docs) > 0
        )
        
    except Exception as e:
        logger.error(f"Erro no chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-direct")
async def upload_direct(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Upload direto (sem n8n) para testes"""
    try:
        content = await file.read()
        job_id = str(uuid.uuid4())
        
        processing_jobs[job_id] = {
            "status": "processing",
            "filename": file.filename,
            "started_at": datetime.now(),
            "progress": 0
        }
        
        background_tasks.add_task(
            process_direct_upload,
            job_id, content, file.filename
        )
        
        return {"job_id": job_id, "status": "processing"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def process_direct_upload(job_id: str, content: bytes, filename: str):
    """Processa upload direto"""
    try:
        processing_jobs[job_id]["progress"] = 20
        
        text, metadata = await document_service.extract_text(content, filename)
        processing_jobs[job_id]["progress"] = 50
        
        chunks = await document_service.create_chunks(text)
        processing_jobs[job_id]["progress"] = 80
        
        document_id = await vector_service.store_document(
            chunks=chunks,
            filename=filename,
            original_text=text,
            metadata=metadata
        )
        
        processing_jobs[job_id].update({
            "status": "completed",
            "document_id": document_id,
            "chunk_count": len(chunks),
            "progress": 100,
            "completed_at": datetime.now()
        })
        
    except Exception as e:
        processing_jobs[job_id].update({
            "status": "error",
            "error": str(e),
            "completed_at": datetime.now()
        })

@app.get("/documents")
async def list_documents():
    """Lista documentos processados"""
    return await vector_service.list_documents()

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Remove documento"""
    success = await vector_service.delete_document(document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    return {"message": "Documento removido com sucesso"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
