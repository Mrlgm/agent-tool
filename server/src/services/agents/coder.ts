import { LLMService } from '../llm.js';
import type { Message } from '../../types/index.js';
import type { AnalysisResult } from './types.js';

export class CoderAgent {
  private llm: LLMService;

  constructor() {
    this.llm = new LLMService();
  }

  async generate(analysis: AnalysisResult, description?: string): Promise<string> {
    console.log(`\n[Coder] Starting code generation...`);
    console.log(`[Coder] Page type: ${analysis.pageType}`);
    console.log(`[Coder] Components: ${analysis.components.length}`);

    const prompt = this.buildPrompt(analysis, description);

    const messages: Message[] = [
      {
        id: 'system',
        role: 'system',
        content: '你是一个专业的前端开发者，擅长生成高质量的HTML和CSS代码。',
        timestamp: Date.now(),
      },
      {
        id: 'user',
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
      },
    ];

    const response = await this.llm.chat(messages);

    console.log(`[Coder] LLM response received, extracting code...`);
    return this.extractHTMLCode(response.content);
  }

  private buildPrompt(analysis: AnalysisResult, description?: string): string {
    return `你是一个专业的前端开发者。请根据以下分析结果生成HTML代码。

分析结果：
${JSON.stringify(analysis, null, 2)}

用户需求：${description || '生成一个美观的页面'}

要求：
1. 生成单一HTML文件，包含内联CSS和少量JS
2. 使用现代CSS布局（Flexbox/Grid）
3. 代码简洁、语义化
4. 保持与原图相似的视觉效果
5. 添加适当的交互效果（hover、focus等）
6. 确保代码可以直接在浏览器中运行
7. 不要使用任何外部库或框架（如Bootstrap、jQuery等）

请只返回HTML代码，不要其他内容。`;
  }

  private extractHTMLCode(content: string): string {
    const htmlMatch = content.match(/```html([\s\S]*?)```/);
    if (htmlMatch) {
      return htmlMatch[1].trim();
    }

    const codeMatch = content.match(/```([\s\S]*?)```/);
    if (codeMatch) {
      return codeMatch[1].trim();
    }

    if (content.includes('<!DOCTYPE') || content.includes('<html')) {
      return content.trim();
    }

    return content.trim();
  }
}
