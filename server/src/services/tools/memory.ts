import type { MemoryService } from '../memory/memoryService.js';

export const memorySearchTool = {
  name: 'memory_search',
  description: '搜索之前对话中与指定内容相关的记忆。用于回答"之前有没有聊过xxx"、"查一下之前关于xxx的对话"等问题。',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词',
      },
      limit: {
        type: 'number',
        description: '返回结果数量，默认 3',
        default: 3,
      },
    },
    required: ['query'],
  },
};

export async function memorySearchExecutor(
  args: { query: string; limit?: number },
  memoryService?: MemoryService
): Promise<unknown> {
  console.log(`\n   [MemorySearch] 🔍 Searching memories`);
  console.log(`   [MemorySearch] Query: "${args.query}"`);
  console.log(`   [MemorySearch] Limit: ${args.limit || 3}`);

  if (!memoryService) {
    console.warn(`   [MemorySearch] ⚠️ Memory service not available`);
    return {
      success: false,
      error: 'Memory service is not available',
      message: '记忆服务暂不可用',
    };
  }

  try {
    if (!memoryService.isInitialized()) {
      console.log(`   [MemorySearch] Memory service not initialized, attempting to initialize...`);
      await memoryService.initialize();
    }

    const results = await memoryService.retrieveRelevant(args.query, {
      topK: args.limit || 3,
    });

    if (results.length === 0) {
      console.log(`   [MemorySearch] No memories found`);
      return {
        success: true,
        found: false,
        message: '未找到相关记忆',
      };
    }

    console.log(`   [MemorySearch] Found ${results.length} memories`);

    return {
      success: true,
      found: true,
      count: results.length,
      memories: results.map((r) => ({
        content: r.memory.content,
        score: Math.round(r.score * 100),
        timestamp: r.memory.metadata.timestamp,
      })),
    };
  } catch (error) {
    console.error(`   [MemorySearch] ❌ Search failed:`, error);
    return {
      success: false,
      error: (error as Error).message,
      message: '搜索记忆失败',
    };
  }
}

export const memorySaveTool = {
  name: 'memory_save',
  description: '将当前对话中的重要信息保存到长期记忆中。用于回答"帮我记住xxx"、"请保存这个信息"等问题。',
  parameters: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: '要保存的内容',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: '可选的标签，用于分类',
      },
    },
    required: ['content'],
  },
};

export async function memorySaveExecutor(
  args: { content: string; tags?: string[] },
  memoryService?: MemoryService
): Promise<unknown> {
  console.log(`\n   [MemorySave] 💾 Saving memory`);
  console.log(`   [MemorySave] Content: "${args.content.substring(0, 50)}..."`);
  console.log(`   [MemorySave] Tags: ${args.tags?.join(', ') || 'none'}`);

  if (!memoryService) {
    console.warn(`   [MemorySave] ⚠️ Memory service not available`);
    return {
      success: false,
      error: 'Memory service is not available',
      message: '记忆服务暂不可用',
    };
  }

  try {
    if (!memoryService.isInitialized()) {
      console.log(`   [MemorySave] Memory service not initialized, attempting to initialize...`);
      await memoryService.initialize();
    }

    const id = await memoryService.addMemory(args.content, {
      messageType: 'user',
      tags: args.tags,
    });

    console.log(`   [MemorySave] ✅ Memory saved with id: ${id}`);

    return {
      success: true,
      id,
      message: '记忆已保存',
    };
  } catch (error) {
    console.error(`   [MemorySave] ❌ Save failed:`, error);
    return {
      success: false,
      error: (error as Error).message,
      message: '保存记忆失败',
    };
  }
}
