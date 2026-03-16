import { LLMService } from '../llm.js';
import type { AnalysisResult } from './types.js';

export class AnalyzerAgent {
  private llm: LLMService;

  constructor() {
    this.llm = new LLMService();
  }

  async analyze(imageUrl: string, description?: string): Promise<AnalysisResult> {
    console.log(`\n[Analyzer] Starting image analysis...`);
    console.log(`[Analyzer] Image URL: ${imageUrl.substring(0, 50)}...`);
    console.log(`[Analyzer] Description: ${description || 'none'}`);

    const prompt = this.buildPrompt(description);

    const messages = [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: prompt,
          },
          {
            type: 'image_url' as const,
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
    ];

    const response = await this.llm.chatWithVision(messages);

    console.log(`[Analyzer] LLM response received, parsing...`);
    return this.parseAnalysisResponse(response.content);
  }

  private buildPrompt(description?: string): string {
    return `你是一个专业的UI/UX分析师。请分析用户上传的图片中的界面设计。

请提取以下信息并以JSON格式返回：
{
  "pageType": "页面类型，如登录页、仪表盘、列表页等",
  "layout": {
    "type": "布局类型，single-column/two-column/grid/hero",
    "sections": ["头部", "主要内容", "底部"]
  },
  "components": [
    {
      "name": "组件名称",
      "type": "button/input/card/navbar/footer/list/table",
      "properties": {}
    }
  ],
  "colors": {
    "primary": "#主色调",
    "secondary": "#次要色",
    "background": "#背景色",
    "text": "#文字色"
  },
  "style": {
    "borderRadius": "圆角大小",
    "shadow": "阴影效果",
    "spacing": "间距风格"
  }
}

用户描述：${description || '无'}
请只返回JSON，不要其他内容。`;
  }

  private parseAnalysisResponse(content: string): AnalysisResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`[Analyzer] Successfully parsed analysis result`);
        return parsed as AnalysisResult;
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.warn(`[Analyzer] Failed to parse JSON, using default values`);
      return {
        pageType: 'unknown',
        layout: { type: 'single-column', sections: ['main'] },
        components: [],
        colors: { primary: '#3b82f6', secondary: '#6b7280', background: '#ffffff', text: '#1f2937' },
        style: { borderRadius: '8px', shadow: '0 2px 4px rgba(0,0,0,0.1)', spacing: '16px' },
      };
    }
  }
}
