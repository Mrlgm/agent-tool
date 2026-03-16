# 🎨 图片生成前端代码 - 第三期需求文档

## 项目名称
**Image2Code** - 图片转前端代码生成平台

## 阶段目标
在第二期基础上，支持多种前端框架（React、Vue）输出，增加Planner Agent进行技术规划，提升代码生成质量。

---

## 一、本期新增功能概览

### 1.1 功能清单

| 序号 | 功能模块 | 功能描述 | 优先级 |
|------|----------|----------|--------|
| 1 | 框架选择 | 支持React/Vue/HTML等多种框架 | P0 |
| 2 | Planner Agent | 技术方案规划与组件拆分 | P0 |
| 3 | 组件拆分 | 生成多个组件文件 | P0 |
| 4 | 项目结构 | 生成完整项目结构 | P1 |
| 5 | 依赖管理 | 自动生成package.json | P1 |

### 1.2 保留前两期功能
- ✅ 图片上传与分析
- ✅ 代码生成（多种框架）
- ✅ 代码审核
- ✅ 代码编辑
- ✅ 实时预览
- ✅ 多轮优化
- ✅ 版本管理

---

## 二、详细功能需求

### 2.1 框架选择模块

#### 功能需求
- [ ] 支持选择输出框架
- [ ] 框架选项：
  - **HTML + CSS + JS**（纯静态）
  - **React + Tailwind CSS**
  - **React + styled-components**
  - **Vue 3 + Composition API**
  - **Vue 3 + Options API**
- [ ] 切换框架后重新生成代码
- [ ] 框架说明和推荐

#### 界面布局
```
┌─────────────────────────────────────────────────────────────┐
│  🤖 Image2Code                                              │
├─────────────────────┬───────────────────────────────────────┤
│                     │   框架: [React + Tailwind ▼]          │
│   ┌───────────┐     │                                       │
│   │           │     │   ┌───────────────────────────────┐   │
│   │  上传区域  │     │   │         预览区域             │   │
│   │           │     │   │                              │   │
│   └───────────┘     │   └───────────────────────────────┘   │
│                     │                                       │
│   需求描述:          │   [手机] [平板] [桌面]  [刷新]         │
│   ┌───────────┐     │                                       │
│   │           │     │   ┌───────────────────────────────┐   │
│   └───────────┘     │   │  src/                       │   │
│                     │   │    components/              │   │
│   框架: [选择 ▼]    │   │      Button.tsx             │   │
│                     │   │      Card.tsx               │   │
│   [开始生成代码]    │   │      Input.tsx               │   │
│   [优化当前代码]    │   │    App.tsx                  │   │
│                     │   │    index.css                │   │
│                     │   │   [查看完整项目]            │   │
│                     │   └───────────────────────────────┘   │
├─────────────────────┴───────────────────────────────────────┤
│                      对话面板                               │
│  用户: 用React帮我重写这个登录页面                           │
│  🤖 好的，正在切换到React + Tailwind CSS...                 │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Planner Agent模块

#### 功能需求
- [ ] 分析用户需求和图片复杂度
- [ ] 制定技术实现方案
- [ ] 拆分页面为组件
- [ ] 确定组件层级结构
- [ ] 选择合适的CSS方案
- [ ] 评估实现难度和工作量

#### 输出格式
```typescript
interface PlanResult {
  framework: string;
  cssSolution: string;
  components: {
    name: string;
    type: 'page' | 'layout' | 'component' | 'primitive';
    description: string;
    children?: string[];
  }[];
  fileStructure: {
    path: string;
    type: 'file' | 'directory';
  }[];
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTime: string;
}
```

#### Planner Agent Prompt
```
你是一个技术架构师。请根据以下信息制定代码实现计划。

图片类型：{pageType}
用户需求：{userDescription}
UI分析结果：{analysisResult}

请制定计划：
1. 推荐使用哪个框架和CSS方案
2. 将页面拆分为哪些组件
3. 组件的层级结构
4. 建议的文件结构
5. 复杂度评估

请以JSON格式返回计划结果。
```

### 2.3 组件拆分模块

#### 功能需求
- [ ] 根据Planner计划拆分代码
- [ ] 生成多个组件文件
- [ ] 处理组件间 Props 传递
- [ ] 生成组件索引文件（index.ts）
- [ ] 处理共享样式和类型定义

#### 输出示例（React）
```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.css
│   ├── Input/
│   │   ├── Input.tsx
│   │   └── Input.css
│   └── Card/
│       ├── Card.tsx
│       └── Card.css
├── pages/
│   └── Login/
│       ├── Login.tsx
│       └── Login.css
├── styles/
│   └── variables.css
├── types/
│   └── index.ts
├── App.tsx
└── main.tsx
```

### 2.4 项目结构模块

#### 功能需求
- [ ] 生成完整的项目结构
- [ ] 支持创建配置文件
  - package.json
  - tsconfig.json
  - vite.config.ts / webpack.config.js
  - .eslintrc.json
  - .prettierrc
- [ ] 生成入口文件
- [ ] 生成路由配置（如需要）
- [ ] 生成状态管理（如需要）

#### package.json 示例
```json
{
  "name": "image2code-login-page",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

### 2.5 预览增强模块

#### 功能需求
- [ ] 支持多文件项目预览
- [ ] 模拟项目运行环境
- [ ] 支持npm依赖安装
- [ ] 热更新预览
- [ ] 移动端/平板/桌面完整适配测试

#### 预览技术方案
- **方案A**：使用 CodeSandbox API
- **方案B**：本地启动 Vite dev server
- **方案C**：使用 StackBlitz API

---

## 三、技术架构

### 3.1 完整Agent架构

```
                         ┌─────────────────┐
                         │   Coordinator   │
                         └────────┬────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
       ┌────────────┐     ┌────────────┐     ┌────────────┐
       │  Analyzer  │     │  Planner    │     │  Reviewer  │
       │   Agent    │────▶│   Agent     │────▶│   Agent    │
       └────────────┘     └──────┬───────┘     └────────────┘
                                 │
                                 ▼
                          ┌────────────┐
                          │   Coder    │
                          │   Agent    │
                          └──────┬───────┘
                                 │
                                 ▼
                          ┌────────────┐
                          │  Preview   │
                          │  Service   │
                          └────────────┘
```

### 3.2 新增文件

```
server/src/services/agents/
├── coordinator.ts         # 更新：支持框架选择
├── analyzer.ts           # 第一期已有
├── planner.ts            # 新增：规划Agent
├── coder.ts              # 更新：支持多框架
├── reviewer.ts           # 第二期已有
├── optimizer.ts          # 第二期已有
└── types.ts              # 更新：新增规划类型
```

### 3.3 API扩展

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/generate/start` | 更新：支持framework参数 |
| GET | `/api/project/structure/:taskId` | 获取项目结构 |
| GET | `/api/project/download/:taskId` | 下载项目ZIP |

---

## 四、Prompt工程增强

### 4.1 React + Tailwind 生成Prompt

```
你是一个React专家。请根据以下信息生成React组件代码。

分析结果：{analysisResult}
组件计划：{componentPlan}
用户需求：{userDescription}

要求：
1. 使用函数组件 + Hooks
2. 使用Tailwind CSS类名
3. 组件拆分合理，职责单一
4. Props类型定义清晰
5. 代码符合React最佳实践

请生成完整的组件代码。
```

### 4.2 Vue 3 生成Prompt

```
你是一个Vue 3专家。请根据以下信息生成Vue组件代码。

分析结果：{analysisResult}
组件计划：{componentPlan}
用户需求：{userDescription}

要求：
1. 使用Composition API (<script setup>)
2. 使用Vue 3语法糖
3. 样式使用scoped CSS或Tailwind
4. 组件拆分合理
5. 类型定义使用TypeScript

请生成完整的组件代码。
```

---

## 五、用户体验改进

### 5.1 对比表

| 功能 | 第一期 | 第二期 | 第三期 |
|------|--------|--------|--------|
| 框架支持 | 仅HTML | 仅HTML | React/Vue/HTML |
| 项目结构 | 单文件 | 单文件 | 多文件项目 |
| 组件拆分 | 无 | 无 | 自动拆分 |
| 技术规划 | 无 | 无 | Planner规划 |
| 配置文件 | 无 | 无 | 自动生成 |

### 5.2 工作流程

```
选择框架 → Planner规划 → Coder生成 → Review审核 → 预览 → 优化 → 导出项目
```

---

## 六、验收标准

### 6.1 功能验收

| 验收项 | 验收标准 |
|--------|----------|
| 框架选择 | 可选择React/Vue/HTML并正确生成 |
| Planner | 能制定合理的组件拆分计划 |
| 组件拆分 | 生成多个独立的组件文件 |
| 项目结构 | 生成完整的可运行项目 |
| 预览 | 多组件项目能正确预览 |

### 6.2 代码质量验收

| 验收项 | 验收标准 |
|--------|----------|
| React代码 | 符合React Hooks规范 |
| Vue代码 | 使用Composition API |
| Tailwind | 类名使用正确 |
| 类型安全 | TypeScript类型完整 |

---

## 七、关联文档

- [第一期需求文档](./phase-1-requirements.md) - 核心功能
- [第二期需求文档](./phase-2-requirements.md) - 代码编辑与审核
- [第四期需求文档](./phase-4-requirements.md) - 高级功能与优化
