import axios, { type AxiosInstance } from 'axios';
import { config } from '../config/environment.js';
import type { Message, Tool } from '../types/index.js';

interface LLMResponse {
  role: string;
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
}

interface VisionMessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

interface VisionMessage {
  role: 'user' | 'assistant' | 'system';
  content: VisionMessageContent[] | string;
}

function formatMessageForLog(msg: any, index: number): string {
  let content = msg.content || '';
  if (content.length > 200) {
    content = content.substring(0, 200) + '...';
  }
  
  let extra = '';
  if (msg.tool_calls) {
    extra = ` [tool_calls: ${JSON.stringify(msg.tool_calls)}]`;
  }
  if (msg.tool_call_id) {
    extra = ` [tool_call_id: ${msg.tool_call_id}]`;
  }
  
  return `[${index}] ${msg.role}: ${content}${extra}`;
}

export class LLMService {
  private client: AxiosInstance;
  private model: string;

  constructor() {
    console.log(`   [LLM] Creating axios client`);
    console.log(`   [LLM]   Base URL: ${config.volcengine.baseUrl}`);
    console.log(`   [LLM]   Model: ${config.volcengine.model}`);
    
    this.client = axios.create({
      baseURL: config.volcengine.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.volcengine.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    });
    this.model = config.volcengine.model;
    console.log(`   [LLM] Axios client created with timeout: 120s`);
  }

  async chat(
    messages: Message[],
    tools?: Tool[]
  ): Promise<LLMResponse> {
    console.log(`\n   [LLM.chat] Preparing request`);
    console.log(`   [LLM.chat] Messages to send: ${messages.length}`);
    console.log(`   [LLM.chat] Tools provided: ${tools && tools.length > 0 ? tools.map(t => t.name).join(', ') : 'none'}`);

    const formattedMessages = this.formatMessages(messages);

    console.log(`\n   📤 [LLM.chat] ========== MESSAGES SENT TO LLM ==========`);
    formattedMessages.forEach((msg, idx) => {
      console.log(formatMessageForLog(msg, idx));
    });
    console.log(`   📤 [LLM.chat] =============================================\n`);

    const payload: Record<string, unknown> = {
      model: this.model,
      messages: formattedMessages,
      stream: false,
    };

    if (tools && tools.length > 0) {
      console.log(`   [LLM.chat] Attaching ${tools.length} tool definitions to request`);
      console.log(`\n   🔧 [LLM.chat] ========== TOOL DEFINITIONS ==========`);
      tools.forEach((tool, idx) => {
        console.log(`   🔧 [${idx}] ${tool.name}: ${tool.description}`);
      });
      console.log(`   🔧 [LLM.chat] =========================================\n`);
      
      payload.tools = tools.map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));
    }

    console.log(`   [LLM.chat] Sending request to ${config.volcengine.baseUrl}/chat/completions`);
    const requestStartTime = Date.now();
    
    try {
      const response = await this.client.post('/chat/completions', payload);
      const requestDuration = Date.now() - requestStartTime;
      
      console.log(`   [LLM.chat] ✅ Response received in ${requestDuration}ms`);
      
      const parsed = this.parseResponse(response.data);
      
      if (parsed.toolCalls && parsed.toolCalls.length > 0) {
        console.log(`   [LLM.chat] 📋 LLM requested ${parsed.toolCalls.length} tool call(s):`);
        for (const tc of parsed.toolCalls) {
          console.log(`      - ${tc.name}: ${JSON.stringify(tc.arguments)}`);
        }
      } else {
        console.log(`   [LLM.chat] 💬 LLM returned text response (${parsed.content.length} chars)`);
      }
      
      return parsed;
    } catch (error) {
      const requestDuration = Date.now() - requestStartTime;
      console.error(`   [LLM.chat] ❌ Request failed after ${requestDuration}ms`);
      console.error(`   [LLM.chat] Error:`, error);
      throw error;
    }
  }

  async chatWithVision(
    messages: VisionMessage[]
  ): Promise<LLMResponse> {
    console.log(`\n   [LLM.chatWithVision] Preparing vision request`);
    console.log(`   [LLM.chatWithVision] Messages to send: ${messages.length}`);

    const formattedMessages = messages.map((msg) => {
      if (Array.isArray(msg.content)) {
        return {
          role: msg.role,
          content: msg.content.map((c) => {
            if (c.type === 'image_url') {
              return {
                type: 'image_url',
                image_url: {
                  url: c.image_url?.url,
                },
              };
            }
            return c;
          }),
        };
      }
      return msg;
    });

    console.log(`\n   📤 [LLM.chatWithVision] ========== MESSAGES SENT TO LLM ==========`);
    formattedMessages.forEach((msg, idx) => {
      const contentPreview = Array.isArray(msg.content)
        ? msg.content.map((c) => c.type === 'text' ? c.text?.substring(0, 100) : '[image]').join(' | ')
        : String(msg.content).substring(0, 100);
      console.log(`   📤 [${idx}] ${msg.role}: ${contentPreview}`);
    });
    console.log(`   📤 [LLM.chatWithVision] =============================================\n`);

    const payload = {
      model: this.model,
      messages: formattedMessages,
      stream: false,
    };

    console.log(`   [LLM.chatWithVision] Sending request to ${config.volcengine.baseUrl}/chat/completions`);
    const requestStartTime = Date.now();

    try {
      const response = await this.client.post('/chat/completions', payload);
      const requestDuration = Date.now() - requestStartTime;

      console.log(`   [LLM.chatWithVision] ✅ Response received in ${requestDuration}ms`);

      const parsed = this.parseResponse(response.data);
      console.log(`   [LLM.chatWithVision] 💬 LLM returned text response (${parsed.content.length} chars)`);

      return parsed;
    } catch (error) {
      const requestDuration = Date.now() - requestStartTime;
      console.error(`   [LLM.chatWithVision] ❌ Request failed after ${requestDuration}ms`);
      console.error(`   [LLM.chatWithVision] Error:`, error);
      throw error;
    }
  }

  private formatMessages(messages: Message[]): object[] {
    console.log(`   [LLM.formatMessages] Formatting ${messages.length} messages for API`);
    
    const formatted = messages.map((msg) => {
      const base: Record<string, unknown> = {
        role: msg.role,
        content: msg.content,
      };

      if (msg.role === 'assistant' && msg.toolCalls) {
        base.tool_calls = msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        }));
      }

      if (msg.role === 'tool') {
        base.tool_call_id = msg.toolCallId;
      }

      return base;
    });

    console.log(`   [LLM.formatMessages] Formatted ${formatted.length} messages`);
    return formatted;
  }

  private parseResponse(data: any): LLMResponse {
    console.log(`   [LLM.parseResponse] Parsing API response`);
    
    try {
      const choice = data.choices[0];
      const message = choice.message;

      const result = {
        role: message.role,
        content: message.content || '',
        toolCalls: message.tool_calls?.map((tc: any) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments || '{}'),
        })),
      };

      console.log(`   [LLM.parseResponse] ✅ Parsed successfully`);
      return result;
    } catch (error) {
      console.error(`   [LLM.parseResponse] ❌ Failed to parse response:`, error);
      throw error;
    }
  }
}
