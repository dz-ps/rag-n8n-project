import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      onFileUpload(file);
    });
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    multiple: true
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">Solte os arquivos aqui...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-500">
              Suporta: PDF, DOCX, TXT, MD
            </p>
          </div>
        )}
      </div>

      {acceptedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Arquivos selecionados:</h4>
          {acceptedFiles.map((file, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <File className="h-4 w-4 text-gray-500" />
              <span>{file.name}</span>
              <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
