import dotenv from 'dotenv';

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
};
