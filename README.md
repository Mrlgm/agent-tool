# 🤖 Agent Tool

一个基于 React + TypeScript + Express 的智能 Agent 对话系统，支持工具调用（Tool Calling）功能。

## ✨ 功能特性

- **智能对话**：基于火山方舟（Volcengine Ark）大语言模型的对话能力
- **工具调用**：支持多种工具扩展
  - 🔍 **搜索工具**：集成 Tavily 搜索 API，支持实时网络搜索
  - 📅 **日期计算**：支持日期加减、日期间隔计算等
- **Agent 架构**：自动决策何时调用工具，整合工具结果回答用户问题
- **现代化前端**：React + TypeScript + Tailwind CSS + Vite
- **类型安全**：全项目使用 TypeScript，提供完整的类型支持

## 🏗️ 项目结构

```
agent-tool/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── components/     # 通用组件
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── InputArea.tsx
│   │   │   └── Loading.tsx
│   │   ├── features/       # 功能模块
│   │   │   └── chat/
│   │   │       ├── ChatPage.tsx
│   │   │       └── MessageList.tsx
│   │   ├── services/       # API 服务
│   │   │   └── api.ts
│   │   ├── stores/         # 状态管理（Zustand）
│   │   │   └── chatStore.ts
│   │   ├── types/          # 类型定义
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── server/                 # 后端服务
│   ├── src/
│   │   ├── config/         # 配置管理
│   │   │   └── environment.ts
│   │   ├── routes/         # API 路由
│   │   │   └── chat.ts
│   │   ├── services/       # 业务服务
│   │   │   ├── tools/      # 工具实现
│   │   │   │   ├── index.ts
│   │   │   │   ├── search.ts      # Tavily 搜索
│   │   │   │   └── datetime.ts    # 日期计算
│   │   │   ├── agent.ts    # Agent 核心逻辑
│   │   │   ├── llm.ts      # LLM 服务封装
│   │   │   ├── embedding/  # 向量化服务
│   │   │   │   ├── embeddingservice.ts
│   │   │   │   └── types.ts
│   │   │   └── memory/     # 记忆服务（ChromaDB）
│   │   │       ├── memoryservice.ts
│   │   │       ├── vectorstore.ts
│   │   │       └── types.ts
│   │   ├── types/          # 类型定义
│   │   │   └── index.ts
│   │   └── index.ts        # 服务入口
│   ├── .env.example        # 环境变量示例
│   └── package.json
│
└── package.json            # 根项目配置
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9
- Docker（用于启动 ChromaDB 向量数据库）

### 安装依赖

```bash
# 安装所有依赖（根项目 + client + server）
npm run install:all
```

### 配置环境变量

```bash
cd server
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API 密钥：

```env
# 火山方舟配置（必需）
VOLCENGINE_API_KEY=your-api-key-here
VOLCENGINE_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
VOLCENGINE_MODEL=doubao-pro-32k

# Tavily 搜索配置（可选，用于搜索功能）
TAVILY_API_KEY=your-tavily-api-key

# ChromaDB 向量数据库配置（必需，需要先启动 Docker 服务）
VECTOR_DB_HOST=localhost
VECTOR_DB_PORT=8000
VECTOR_DB_COLLECTION=long_term_memory

# 服务配置
PORT=3000
NODE_ENV=development
```

### 启动 ChromaDB 向量数据库

本项目使用 ChromaDB 作为向量数据库，需要通过 Docker 启动服务：

```bash
# 方式一：直接使用 Docker 启动（数据存储在 ./data/chroma 目录）
docker run -d --name chromadb -p 8000:8000 -v $(pwd)/data/chroma:/chroma/chroma chromadb/chroma:latest

# 方式二：使用 docker-compose（推荐）
# 在项目根目录创建 docker-compose.yml 文件：
```

#### docker-compose.yml（推荐）

```yaml
version: '3.8'
services:
  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - ./data/chroma:/chroma/chroma
    restart: unless-stopped
```

启动服务：

```bash
docker-compose up -d
```

验证 ChromaDB 是否启动成功：

```bash
curl http://localhost:8000/api/v2/version
```

### 启动开发服务器

```bash
# 同时启动前端和后端
npm run dev
```

或者分别启动：

```bash
# 终端 1：启动后端
npm run dev:server

# 终端 2：启动前端
npm run dev:client
```

- 前端地址：http://localhost:5173
- 后端地址：http://localhost:3000

## 🔧 技术栈

### 前端
- **框架**：React 18
- **语言**：TypeScript
- **构建工具**：Vite
- **样式**：Tailwind CSS
- **状态管理**：Zustand

### 后端
- **框架**：Express 4
- **语言**：TypeScript
- **运行环境**：Node.js + tsx
- **AI 服务**：火山方舟（Volcengine Ark）
- **搜索服务**：Tavily API
- **向量数据库**：ChromaDB（通过 Docker 运行）

## 📝 API 文档

### 对话接口

**POST** `/api/chat`

请求体：
```json
{
  "messages": [
    {
      "id": "msg-xxx",
      "role": "user",
      "content": "今天天气怎么样？",
      "timestamp": 1234567890
    }
  ]
}
```

响应：
```json
{
  "message": {
    "id": "msg-yyy",
    "role": "assistant",
    "content": "我来帮您搜索一下今天的天气...",
    "timestamp": 1234567891,
    "toolCalls": [...]
  }
}
```

### 健康检查

**GET** `/health`

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔌 扩展工具

要添加新的工具，需要在 `server/src/services/tools/` 目录下创建工具定义和执行器：

```typescript
// 1. 定义工具
export const myTool = {
  name: 'my_tool',
  description: '工具描述',
  parameters: {
    type: 'object',
    properties: {
      param1: { type: 'string' },
    },
    required: ['param1'],
  },
};

// 2. 实现执行器
export async function myExecutor(args: { param1: string }) {
  // 工具逻辑
  return result;
}

// 3. 在 server/src/index.ts 中注册
import { myTool, myExecutor } from './services/tools/myTool.js';
toolRegistry.register(myTool, myExecutor as ToolExecutor);
```

## 📄 许可证

MIT
