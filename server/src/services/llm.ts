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
