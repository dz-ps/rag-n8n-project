import axios from 'axios';
import { Document, ChatRequest, ChatResponse, Job } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  async uploadFile(file: File): Promise<{ job_id: string; status: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload-direct', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async getJobStatus(jobId: string): Promise<Job> {
    const response = await api.get(`/job-status/${jobId}`);
    return response.data;
  },

  async getDocuments(): Promise<Document[]> {
    const response = await api.get('/documents');
    return response.data;
  },

  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/documents/${documentId}`);
  },

  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await api.post('/chat', request);
    return response.data;
  },
};
