import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { CoordinatorAgent } from '../services/agents/coordinator.js';

const generateSchema = z.object({
  imageUrl: z.string().min(1),
  description: z.string().optional(),
  framework: z.enum(['html']).default('html'),
});

export function createGenerateRouter(): Router {
  const router = Router();
  const coordinator = new CoordinatorAgent();

  router.post('/start', async (req: Request, res: Response) => {
    try {
      const input = generateSchema.parse(req.body);

      console.log('\n🎨 [Generate] Starting code generation...');
      const result = await coordinator.coordinate({
        imageUrl: input.imageUrl,
        description: input.description,
        framework: input.framework,
      });

      res.json(result);
    } catch (error) {
      console.error('❌ [Generate] Error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : '生成失败',
      });
    }
  });

  router.get('/status/:taskId', async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const result = await coordinator.getStatus(taskId);

    if (!result) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(result);
  });

  return router;
}
