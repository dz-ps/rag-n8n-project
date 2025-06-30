from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
import logging
from utils.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class ChatService:
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    async def generate_response(
        self,
        message: str,
        context_docs: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """Gera resposta usando OpenAI"""
        try:
            # Preparar contexto
            context = self._prepare_context(context_docs)
            
            # Preparar mensagens
            messages = self._prepare_messages(message, context, conversation_history)
            
            # Gerar resposta
            response = await self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                temperature=0.3,
                max_tokens=1500
            )
            
            response_text = response.choices[0].message.content
            
            # Preparar fontes
            sources = [
                {
                    "filename": doc["metadata"].get("filename", "Unknown"),
                    "chunk_index": doc["metadata"].get("chunk_index", 0),
                    "score": doc.get("score", 0)
                }
                for doc in context_docs
            ]
            
            return {
                "text": response_text,
                "sources": sources
            }
            
        except Exception as e:
            logger.error(f"Erro ao gerar resposta: {e}")
            raise
    
    def _prepare_context(self, context_docs: List[Dict[str, Any]]) -> str:
        """Prepara contexto dos documentos"""
        if not context_docs:
            return ""
        
        context_parts = []
        for doc in context_docs:
            filename = doc["metadata"].get("filename", "Unknown")
            text = doc["text"]
            context_parts.append(f"[{filename}]\n{text}")
        
        return "\n\n".join(context_parts)
    
    def _prepare_messages(
        self,
        message: str,
        context: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> List[Dict[str, str]]:
        """Prepara mensagens para OpenAI"""
        system_prompt = """Você é um assistente especializado em análise de documentos para pentesting e investigação forense.

Responda às perguntas com base no contexto fornecido dos documentos.
Se a informação não estiver no contexto, diga que não pode responder com base nos documentos disponíveis.
Sempre cite as fontes quando possível.
Seja preciso e técnico nas respostas relacionadas a segurança."""

        messages = [{"role": "system", "content": system_prompt}]
        
        # Adicionar histórico da conversa
        if conversation_history:
            messages.extend(conversation_history[-10:])  # Últimas 10 mensagens
        
        # Adicionar contexto e pergunta atual
        user_content = f"Contexto dos documentos:\n{context}\n\nPergunta: {message}" if context else message
        messages.append({"role": "user", "content": user_content})
        
        return messages
