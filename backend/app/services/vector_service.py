import asyncio
from typing import List, Dict, Any, Optional
import numpy as np
import faiss
import chromadb
from openai import AsyncOpenAI
import uuid
import logging
from utils.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class VectorService:
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.chroma_client.get_or_create_collection("documents")
        self.embedding_dim = 1536
        self.faiss_index = faiss.IndexFlatL2(self.embedding_dim)
        self.faiss_id_map = {}
        self.next_faiss_id = 0
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Gera embeddings usando OpenAI"""
        try:
            response = await self.openai_client.embeddings.create(
                input=texts,
                model="text-embedding-ada-002"
            )
            return [item.embedding for item in response.data]
        except Exception as e:
            logger.error(f"Erro ao gerar embeddings: {e}")
            raise
    
    async def store_document(
        self,
        chunks: List[str],
        filename: str,
        original_text: str,
        metadata: Dict[str, Any]
    ) -> str:
        """Armazena documento no vector store"""
        try:
            document_id = str(uuid.uuid4())
            
            if not chunks:
                return document_id
            
            # Gerar embeddings
            embeddings = await self.generate_embeddings(chunks)
            
            # Preparar dados para ChromaDB
            chunk_ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
            chunk_metadatas = [
                {
                    "document_id": document_id,
                    "filename": filename,
                    "chunk_index": i,
                    **metadata
                }
                for i in range(len(chunks))
            ]
            
            # Armazenar no ChromaDB
            self.collection.add(
                ids=chunk_ids,
                documents=chunks,
                embeddings=embeddings,
                metadatas=chunk_metadatas
            )
            
            # Armazenar documento principal
            self.collection.add(
                ids=[document_id],
                documents=[original_text],
                metadatas=[{
                    "filename": filename,
                    "chunk_count": len(chunks),
                    "status": "processed",
                    **metadata
                }]
            )
            
            # Adicionar ao FAISS
            embeddings_np = np.array(embeddings, dtype="float32")
            self.faiss_index.add(embeddings_np)
            
            # Mapear IDs do FAISS
            for i, chunk_id in enumerate(chunk_ids):
                self.faiss_id_map[self.next_faiss_id + i] = chunk_id
            
            self.next_faiss_id += len(embeddings)
            
            logger.info(f"Documento {filename} armazenado: {document_id}")
            return document_id
            
        except Exception as e:
            logger.error(f"Erro ao armazenar documento: {e}")
            raise
    
    async def search_similar(
        self,
        query: str,
        top_k: int = 5,
        file_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Busca documentos similares"""
        try:
            # Gerar embedding da query
            query_embedding = await self.generate_embeddings([query])
            query_embedding_np = np.array(query_embedding, dtype="float32")
            
            # Buscar no FAISS
            distances, indices = self.faiss_index.search(query_embedding_np, top_k * 2)
            
            # Recuperar chunk IDs
            chunk_ids = [
                self.faiss_id_map.get(idx) 
                for idx in indices[0] 
                if idx >= 0 and self.faiss_id_map.get(idx)
            ]
            
            if not chunk_ids:
                return []
            
            # Buscar no ChromaDB
            results = self.collection.get(
                ids=chunk_ids,
                include=["documents", "metadatas"]
            )
            
            # Filtrar por file_ids se especificado
            filtered_results = []
            for i, chunk_id in enumerate(results["ids"]):
                metadata = results["metadatas"][i]
                document_id = metadata.get("document_id")
                
                if file_ids and document_id not in file_ids:
                    continue
                
                filtered_results.append({
                    "id": chunk_id,
                    "text": results["documents"][i],
                    "metadata": metadata,
                    "score": float(distances[0][indices[0].tolist().index(
                        next(k for k, v in self.faiss_id_map.items() if v == chunk_id)
                    )])
                })
            
            # Ordenar por score e limitar
            filtered_results.sort(key=lambda x: x["score"])
            return filtered_results[:top_k]
            
        except Exception as e:
            logger.error(f"Erro na busca: {e}")
            return []
    
    async def list_documents(self) -> List[Dict[str, Any]]:
        """Lista documentos processados"""
        try:
            results = self.collection.get(
                where={"status": "processed"},
                include=["metadatas"]
            )
            
            documents = []
            for i, doc_id in enumerate(results["ids"]):
                metadata = results["metadatas"][i]
                documents.append({
                    "id": doc_id,
                    "filename": metadata.get("filename"),
                    "chunk_count": metadata.get("chunk_count", 0),
                    "pages": metadata.get("pages", 0),
                    "language": metadata.get("language", "unknown")
                })
            
            return documents
            
        except Exception as e:
            logger.error(f"Erro ao listar documentos: {e}")
            return []
    
    async def delete_document(self, document_id: str) -> bool:
        """Remove documento"""
        try:
            # Buscar chunks do documento
            results = self.collection.get(
                where={"document_id": document_id},
                include=["ids"]
            )
            
            all_ids = results["ids"] + [document_id]
            
            # Remover do ChromaDB
            self.collection.delete(ids=all_ids)
            
            logger.info(f"Documento {document_id} removido")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao remover documento: {e}")
            return False
