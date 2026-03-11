import axios, { type AxiosInstance } from 'axios';
import { config } from '../../config/environment.js';
import type { 
  VolcengineEmbeddingRequest, 
  VolcengineEmbeddingResponse,
  EmbeddingResult 
} from './types.js';

export class EmbeddingService {
  private client: AxiosInstance;
  private model: string;
  private dimensions: number;
  private encodingFormat: string;

  constructor() {
    const embeddingConfig = config.embedding;
    
    const baseUrl = config.volcengine.baseUrl.replace('/chat/completions', '');
    
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${config.volcengine.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
    
    this.model = embeddingConfig.model;
    this.dimensions = embeddingConfig.dimensions;
    this.encodingFormat = embeddingConfig.encodingFormat;
  }

  async embedText(text: string): Promise<EmbeddingResult> {
    const request: VolcengineEmbeddingRequest = {
      model: this.model,
      input: [{ type: 'text', text }],
      encoding_format: this.encodingFormat as 'float',
      dimensions: this.dimensions,
    };

    console.log(`   [Embedding] Calling multimodal embedding API`);
    console.log(`   [Embedding] Model: ${this.model}, Dimensions: ${this.dimensions}`);
    console.log(`   [Embedding] Text length: ${text.length} chars`);

    const response = await this.client.post<VolcengineEmbeddingResponse>(
      '/embeddings/multimodal',
      request
    );

    const data = response.data.data;
    const tokens = response.data.usage.prompt_tokens_details?.text_tokens || response.data.usage.prompt_tokens;

    console.log(`   [Embedding] ✅ Embedding generated, dimension: ${data.embedding.length}, tokens: ${tokens}`);

    return {
      embedding: data.embedding,
      tokens,
    };
  }

  getDimensions(): number {
    return this.dimensions;
  }

  getModel(): string {
    return this.model;
  }
}
