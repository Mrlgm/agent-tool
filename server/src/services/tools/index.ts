import type { Tool, ToolCall, ToolResult } from '../../types/index.js';

export type ToolExecutor = (args: Record<string, unknown>) => Promise<unknown>;

interface ToolDefinition {
  definition: Tool;
  executor: ToolExecutor;
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(definition: Tool, executor: ToolExecutor): void {
    console.log(`   [ToolRegistry] Registering tool: ${definition.name}`);
    this.tools.set(definition.name, { definition, executor });
  }

  async execute(name: string, args: Record<string, unknown>): Promise<unknown> {
    console.log(`   [ToolRegistry] Executing tool: ${name}`);
    console.log(`   [ToolRegistry] Arguments: ${JSON.stringify(args)}`);
    
    const tool = this.tools.get(name);
    if (!tool) {
      console.error(`   [ToolRegistry] ❌ Tool not found: ${name}`);
      throw new Error(`Tool ${name} not found`);
    }
    
    console.log(`   [ToolRegistry] Found tool: ${tool.definition.name}`);
    console.log(`   [ToolRegistry] Description: ${tool.definition.description}`);
    
    const result = await tool.executor(args);
    console.log(`   [ToolRegistry] ✅ Tool executed successfully`);
    
    return result;
  }

  getDefinitions(): Tool[] {
    const defs = Array.from(this.tools.values()).map((t) => t.definition);
    console.log(`   [ToolRegistry] Getting definitions: ${defs.length} tools available`);
    return defs;
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }
}
