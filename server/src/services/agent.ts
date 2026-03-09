import { LLMService } from './llm.js';
import { ToolRegistry } from './tools/index.js';
import type { Message, ToolCall, ToolResult } from '../types/index.js';

export class AgentService {
  private llm: LLMService;
  private tools: ToolRegistry;
  private maxIterations = 5;

  constructor(llm: LLMService, tools: ToolRegistry) {
    this.llm = llm;
    this.tools = tools;
  }

  async chat(messages: Message[]): Promise<Message> {
    console.log('\n🧠 [Agent] Starting agent chat process');
    console.log(`   [Agent] Input messages: ${messages.length}`);
    
    let currentMessages = [...messages];
    let iterations = 0;

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

      const assistantMessage: Message = {
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
        return assistantMessage;
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
