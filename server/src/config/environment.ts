import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  volcengine: {
    apiKey: process.env.VOLCENGINE_API_KEY || '',
    baseUrl: process.env.VOLCENGINE_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    model: process.env.VOLCENGINE_MODEL || 'doubao-pro-32k',
  },
  tavily: {
    apiKey: process.env.TAVILY_API_KEY || '',
    baseUrl: 'https://api.tavily.com',
  },
  embedding: {
    model: process.env.EMBEDDING_MODEL || 'doubao-embedding-vision-250615',
    dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '1024', 10),
    encodingFormat: (process.env.EMBEDDING_ENCODING_FORMAT as 'float' | 'base64') || 'float',
  },
  vectorDb: {
    type: process.env.VECTOR_DB_TYPE || 'chroma',
    host: process.env.VECTOR_DB_HOST || 'localhost',
    port: parseInt(process.env.VECTOR_DB_PORT || '8000', 10),
    persistDirectory: process.env.VECTOR_DB_PATH || path.join(process.cwd(), 'data', 'vector_db'),
    collectionName: process.env.VECTOR_DB_COLLECTION || 'long_term_memory',
  },
  memory: {
    topK: parseInt(process.env.MEMORY_TOP_K || '3', 10),
    similarityThreshold: parseFloat(process.env.MEMORY_SIMILARITY_THRESHOLD || '0.7'),
  },
};
