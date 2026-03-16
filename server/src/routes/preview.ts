import { Router, type Request, type Response } from 'express';
import { codeStorage } from '../services/storage/codeStorage.js';

export function createPreviewRouter(): Router {
  const router = Router();

  router.get('/:taskId', async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const code = await codeStorage.get(taskId);

    if (!code) {
      res.status(404).send('Code not found');
      return;
    }

    res.type('html').send(code);
  });

  return router;
}
