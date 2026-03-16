import fs from 'fs/promises';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'data', 'generated');

export const codeStorage = {
  async save(taskId: string, code: string): Promise<void> {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    const filePath = path.join(STORAGE_DIR, `${taskId}.html`);
    await fs.writeFile(filePath, code, 'utf-8');
  },

  async get(taskId: string): Promise<string | null> {
    try {
      const filePath = path.join(STORAGE_DIR, `${taskId}.html`);
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  },

  async delete(taskId: string): Promise<void> {
    try {
      const filePath = path.join(STORAGE_DIR, `${taskId}.html`);
      await fs.unlink(filePath);
    } catch {
      // ignore
    }
  },
};
