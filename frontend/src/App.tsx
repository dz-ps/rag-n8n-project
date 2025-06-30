import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ChatInterface } from './components/ChatInterface';
import { DocumentList } from './components/DocumentList';
import { JobMonitor } from './components/JobMonitor';
import { Navbar } from './components/Navbar';
import { apiService } from './services/apiService';
import { Document, Job } from './types';
import './App.css';

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'chat' | 'documents'>('upload');

  useEffect(() => {
    loadDocuments();
    const interval = setInterval(loadDocuments, 10000); // Atualizar a cada 10s
    return () => clearInterval(interval);
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await apiService.getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const result = await apiService.uploadFile(file);
      const newJob: Job = {
        id: result.job_id,
        filename: file.name,
        status: 'processing',
        progress: 0
      };
      setJobs(prev => [...prev, newJob]);
      
      // Monitorar progresso
      monitorJob(result.job_id);
    } catch (error) {
      console.error('Erro no upload:', error);
    }
  };

  const monitorJob = async (jobId: string) => {
    const checkStatus = async () => {
      try {
        const status = await apiService.getJobStatus(jobId);
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, ...status } : job
        ));

        if (status.status === 'completed') {
          loadDocuments();
          return;
        }

        if (status.status === 'processing') {
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error('Erro ao monitorar job:', error);
      }
    };

    checkStatus();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Upload de Documentos</h2>
              <FileUpload onFileUpload={handleFileUpload} />
            </div>
            
            {jobs.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Jobs em Processamento</h3>
                <JobMonitor jobs={jobs} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Documentos Processados</h2>
            <DocumentList 
              documents={documents}
              selectedDocuments={selectedDocuments}
              onSelectionChange={setSelectedDocuments}
              onDelete={loadDocuments}
            />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Chat com Documentos</h2>
            <ChatInterface 
              selectedDocuments={selectedDocuments}
              documents={documents}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
