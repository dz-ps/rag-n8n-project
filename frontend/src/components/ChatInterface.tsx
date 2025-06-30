import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Document, ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  selectedDocuments: string[];
  documents: Document[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  selectedDocuments, 
  documents 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await apiService.sendChatMessage({
        message: inputMessage,
        context_file_ids: selectedDocuments,
        history: messages.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        sources: response.sources
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro no chat:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSelectedDocumentNames = () => {
    return documents
      .filter(doc => selectedDocuments.includes(doc.id))
      .map(doc => doc.filename)
      .join(', ');
  };

  return (
    <div className="flex flex-col h-96">
      {/* Header com documentos selecionados */}
      {selectedDocuments.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Consultando: {getSelectedDocumentNames()}
            </span>
          </div>
        </div>
      )}

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Faça uma pergunta sobre seus documentos</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3/4 p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot className="h-5 w-5 mt-0.5 text-gray-600" />
                )}
                {message.role === 'user' && (
                  <User className="h-5 w-5 mt-0.5 text-white" />
                )}
                <div className="flex-1">
                  {message.role === 'assistant' ? (
                    <ReactMarkdown className="prose prose-sm max-w-none">
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <p>{message.content}</p>
                  )}
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Fontes:</p>
                      {message.sources.map((source, index) => (
                        <div key={index} className="text-xs text-gray-500">
                          📄 {source.filename} (chunk {source.chunk_index})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-gray-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensagem */}
      <div className="flex space-x-2">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua pergunta..."
          className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
