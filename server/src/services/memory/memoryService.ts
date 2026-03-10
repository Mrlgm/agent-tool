import { v4 as uuidv4 } from 'uuid';
import { VectorStore } from './vectorStore.js';
import { EmbeddingService } from '../embedding/embeddingService.js';
import { config } from '../../config/environment.js';
import type { 
  Memory, 
  RetrievalOptions, 
  RetrievalResult,
  ConversationMessage 
} from './types.js';

export class MemoryService {
  private vectorStore: VectorStore;
  private embeddingService: EmbeddingService;
  private initialized: boolean = false;

  constructor(embeddingService: EmbeddingService, _persistDirectory?: string) {
    const vectorDbConfig = config.vectorDb;
    this.embeddingService = embeddingService;
    this.vectorStore = new VectorStore(
      vectorDbConfig.host,
      vectorDbConfig.port,
      vectorDbConfig.collectionName
    );
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log(`   [Memory] Already initialized`);
      return;
    }

    try {
      const dimensions = this.embeddingService.getDimensions();
      await this.vectorStore.initialize(dimensions);
      
      const count = await this.vectorStore.count();
      console.log(`✅ [Memory] Service initialized, total memories: ${count}`);
      
      this.initialized = true;
    } catch (error) {

      console.error('❌ [Memory] Failed to initialize:', error);
      console.warn('⚠️  [Memory] Continuing without memory service');
      this.initialized = false;
      throw new Error('MemoryService initialization failed');
    }
  }

  async addMemory(
    content: string,
    metadata: {
      userId?: string;
      sessionId?: string;
      messageType: 'user' | 'assistant' | 'system';
      messageId?: string;
      tags?: string[];
    }
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const id = uuidv4();
    
    const embeddingResult = await this.embeddingService.embedText(content);
    
    const fullMetadata = {
      ...metadata,
      content,
      timestamp: Date.now(),
    };

    await this.vectorStore.add(id, embeddingResult.embedding, fullMetadata);
    
    console.log(`📝 [Memory] Added memory: ${id.substring(0, 8)}..., content: "${content.substring(0, 50)}..."`);
    return id;
  }

  async addMemoryBatch(
    memories: Array<{
      content: string;
      metadata: {
        userId?: string;
        sessionId?: string;
        messageType: 'user' | 'assistant' | 'system';
        messageId?: string;
        tags?: string[];
      };
    }>
  ): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (memories.length === 0) return [];

    const texts = memories.map(m => m.content);
    const embeddingResults = await this.embeddingService.embedTexts(texts);

    const ids = memories.map(() => uuidv4());
    const metadatas = memories.map((m, index) => ({
      ...m.metadata,
      content: m.content,
      timestamp: Date.now(),
    }));

    await this.vectorStore.addBatch(
      ids,
      embeddingResults.map(r => r.embedding),
      metadatas
    );

    console.log(`📝 [Memory] Added ${memories.length} memories in batch`);
    return ids;
  }

  async retrieveRelevant(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const embeddingResult = await this.embeddingService.embedText(query);
    
    const searchResults = await this.vectorStore.search(
      embeddingResult.embedding,
      {
        topK: options.topK || config.memory.topK,
        threshold: options.threshold,
        userId: options.userId,
        sessionId: options.sessionId,
      }
    );

    const results: RetrievalResult[] = [];
    
    for (const item of searchResults) {
      const score = 1 - item.distance;
      
      if (options.threshold && score < options.threshold) {
        continue;
      }

      results.push({
        memory: {
          id: item.id,
          content: item.metadata['content'] as string,
          metadata: {
            userId: item.metadata['userId'] as string | undefined,
            sessionId: item.metadata['sessionId'] as string | undefined,
            timestamp: item.metadata['timestamp'] as number,
            messageType: item.metadata['messageType'] as 'user' | 'assistant' | 'system',
            messageId: item.metadata['messageId'] as string | undefined,
          },
        },
        score,
      });
    }

    console.log(`🔍 [Memory] Retrieved ${results.length} relevant memories for query: "${query.substring(0, 30)}..."`);
    return results;
  }

  async saveConversation(
    messages: ConversationMessage[],
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const validMessages = messages.filter(
      msg => msg.role === 'user' || msg.role === 'assistant'
    );

    if (validMessages.length === 0) return;

    const memories = validMessages.map(msg => ({
      content: msg.content,
      metadata: {
        userId,
        sessionId,
        messageType: msg.role as 'user' | 'assistant',
        messageId: msg.id,
      },
    }));

    await this.addMemoryBatch(memories);
    console.log(`💾 [Memory] Saved ${validMessages.length} conversation messages`);
  }

  async deleteMemory(id: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    await this.vectorStore.delete(id);
    console.log(`🗑️ [Memory] Deleted memory: ${id}`);
  }

  async deleteBySession(sessionId: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    await this.vectorStore.deleteBySession(sessionId);
    console.log(`🗑️ [Memory] Deleted memories for session: ${sessionId}`);
  }

  async clearAll(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    await this.vectorStore.deleteAll();
    console.log(`🗑️ [Memory] Cleared all memories`);
  }

  async getMemoryCount(): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }

    return await this.vectorStore.count();
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
