import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { AgentService } from '../services/agent.js';

const chatSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant', 'tool']),
      content: z.string(),
      timestamp: z.number(),
      toolCalls: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            arguments: z.record(z.unknown()),
          })
        )
        .optional(),
      toolCallId: z.string().optional(),
      toolResults: z
        .array(
          z.object({
            toolCallId: z.string(),
            result: z.string(),
            isError: z.boolean().optional(),
          })
        )
        .optional(),
    })
  ),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().optional(),
});

export function createChatRouter(agentService: AgentService): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    console.log('\n' + '='.repeat(50));
    console.log(`📥 [${requestId}] Received chat request`);
    console.log('='.repeat(50));

    try {
      const body = chatSchema.parse(req.body);
      const { messages } = body;

      console.log(`📝 [${requestId}] Message count: ${messages.length}`);
      const lastMessage = messages[messages.length - 1];
      console.log(`📝 [${requestId}] Last message role: ${lastMessage.role}`);
      console.log(`📝 [${requestId}] Last message: "${lastMessage.content.substring(0, 100)}${lastMessage.content.length > 100 ? '...' : ''}"`);

      console.log(`\n🤖 [${requestId}] Starting agent processing...`);
      const startTime = Date.now();
      
      const response = await agentService.chat(messages);

      const duration = Date.now() - startTime;
      console.log(`✅ [${requestId}] Agent processing completed in ${duration}ms`);

      console.log(`📤 [${requestId}] Sending response to client`);
      console.log('='.repeat(50));

      res.json({
        message: response,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
      });
    } catch (error) {
      console.error(`❌ [${requestId}] Error:`, error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: '请求参数错误',
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        message: (error as Error).message || '服务器内部错误',
      });
    }
  });

  return router;
}
