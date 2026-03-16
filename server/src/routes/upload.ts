import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { imageService } from '../services/tos/imageService.js';

const uploadSchema = z.object({
  image: z.string().min(1),
});

export function createUploadRouter(): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    try {
      const { image } = uploadSchema.parse(req.body);

      const mimeMatch = image.match(/^data:(\w+\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

      console.log(`\n📤 [Upload] Uploading image (${mimeType})...`);

      const result = await imageService.uploadImage(image, mimeType);

      console.log(`✅ [Upload] Image uploaded: ${result.cdnUrl}`);

      res.json({
        success: true,
        url: result.cdnUrl,
        objectKey: result.objectKey,
      });
    } catch (error) {
      console.error('❌ [Upload] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
      });
    }
  });

  return router;
}
