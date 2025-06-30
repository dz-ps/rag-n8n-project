export interface Document {
  id: string;
  filename: string;
  chunk_count: number;
  pages: number;
  language: string;
  status?: string;
}

export interface Job {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'error';
  progress: number;
  document_id?: string;
  chunk_count?: number;
  error?: string;
  started_at?: string;
  completed_at?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
}

export interface Source {
  filename: string;
  chunk_index: number;
  score: number;
}

export interface ChatRequest {
  message: string;
  context_file_ids?: string[];
  history?: Array<{ role: string; content: string }>;
}

export interface ChatResponse {
  response: string;
  sources: Source[];
  context_used: boolean;
}
