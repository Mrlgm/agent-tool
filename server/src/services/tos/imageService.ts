import { TosClient, TosClientError, TosServerError } from '@volcengine/tos-sdk';
import { config } from '../../config/environment.js';
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = config.tos.bucket;
const REGION = config.tos.region;
const ENDPOINT = config.tos.endpoint;

let tosClient: TosClient | null = null;

function getTosClient(): TosClient {
  if (!tosClient) {
    tosClient = new TosClient({
      accessKeyId: config.tos.accessKeyId,
      accessKeySecret: config.tos.accessKeySecret,
      region: REGION,
      endpoint: ENDPOINT,
    });
  }
  return tosClient;
}

export interface UploadResult {
  url: string;
  cdnUrl: string;
  objectKey: string;
}

export const imageService = {
  async uploadImage(
    base64Data: string,
    mimeType: string = 'image/png'
  ): Promise<UploadResult> {
    const client = getTosClient();

    const base64Metadata = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Metadata, 'base64');

    const extension = mimeType.split('/')[1] || 'png';
    const objectKey = `image2code/${Date.now()}-${uuidv4()}.${extension}`;

    try {
      const { requestId } = await client.putObject({
        bucket: BUCKET_NAME,
        key: objectKey,
        body: imageBuffer,
        contentType: mimeType,
      });

      console.log(`[TOS] Image uploaded, requestId: ${requestId}`);

      const cdnUrl = `${config.tos.cdnDomain}/${objectKey}`;

      return {
        url: cdnUrl,
        cdnUrl: cdnUrl,
        objectKey,
      };
    } catch (error) {
      if (error instanceof TosClientError) {
        console.error('[TOS] Client Error:', error.message);
        throw new Error(`图片上传失败: ${error.message}`);
      } else if (error instanceof TosServerError) {
        console.error('[TOS] Server Error:', error.message);
        throw new Error(`图片上传失败: ${error.message}`);
      }
      throw error;
    }
  },

  async deleteImage(objectKey: string): Promise<void> {
    const client = getTosClient();

    try {
      await client.deleteObject({
        bucket: BUCKET_NAME,
        key: objectKey,
      });
      console.log(`[TOS] Image deleted: ${objectKey}`);
    } catch (error) {
      console.error('[TOS] Delete error:', error);
    }
  },
};
