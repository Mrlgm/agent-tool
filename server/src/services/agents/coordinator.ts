import { v4 as uuidv4 } from 'uuid';
import { AnalyzerAgent } from './analyzer.js';
import { CoderAgent } from './coder.js';
import { codeStorage } from '../storage/codeStorage.js';
import type { GenerateInput, GenerateOutput } from './types.js';

export class CoordinatorAgent {
  private analyzer: AnalyzerAgent;
  private coder: CoderAgent;

  constructor() {
    this.analyzer = new AnalyzerAgent();
    this.coder = new CoderAgent();
  }

  async coordinate(input: GenerateInput): Promise<GenerateOutput> {
    const taskId = `task-${uuidv4()}`;

    console.log(`\n${'='.repeat(50)}`);
    console.log(`🎨 [Coordinator] Starting code generation task: ${taskId}`);
    console.log('='.repeat(50));

    try {
      console.log(`\n📊 [Coordinator] Step 1: Analyzing image...`);
      const analysis = await this.analyzer.analyze(input.imageUrl, input.description);

      console.log(`\n💻 [Coordinator] Step 2: Generating code...`);
      const code = await this.coder.generate(analysis, input.description);

      console.log(`\n💾 [Coordinator] Step 3: Saving code...`);
      await codeStorage.save(taskId, code);

      console.log(`\n✅ [Coordinator] Task ${taskId} completed successfully!`);

      return {
        taskId,
        status: 'completed',
        code,
        previewUrl: `/api/preview/${taskId}`,
        analysis,
      };
    } catch (error) {
      console.error(`\n❌ [Coordinator] Task ${taskId} failed:`, error);

      return {
        taskId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getStatus(taskId: string): Promise<GenerateOutput | null> {
    const code = await codeStorage.get(taskId);
    if (!code) return null;

    return {
      taskId,
      status: 'completed',
      code,
      previewUrl: `/api/preview/${taskId}`,
    };
  }
}
