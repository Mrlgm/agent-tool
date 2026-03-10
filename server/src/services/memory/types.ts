export interface Memory {
  id: string;
  content: string;
  metadata: MemoryMetadata;
}

export interface MemoryMetadata {
  userId?: string;
  sessionId?: string;
  timestamp: number;
  messageType: 'user' | 'assistant' | 'system';
  messageId?: string;
  tags?: string[];
}

export interface RetrievalOptions {
  topK?: number;
  threshold?: number;
  userId?: string;
  sessionId?: string;
}

export interface RetrievalResult {
  memory: Memory;
  score: number;
}

export interface ConversationMessage {
  role: string;
  content: string;
  id?: string;
}
