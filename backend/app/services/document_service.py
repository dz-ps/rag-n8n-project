import aiohttp
import asyncio
from typing import Tuple, Dict, Any, List
import logging
from docling.document_converter import DocumentConverter
import tempfile
import os

logger = logging.getLogger(__name__)

class DocumentService:
    def __init__(self):
        self.converter = DocumentConverter()
    
    async def download_from_url(self, url: str) -> bytes:
        """Download arquivo de URL"""
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.read()
                else:
                    raise Exception(f"Erro ao baixar arquivo: {response.status}")
    
    async def extract_text(self, content: bytes, filename: str) -> Tuple[str, Dict[str, Any]]:
        """Extrai texto usando Docling"""
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp_file:
                tmp_file.write(content)
                tmp_file_path = tmp_file.name
            
            # Processar com Docling
            result = await asyncio.to_thread(
                self.converter.convert,
                source=tmp_file_path
            )
            
            if result and result.document:
                text = "\n".join([str(item.text) for item in result.document.texts])
                metadata = {
                    "filename": filename,
                    "pages": getattr(result.document, 'page_count', 0),
                    "language": getattr(result.document, 'language', 'unknown'),
                    "ocr_applied": getattr(result, 'ocr_applied', False)
                }
                return text, metadata
            else:
                raise Exception("Falha na conversão com Docling")
                
        except Exception as e:
            logger.error(f"Erro na extração de texto: {e}")
            raise
        finally:
            if 'tmp_file_path' in locals() and os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
    
    async def create_chunks(self, text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
        """Cria chunks do texto"""
        if not text or len(text.strip()) < 10:
            return []
        
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk_words = words[i:i + chunk_size]
            chunk_text = " ".join(chunk_words)
            if chunk_text.strip():
                chunks.append(chunk_text)
        
        return chunks
