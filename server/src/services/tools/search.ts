import axios from 'axios';
import { config } from '../../config/environment.js';

interface SearchResult {
  title: string;
  url: string;
  content: string;
}

interface TavilyResponse {
  answer?: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
  }>;
}

export async function searchWeb(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  console.log(`   [Search] 🌐 Starting web search`);
  console.log(`   [Search] Query: "${query}"`);
  console.log(`   [Search] Max results: ${maxResults}`);

  if (!config.tavily.apiKey) {
    console.warn(`   [Search] ⚠️ Tavily API Key not configured!`);
    console.warn(`   [Search] Returning empty results`);
    return [];
  }

  console.log(`   [Search] Using Tavily API: ${config.tavily.baseUrl}/search`);
  
  try {
    const searchStartTime = Date.now();
    
    const response = await axios.post<TavilyResponse>(
      `${config.tavily.baseUrl}/search`,
      {
        query,
        search_depth: 'basic',
        max_results: maxResults,
        include_answer: true,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.tavily.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const searchDuration = Date.now() - searchStartTime;
    console.log(`   [Search] ✅ Search completed in ${searchDuration}ms`);

    const data = response.data;
    console.log(`   [Search] Answer available: ${data.answer ? 'Yes' : 'No'}`);
    console.log(`   [Search] Results count: ${data.results?.length || 0}`);

    const results: SearchResult[] = (data.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    }));

    console.log(`   [Search] Returning ${results.length} results`);
    return results;
  } catch (error) {
    console.error(`   [Search] ❌ Search failed:`, error);
    return [];
  }
}

export const searchTool = {
  name: 'search',
  description: '搜索互联网获取最新信息。当用户询问实时信息、新闻、天气等无法从训练数据中获取的内容时使用。',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词',
      },
      maxResults: {
        type: 'number',
        description: '返回结果数量，默认 5',
        default: 5,
      },
    },
    required: ['query'],
  },
};

export async function searchExecutor(args: { query: string; maxResults?: number }): Promise<unknown> {
  console.log(`\n   [SearchExecutor] 🔍 Executing search tool`);
  console.log(`   [SearchExecutor] Args: ${JSON.stringify(args)}`);
  
  const results = await searchWeb(args.query, args.maxResults || 5);
  
  const output = {
    query: args.query,
    count: results.length,
    results: results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
    })),
  };
  
  console.log(`   [SearchExecutor] ✅ Returning ${output.count} search results`);
  return output;
}
