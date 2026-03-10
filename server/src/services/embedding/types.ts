export interface VolcengineEmbeddingRequest {
  model: string;
  input: VolcengineEmbeddingInput[];
  encoding_format?: 'float' | 'base64' | null;
  dimensions?: number;
  instructions?: string;
  sparse_embedding?: {
    type: 'disabled' | 'enabled';
  };
}

export interface VolcengineEmbeddingInput {
  type: 'text';
  text: string;
}

export interface VolcengineEmbeddingResponse {
  id: string;
  model: string;
  created: number;
  object: 'list';
  data: Array<{
    embedding: number[];
    object: 'embedding';
  }>;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
    prompt_tokens_details: {
      text_tokens: number;
      image_tokens: number;
    };
  };
}

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}
