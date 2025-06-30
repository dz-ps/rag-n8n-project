import React from 'react';
import { Trash2, FileText, Check, Square } from 'lucide-react';
import { Document } from '../types';
import { apiService } from '../services/apiService';

interface DocumentListProps {
  documents: Document[];
  selectedDocuments: string[];
  onSelectionChange: (selected: string[]) => void;
  onDelete: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocuments,
  onSelectionChange,
  onDelete
}) => {
  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(documents.map(doc => doc.id));
    }
  };

  const handleSelectDocument = (docId: string) => {
    if (selectedDocuments.includes(docId)) {
      onSelectionChange(selectedDocuments.filter(id => id !== docId));
    } else {
      onSelectionChange([...selectedDocuments, docId]);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este documento?')) {
      try {
        await apiService.deleteDocument(docId);
        onDelete();
      } catch (error) {
        console.error('Erro ao excluir documento:', error);
        alert('Erro ao excluir documento');
      }
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum documento processado
        </h3>
        <p className="text-gray-500">
          Faça upload de documentos na aba Upload para começar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com seleção */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {selectedDocuments.length === documents.length ? (
              <Check className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            <span>
              {selectedDocuments.length === documents.length ? 'Desmarcar todos' : 'Selecionar todos'}
            </span>
          </button>
        </div>
        
        {selectedDocuments.length > 0 && (
          <div className="text-sm text-blue-600">
            {selectedDocuments.length} documento(s) selecionado(s) para chat
          </div>
        )}
      </div>

      {/* Lista de documentos */}
      <div className="grid gap-4">
        {documents.map((document) => (
          <div
            key={document.id}
            className={`border rounded-lg p-4 transition-colors ${
              selectedDocuments.includes(document.id)
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleSelectDocument(document.id)}
                  className="flex-shrink-0"
                >
                  {selectedDocuments.includes(document.id) ? (
                    <Check className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                
                <FileText className="h-8 w-8 text-gray-400" />
                
                <div>
                  <h3 className="font-medium text-gray-900">
                    {document.filename}
                  </h3>
                  <div className="text-sm text-gray-500 space-x-4">
                    <span>{document.chunk_count} chunks</span>
                    <span>{document.pages} páginas</span>
                    <span>Idioma: {document.language}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleDeleteDocument(document.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir documento"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
