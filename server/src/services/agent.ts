import { LLMService } from './llm.js';
import { ToolRegistry } from './tools/index.js';
import { MemoryService, type RetrievalResult } from './memory/index.js';
import { config } from '../config/environment.js';
import type { Message, ToolCall, ToolResult } from '../types/index.js';

export class AgentService {
  private llm: LLMService;
  private tools: ToolRegistry;
  private memoryService?: MemoryService;
  private maxIterations = 5;

  constructor(llm: LLMService, tools: ToolRegistry, memoryService?: MemoryService) {
    this.llm = llm;
    this.tools = tools;
    this.memoryService = memoryService;
  }

  async chat(messages: Message[]): Promise<Message> {
    console.log('\n🧠 [Agent] Starting agent chat process');
    console.log(`   [Agent] Input messages: ${messages.length}`);
    
    let currentMessages = [...messages];
    let iterations = 0;

    const userId = 'default-user';
    const existingSessionId = messages.find(m => m.sessionId)?.sessionId;
    const sessionId = existingSessionId || `session-${Date.now()}`;
    console.log(`   [Agent] Session ID: ${sessionId} ${existingSessionId ? '(existing)' : '(new)'}`);

    if (this.memoryService) {
      console.log(`\n📚 [Agent] Memory service available, retrieving relevant memories...`);
      
      try {
        if (!this.memoryService.isInitialized()) {
          console.log(`   [Agent] Memory service not initialized, attempting to initialize...`);
          await this.memoryService.initialize();
        }

        const latestUserMessage = messages.find(m => m.role === 'user');
        
        if (latestUserMessage) {
          const relevantMemories = await this.memoryService.retrieveRelevant(
            latestUserMessage.content,
            { 
              topK: config.memory.topK,
              threshold: config.memory.similarityThreshold,
              sessionId,
            }
          );

          if (relevantMemories.length > 0) {
            const memoryContext = this.buildMemoryContext(relevantMemories);
            
            const systemMessage: Message = {
              id: `system-${Date.now()}`,
              role: 'system',
              content: memoryContext,
              timestamp: Date.now(),
            };
            
            currentMessages = [systemMessage, ...currentMessages];
            console.log(`   [Agent] ✅ Added ${relevantMemories.length} relevant memories to context`);
          } else {
            console.log(`   [Agent] No relevant memories found`);
          }
        }
      } catch (error) {
        console.error(`   [Agent] ❌ Memory retrieval failed:`, error);
        console.warn(`   [Agent] ⚠️  Continuing without memory context`);
      }
    } else {
      console.log(`   [Agent] Memory service not available, skipping memory retrieval`);
    }

    let assistantMessage: Message;

    while (iterations < this.maxIterations) {
      iterations++;
      console.log(`\n🔄 [Agent] Iteration ${iterations}/${this.maxIterations}`);

      const availableTools = this.tools.getDefinitions();
      console.log(`   [Agent] Available tools: ${availableTools.map(t => t.name).join(', ')}`);

      console.log(`   [Agent] Calling LLM...`);
      const llmStartTime = Date.now();
      
      const response = await this.llm.chat(currentMessages, availableTools);
      
      const llmDuration = Date.now() - llmStartTime;
      console.log(`   [Agent] LLM response received in ${llmDuration}ms`);

      assistantMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        toolCalls: response.toolCalls?.map((tc) => ({
          id: tc.id,
          name: tc.name,
          arguments: tc.arguments,
        })),
      };

      console.log(`   [Agent] Response content: "${response.content.substring(0, 80)}${response.content.length > 80 ? '...' : ''}"`);
      
      if (response.toolCalls && response.toolCalls.length > 0) {
        console.log(`   [Agent] Tool calls detected: ${response.toolCalls.length}`);
        for (const tc of response.toolCalls) {
          console.log(`      - ${tc.name}: ${JSON.stringify(tc.arguments)}`);
        }
      } else {
        console.log(`   [Agent] No tool calls, returning response`);
      }

      if (!response.toolCalls || response.toolCalls.length === 0) {
        console.log(`   [Agent] ✅ Final response ready (no tools needed)`);
        
        if (this.memoryService) {
          try {
            if (!this.memoryService.isInitialized()) {
              await this.memoryService.initialize();
            }
            await this.saveToMemory(currentMessages, assistantMessage, userId, sessionId);
          } catch (error) {
            console.error(`   [Agent] ❌ Memory save failed:`, error);
            console.warn(`   [Agent] ⚠️  Continuing without saving to memory`);
          }
        }
        
        const responseMessage: Message = {
          ...assistantMessage,
          sessionId,
        };
        
        return responseMessage;
      }

      console.log(`\n⚙️  [Agent] Executing tools...`);
      const toolResults = await this.executeTools(response.toolCalls);
      console.log(`   [Agent] Tools executed, ${toolResults.length} results`);

      const toolResultMessages: Message[] = toolResults.map((tr) => ({
        id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'tool',
        content: tr.result,
        timestamp: Date.now(),
        toolCallId: tr.toolCallId,
        toolResults: [tr],
      }));

      console.log(`   [Agent] Appending ${toolResultMessages.length} tool result messages to context`);
      currentMessages = [...currentMessages, assistantMessage, ...toolResultMessages];
      console.log(`   [Agent] Total messages now: ${currentMessages.length}`);
    }

    console.error(`   [Agent] ❌ Max iterations (${this.maxIterations}) reached`);
    throw new Error('达到最大迭代次数，请简化问题');
  }

  private buildMemoryContext(memories: RetrievalResult[]): string {
    const memoryTexts = memories
      .map((m, i) => {
        const timeStr = new Date(m.memory.metadata.timestamp).toLocaleString('zh-CN');
        return `[相关记忆 ${i + 1}] (相似度: ${(m.score * 100).toFixed(1)}%, 时间: ${timeStr})\n${m.memory.content}`;
      })
      .join('\n\n---\n\n');

    return `你是一个有用的AI助手。以下是之前对话中与当前问题相关的记录：\n\n${memoryTexts}\n\n---\n\n请根据以上相关记忆来回答用户的问题。如果当前问题与记忆无关，则忽略记忆内容。`;
  }

  private async saveToMemory(
    allMessages: Message[],
    assistantMessage: Message,
    userId: string,
    sessionId: string
  ): Promise<void> {
    try {
      const conversationMessages = allMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          role: m.role,
          content: m.content,
          id: m.id,
        }));
      
      conversationMessages.push({
        role: 'assistant',
        content: assistantMessage.content,
        id: assistantMessage.id,
      });

      await this.memoryService?.saveConversation(
        conversationMessages,
        userId,
        sessionId
      );

      console.log(`   [Agent] 💾 Saved ${conversationMessages.length} messages to memory (session: ${sessionId})`);
    } catch (error) {
      console.error(`   [Agent] ❌ Failed to save to memory:`, error);
    }
  }

  private async executeTools(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    console.log(`\n⚙️  [Agent.executeTools] Executing ${toolCalls.length} tool call(s)`);
    const results: ToolResult[] = [];

    for (const call of toolCalls) {
      console.log(`   [Agent] 🔧 Executing tool: ${call.name}`);
      console.log(`   [Agent]    Arguments: ${JSON.stringify(call.arguments)}`);
      
      const toolStartTime = Date.now();
      
      try {
        const result = await this.tools.execute(call.name, call.arguments);
        const toolDuration = Date.now() - toolStartTime;
        
        console.log(`   [Agent] ✅ Tool ${call.name} executed successfully in ${toolDuration}ms`);
        
        results.push({
          toolCallId: call.id,
          result: JSON.stringify(result, null, 2),
        });
      } catch (error) {
        const toolDuration = Date.now() - toolStartTime;
        console.error(`   [Agent] ❌ Tool ${call.name} failed after ${toolDuration}ms:`, error);
        
        results.push({
          toolCallId: call.id,
          result: JSON.stringify({ error: (error as Error).message }),
          isError: true,
        });
      }
    }

    return results;
  }
}
