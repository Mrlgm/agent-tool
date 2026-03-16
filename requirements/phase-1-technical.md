# 🎨 Image2Code 第一期技术方案

## 项目概述
基于现有单Agent对话系统，改造成多Agent协作的图片转前端代码生成平台。

---

## 一、技术架构设计

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                           Client                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ ImageUploader │  │ CodePreview  │  │    ChatPanel        │  │
│  │   组件       │  │   组件      │  │      组件           │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └─────────────────┴──────────────────────┘              │
│                           │                                      │
│                    ┌──────┴──────┐                              │
│                    │  generateApi │                              │
│                    └──────┬──────┘                              │
└───────────────────────────┼────────────────────────────────────┘
                            │ 1. 上传图片(Base64)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Server                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    TOS Service                            │   │
│  │            (上传图片到火山引擎TOS获取CDN链接)              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            │ 2. 返回CDN链接
                            ▼
┌───────────────────────────┼────────────────────────────────────┐
│                    ┌──────┴──────┐                              │
│                    │  generate   │                              │
│                    │   router   │                              │
│                    └──────┬──────┘                              │
│                           │                                      │
│         ┌─────────────────┴─────────────────┐                    │
│         │                                   │                   │
│  ┌──────┴──────┐                    ┌───────┴────────┐          │
│  │ Coordinator │                    │  LLM Service  │          │
│  │   Agent     │                    │  (火山方舟)    │          │
│  └──────┬──────┘                    └───────────────┘          │
│         │                                                    │
│  ┌──────┴──────┐         ┌───────────────┐                     │
│  │   Analyzer  │────────▶│    Coder      │                     │
│  │   Agent     │         │    Agent      │                     │
│  └─────────────┘         └───────┬───────┘                     │
│                                  │                              │
│                                  ▼                              │
│                         ┌───────────────┐                      │
│                         │  Code Storage │                      │
│                         └───────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 图片上传流程

```
客户端                          服务端                          TOS/火山引擎
  │                               │                                 │
  │  1. 选择图片(Base64)         │                                 │
  │──────────────────────────────>│                                 │
  │                               │  2. 上传Base64到TOS            │
  │                               │────────────────────────────────>│
  │                               │                                 │
  │                               │  3. 返回CDN链接                 │
  │                               │<────────────────────────────────│
  │                               │                                 │
  │  4. 返回CDN链接              │                                 │
  │<──────────────────────────────│                                 │
  │                               │                                 │
  │  5. 调用生成API(CDN链接)     │                                 │
  │──────────────────────────────>│                                 │
  │                               │  6. LLM分析(使用CDN链接)       │
  │                               │────────────────────────────────>│
  │                               │                                 │
  │  7. 返回生成结果             │                                 │
  │<──────────────────────────────│                                 │
  │                               │                                 │
```

### 1.3 Agent职责定义

| Agent | 职责 | 输入 | 输出 |
|-------|------|------|------|
| **Coordinator** | 流程协调、任务分发 | 用户请求 | 分发任务给Analyzer |
| **Analyzer** | 图片分析、UI提取 | Base64图片 | AnalysisResult JSON |
| **Coder** | 代码生成 | AnalysisResult | HTML代码字符串 |

### 1.4 数据流
```
用户上传图片 + 描述
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  1. 前端上传图片到服务器                                    │
│     POST /api/upload { image: Base64 }                     │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  2. 服务端上传图片到TOS                                     │
│     - 调用 tosService.uploadImage(base64)                  │
│     - 返回 CDN 链接                                          │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Coordinator.coordinate(input)                          │
│    1. 验证输入                                              │
│    2. 调用 Analyzer（使用 CDN 链接）                       │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Analyzer.analyze(imageUrl, description)                 │
│    1. 构建Prompt                                           │
│    2. 调用LLM（使用CDN图片URL）                           │
│    3. 解析JSON响应                                          │
│    4. 返回AnalysisResult                                   │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Coder.generate(analysisResult, description)            │
│    1. 构建代码生成Prompt                                    │
│    2. 调用LLM                                              │
│    3. 提取HTML代码                                         │
│    4. 保存代码                                             │
│    5. 返回结果                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、后端技术方案

### 2.1 新增文件结构

```
server/src/
├── services/
│   ├── agents/                    # 新增多Agent模块
│   │   ├── coordinator.ts        # 协调Agent
│   │   ├── analyzer.ts           # 分析Agent
│   │   ├── coder.ts              # 代码生成Agent
│   │   ├── types.ts              # Agent类型定义
│   │   └── index.ts              # 统一导出
│   │
│   ├── storage/                  # 新增：代码存储
│   │   └── codeStorage.ts        # 临时代码存储
│   │
│   ├── tos/                      # 新增：火山引擎TOS服务
│   │   └── imageService.ts       # 图片上传服务
│   │
│   ├── llm/
│   │   └── llm.ts               # 复用现有
│   │
│   └── memory/
│       └── ...                   # 保留现有（可选用）
│
├── routes/
│   ├── upload.ts                 # 新增：图片上传API
│   ├── generate.ts               # 新增：代码生成API
│   ├── chat.ts                  # 保留：对话API
│   └── index.ts                 # 路由汇总
│
├── config/
│   └── environment.ts            # 更新：添加TOS配置
│
└── index.ts                     # 更新：注册新路由
```

### 2.2 核心模块设计

#### 2.2.1 Agent类型定义 (types.ts)

```typescript
// 图片上传结果
export interface ImageUploadResult {
  url: string;           // CDN 访问链接
  cdnUrl: string;        // CDN 访问链接（与url相同）
  objectKey: string;     // TOS 对象键
  taskId: string;       // 关联的任务ID
}

// 输入输出类型
export interface GenerateInput {
  imageUrl: string;      // CDN 链接（而非Base64）
  description?: string;  // 用户需求描述
  framework?: string;    // 框架类型（第一期只用html）
}

export interface GenerateOutput {
  taskId: string;
  status: TaskStatus;
  code?: string;
  previewUrl?: string;
  analysis?: AnalysisResult;
  error?: string;
}

export type TaskStatus = 
  | 'pending'
  | 'analyzing'
  | 'generating'
  | 'completed'
  | 'failed';

// 分析结果
export interface AnalysisResult {
  pageType: string;
  layout: {
    type: 'single-column' | 'two-column' | 'grid' | 'hero';
    sections: string[];
  };
  components: ComponentInfo[];
  colors: ColorScheme;
  style: StyleInfo;
}

export interface ComponentInfo {
  name: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent?: string;
}

export interface StyleInfo {
  borderRadius: string;
  shadow: string;
  spacing: string;
  fontFamily?: string;
}
```

#### 2.2.2 TOS 图片上传服务 (imageService.ts)

```typescript
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
  /**
   * 上传图片到火山引擎TOS
   * @param base64Data Base64编码的图片数据
   * @param mimeType 图片MIME类型 (如 image/png, image/jpeg)
   * @returns CDN访问链接
   */
  async uploadImage(base64Data: string, mimeType: string = 'image/png'): Promise<UploadResult> {
    const client = getTosClient();
    
    // 解析Base64数据
    const base64Metadata = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Metadata, 'base64');
    
    // 生成唯一对象键
    const objectKey = `image2code/${Date.now()}-${uuidv4()}.${mimeType.split('/')[1] || 'png'}`;
    
    try {
      // 上传到TOS
      const { requestId } = await client.putObject({
        bucket: BUCKET_NAME,
        key: objectKey,
        content: imageBuffer,
        contentType: mimeType,
      });
      
      console.log(`[TOS] Image uploaded, requestId: ${requestId}`);
      
      // 构建CDN链接
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

  /**
   * 删除TOS中的图片
   */
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
```

#### 2.2.3 Coordinator Agent (coordinator.ts)

```typescript
import { v4 as uuidv4 } from 'uuid';
import { AnalyzerAgent } from './analyzer.js';
import { CoderAgent } from './coder.js';
import { codeStorage } from '../storage/codeStorage.js';
import { imageService } from '../tos/imageService.js';
import type { GenerateInput, GenerateOutput, TaskStatus, ImageUploadResult } from './types.js';

export class CoordinatorAgent {
  private analyzer: AnalyzerAgent;
  private coder: CoderAgent;

  constructor() {
    this.analyzer = new AnalyzerAgent();
    this.coder = new CoderAgent();
  }

  async coordinate(input: GenerateInput): Promise<GenerateOutput> {
    const taskId = `task-${uuidv4()}`;
    
    try {
      // Step 1: 分析图片（使用CDN链接）
      console.log(`[Coordinator] Task ${taskId}: Starting analysis...`);
      const analysis = await this.analyzer.analyze(input.imageUrl, input.description);
      
      // Step 2: 生成代码
      console.log(`[Coordinator] Task ${taskId}: Starting code generation...`);
      const code = await this.coder.generate(analysis, input.description);
      
      // Step 3: 保存代码
      await codeStorage.save(taskId, code);
      
      return {
        taskId,
        status: 'completed',
        code,
        previewUrl: `/api/preview/${taskId}`,
        analysis,
      };
    } catch (error) {
      console.error(`[Coordinator] Task ${taskId} failed:`, error);
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
```

#### 2.2.4 Analyzer Agent (analyzer.ts)

```typescript
import { LLMService } from '../llm.js';
import type { AnalysisResult } from './types.js';

export class AnalyzerAgent {
  private llm: LLMService;

  constructor() {
    this.llm = new LLMService();
  }

  async analyze(imageUrl: string, description?: string): Promise<AnalysisResult> {
    const prompt = this.buildPrompt(description);
    
    // 使用CDN链接而非Base64
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
              url: imageUrl,  // CDN链接
            },
          },
        ],
      },
    ];

    const response = await this.llm.chatWithVision(messages);
    
    // 解析JSON响应
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
      // 尝试提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      // 返回默认值
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
```

#### 2.2.4 Coder Agent (coder.ts)

```typescript
import { LLMService } from '../llm.js';
import type { AnalysisResult } from './types.js';

export class CoderAgent {
  private llm: LLMService;

  constructor() {
    this.llm = new LLMService();
  }

  async generate(analysis: AnalysisResult, description?: string): Promise<string> {
    const prompt = this.buildPrompt(analysis, description);
    
    const messages = [
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    const response = await this.llm.chat(messages);
    
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
    // 尝试提取HTML代码块
    const htmlMatch = content.match(/```html([\s\S]*?)```/);
    if (htmlMatch) {
      return htmlMatch[1].trim();
    }
    
    // 尝试提取普通code块
    const codeMatch = content.match(/```([\s\S]*?)```/);
    if (codeMatch) {
      return codeMatch[1].trim();
    }
    
    // 如果没有代码块，检查是否直接是HTML
    if (content.includes('<!DOCTYPE') || content.includes('<html')) {
      return content.trim();
    }
    
    // 返回原始内容
    return content.trim();
  }
}
```

#### 2.2.5 代码存储 (codeStorage.ts)

```typescript
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
```

### 2.3 API设计

#### 2.3.1 图片上传API (routes/upload.ts)

```typescript
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { imageService } from '../services/tos/imageService.js';

const uploadSchema = z.object({
  image: z.string().min(1),  // Base64编码的图片
});

export function createUploadRouter(): Router {
  const router = Router();

  // 上传图片到TOS
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { image } = uploadSchema.parse(req.body);
      
      // 解析MIME类型
      const mimeMatch = image.match(/^data:(\w+\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      
      console.log(`\n📤 [Upload] Uploading image (${mimeType})...`);
      
      // 上传到TOS
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
        error: error instanceof Error ? error.message : '上传失败' 
      });
    }
  });

  return router;
}
```

#### 2.3.2 生成API (routes/generate.ts)

```typescript
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { CoordinatorAgent } from '../services/agents/coordinator.js';

const generateSchema = z.object({
  imageUrl: z.string().min(1),  // CDN链接（而非Base64）
  description: z.string().optional(),
  framework: z.enum(['html']).default('html'),
});

export function createGenerateRouter(): Router {
  const router = Router();
  const coordinator = new CoordinatorAgent();

  // 启动生成
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
        error: error instanceof Error ? error.message : '生成失败' 
      });
    }
  });

  // 查询状态
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
```

#### 2.3.2 预览API (routes/preview.ts)

```typescript
import { Router, type Request, type Response } from 'express';
import { codeStorage } from '../services/storage/codeStorage.js';

export function createPreviewRouter(): Router {
  const router = Router();

  // 获取预览HTML
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
```

### 2.4 LLM服务扩展

现有LLM服务只支持文本，需要扩展支持视觉模型：

```typescript
// services/llm.ts 新增方法

interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
}

async chatWithVision(messages: ChatMessage[]): Promise<{
  content: string;
  toolCalls?: ToolCall[];
}> {
  // 调用火山方舟视觉模型
  const response = await this.client.chat.completions.create({
    model: 'doubao-pro-32k', // 或视觉模型
    messages: messages as any,
    temperature: 0.7,
  });

  return {
    content: response.choices[0]?.message?.content || '',
  };
}
```

---

## 三、前端技术方案

### 3.1 新增文件结构

```
client/src/
├── components/
│   ├── ImageUploader.tsx          # 图片上传组件
│   ├── CodePreview.tsx           # 代码预览组件
│   ├── PreviewToolbar.tsx        # 预览工具栏
│   ├── CodeViewer.tsx            # 代码查看器
│   └── LoadingOverlay.tsx        # 加载遮罩
│
├── features/
│   ├── generate/                 # 代码生成功能
│   │   ├── GeneratePage.tsx      # 主页面
│   │   └── useGenerate.ts        # 生成逻辑hook
│   │
│   └── chat/                     # 保留现有对话
│       └── ...
│
├── stores/
│   └── generateStore.ts          # 生成状态管理
│
├── services/
│   └── generateApi.ts             # 生成API服务
│
└── App.tsx                       # 更新：路由配置
```

### 3.2 核心组件设计

#### 3.2.1 图片上传组件 (ImageUploader.tsx)

```typescript
import { useState, useCallback } from 'react';

interface ImageUploaderProps {
  onImageSelect: (imageUrl: string, file: File) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
}

export function ImageUploader({ 
  onImageSelect, 
  onUploadStart,
  onUploadComplete,
  onUploadError,
  disabled 
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onUploadError?.('请上传图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onUploadError?.('图片大小不能超过5MB');
      return;
    }

    // 预览本地图片
    const localPreview = await fileToBase64(file);
    setPreview(localPreview);
    
    // 上传到服务器（TOS）
    setIsUploading(true);
    onUploadStart?.();
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: localPreview }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        onImageSelect(data.url, file);
        onUploadComplete?.(data.url);
      } else {
        onUploadError?.(data.error || '上传失败');
      }
    } catch (error) {
      onUploadError?.('网络错误，请重试');
    } finally {
      setIsUploading(false);
    }
  }, [onImageSelect, onUploadStart, onUploadComplete, onUploadError]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleFile(file);
      }
    }
  }, [handleFile]);

  return (
    <div
      onPaste={handlePaste}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      {/* 上传区域UI */}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

#### 3.2.2 代码预览组件 (CodePreview.tsx)

```typescript
import { useState, useEffect, useRef } from 'react';

interface CodePreviewProps {
  taskId: string | null;
  device: 'mobile' | 'tablet' | 'desktop';
  onRefresh: () => void;
}

const DEVICE_WIDTHS = {
  mobile: 375,
  tablet: 768,
  desktop: '100%',
};

export function CodePreview({ taskId, device, onRefresh }: CodePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!taskId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 加载预览
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.onload = () => setLoading(false);
      iframe.onerror = () => {
        setError('加载失败');
        setLoading(false);
      };
      iframe.src = `/api/preview/${taskId}`;
    }
  }, [taskId]);

  const width = DEVICE_WIDTHS[device];

  return (
    <div className="preview-container">
      <div className="preview-frame" style={{ width }}>
        {loading && <div className="loading-overlay">加载中...</div>}
        {error && <div className="error-message">{error}</div>}
        <iframe
          ref={iframeRef}
          className="preview-iframe"
          title="preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
```

#### 3.2.3 生成页面 (GeneratePage.tsx)

```typescript
import { useState } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { CodePreview } from '../components/CodePreview';
import { PreviewToolbar } from '../components/PreviewToolbar';
import { useGenerate } from './useGenerate';

export function GeneratePage() {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  const { generate, result, isGenerating } = useGenerate();

  const handleGenerate = () => {
    if (!image) {
      alert('请先上传图片');
      return;
    }
    generate({ image, description });
  };

  return (
    <div className="generate-page">
      <div className="left-panel">
        <ImageUploader
          onImageSelect={(base64) => setImage(base64)}
          disabled={isGenerating}
        />
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述您想要的页面效果..."
          disabled={isGenerating}
        />
        
        <button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? '生成中...' : '开始生成代码'}
        </button>
      </div>

      <div className="right-panel">
        <PreviewToolbar
          device={device}
          onDeviceChange={setDevice}
          onRefresh={() => result?.taskId && generate({ image: image!, description })}
        />
        
        <CodePreview
          taskId={result?.taskId || null}
          device={device}
          onRefresh={() => {}}
        />
      </div>
    </div>
  );
}
```

#### 3.2.4 状态管理 (generateStore.ts)

```typescript
import { create } from 'zustand';

interface GenerateState {
  image: string | null;
  description: string;
  taskId: string | null;
  code: string | null;
  status: 'idle' | 'generating' | 'completed' | 'error';
  error: string | null;
  
  setImage: (image: string | null) => void;
  setDescription: (description: string) => void;
  setResult: (taskId: string, code: string) => void;
  setStatus: (status: 'idle' | 'generating' | 'completed' | 'error') => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGenerateStore = create<GenerateState>((set) => ({
  image: null,
  description: '',
  taskId: null,
  code: null,
  status: 'idle',
  error: null,

  setImage: (image) => set({ image }),
  setDescription: (description) => set({ description }),
  setResult: (taskId, code) => set({ taskId, code, status: 'completed' }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: 'error' }),
  reset: () => set({
    image: null,
    description: '',
    taskId: null,
    code: null,
    status: 'idle',
    error: null,
  }),
}));
```

### 3.3 路由配置

```typescript
// App.tsx 更新
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChatPage } from './features/chat/ChatPage';
import { GeneratePage } from './features/generate/GeneratePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/generate" element={<GeneratePage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 四、关键技术点

### 4.1 图片处理（TOS云存储）

| 场景 | 方案 |
|------|------|
| 图片上传 | 前端Base64 → 服务端 → TOS对象存储 |
| CDN加速 | 自动生成CDN访问链接 |
| 图片格式 | 支持 PNG、JPG、WebP、GIF |
| 文件大小 | 建议 ≤5MB |
| 对象命名 | `image2code/{timestamp}-{uuid}.{ext}` |

### 4.2 火山引擎TOS集成

参考 [火山引擎TOS官方文档](https://www.volcengine.com/docs/6349/113483)：

```bash
# 安装TOS SDK
npm install @volcengine/tos-sdk
```

**TOS配置 (environment.ts)**：
```typescript
export const config = {
  // ... 现有配置
  tos: {
    accessKeyId: process.env.TOS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.TOS_ACCESS_KEY_SECRET || '',
    region: process.env.TOS_REGION || 'cn-beijing',
    endpoint: process.env.TOS_ENDPOINT || 'tos-cn-beijing.volces.com',
    bucket: process.env.TOS_BUCKET || 'image2code-bucket',
    cdnDomain: process.env.TOS_CDN_DOMAIN || 'https://image2code.yourcdn.com',
  },
};
```

**环境变量 (.env)**：
```env
# 火山引擎TOS配置
TOS_ACCESS_KEY_ID=your-access-key-id
TOS_ACCESS_KEY_SECRET=your-access-key-secret
TOS_REGION=cn-beijing
TOS_ENDPOINT=tos-cn-beijing.volces.com
TOS_BUCKET=image2code-bucket
TOS_CDN_DOMAIN=https://your-cdn-domain.com
```

### 4.3 LLM 视觉支持

火山方舟视觉模型调用方式：
```typescript
// 使用多模态消息格式
const messages = [
  {
    role: 'user',
    content: [
      { type: 'text', text: '请分析这张图片' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,...' } }
    ]
  }
];
```

### 4.4 预览技术

| 方案 | 优点 | 缺点 |
|------|------|------|
| iframe + Base64 | 简单，无后端 | 代码量大时性能差 |
| iframe + 内部API | 性能好 | 需要后端支持 |
| **推荐：iframe + /api/preview/:taskId** | 平衡性能和复杂度 | 需要存储代码 |

iframe 安全配置：
```html
<iframe 
  sandbox="allow-scripts allow-same-origin" 
  // 禁止 allow-top-navigation, allow-forms
/>
```

### 4.5 错误处理

| 错误类型 | 处理方式 |
|----------|----------|
| 图片格式错误 | 前端拦截，提示用户 |
| LLM调用失败 | 重试1-2次，返回友好错误 |
| 代码解析失败 | 使用默认模板 |
| 预览加载失败 | 显示错误提示 |

---

## 五、实施计划

### 5.1 Sprint 1: 基础设施（1-2天）

1. 创建 `server/src/services/agents/` 目录
2. 创建 `server/src/services/tos/` 目录
3. 实现 `types.ts` 类型定义
4. 实现 `imageService.ts` TOS上传服务
5. 实现 `codeStorage.ts` 存储服务
6. 配置 `routes/upload.ts` 图片上传路由
7. 配置 `routes/generate.ts` 生成路由
8. 更新 `server/src/index.ts` 注册路由
9. 更新环境变量配置

### 5.2 Sprint 2: Agent核心（2-3天）

1. 扩展 LLM 服务支持视觉模型
2. 实现 `AnalyzerAgent` 
3. 实现 `CoderAgent`
4. 实现 `CoordinatorAgent`
5. 端到端测试 Agent 流程

### 5.3 Sprint 3: 前端基础（2-3天）

1. 安装 React Router
2. 创建 `ImageUploader` 组件（支持TOS上传）
3. 创建 `CodePreview` 组件
4. 创建 `GeneratePage` 页面
5. 实现 API 服务调用

### 5.4 Sprint 4: 完善功能（1-2天）

1. 实现预览设备切换
2. 添加加载状态
3. 错误处理和提示
4. 样式优化
5. 端到端测试

---

## 六、依赖清单

### 6.1 后端新增依赖
```json
{
  "dependencies": {
    "uuid": "^9.0.0",
    "@volcengine/tos-sdk": "^2.0.0"
  }
}
```

### 6.2 前端新增依赖
```json
{
  "dependencies": {
    "react-router-dom": "^6.x"
  }
}
```

### 6.3 现有可复用

| 模块 | 复用方式 |
|------|----------|
| LLM Service | 扩展支持视觉 |
| Tool Registry | 不需要 |
| Memory Service | 不需要（第一期）|
| Zustand | 复用（扩展状态）|
| Tailwind CSS | 复用 |

---

## 七、测试用例

### 7.1 功能测试

| 用例 | 步骤 | 预期结果 |
|------|------|----------|
| 图片上传 | 选择PNG文件 | 显示预览缩略图 |
| 拖拽上传 | 拖拽图片到上传区 | 显示预览缩略图 |
| 粘贴上传 | Ctrl+V 粘贴图片 | 显示预览缩略图 |
| 生成代码 | 点击生成按钮 | 右侧显示预览 |
| 设备切换 | 点击手机/平板图标 | 预览宽度变化 |
| 刷新预览 | 点击刷新按钮 | 重新加载预览 |

### 7.2 边界测试

| 用例 | 步骤 | 预期结果 |
|------|------|----------|
| 大文件 | 上传10MB图片 | 提示文件过大 |
| 错误格式 | 上传PDF文件 | 提示格式不支持 |
| 空描述 | 不输入描述直接生成 | 使用默认描述 |
| 网络错误 | 模拟LLM调用失败 | 显示错误提示 |

---

## 八、风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 视觉模型不支持 | 核心功能无法实现 | 确认火山方舟模型能力 |
| LLM生成代码质量 | 可能生成错误代码 | 添加代码验证和错误处理 |
| 预览跨域 | 无法加载预览 | 使用同域API或Base64 |
| 生成速度慢 | 用户体验差 | 添加加载状态和超时 |

---

## 九、关联文档

- [第一期需求文档](../requirements/phase-1-requirements.md)
- [LLM服务设计](../server/services/llm.ts)
- [前端组件设计](../client/src/components/)
