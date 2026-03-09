import express from 'express';
import cors from 'cors';
import { config } from './config/environment.js';
import { LLMService } from './services/llm.js';
import { ToolRegistry } from './services/tools/index.js';
import type { ToolExecutor } from './services/tools/index.js';
import { AgentService } from './services/agent.js';
import { searchTool, searchExecutor } from './services/tools/search.js';
import { datetimeTool, datetimeExecutor } from './services/tools/datetime.js';
import { createChatRouter } from './routes/chat.js';

console.log('='.repeat(50));
console.log('🤖 Agent Tool Server Starting...');
console.log('='.repeat(50));

const app = express();

app.use(cors());
app.use(express.json());

console.log('\n📦 Initializing Tool Registry...');
const toolRegistry = new ToolRegistry();
toolRegistry.register(searchTool, searchExecutor as ToolExecutor);
toolRegistry.register(datetimeTool, datetimeExecutor as ToolExecutor);
console.log('✅ Tools registered: search, calculate_datetime');

console.log('\n🔌 Initializing LLM Service...');
console.log(`   - Model: ${config.volcengine.model}`);
console.log(`   - Base URL: ${config.volcengine.baseUrl}`);
const llmService = new LLMService();
console.log('✅ LLM Service ready');

console.log('\n🧠 Initializing Agent Service...');
const agentService = new AgentService(llmService, toolRegistry);
console.log('✅ Agent Service ready');

console.log('\n🌐 Setting up routes...');
app.use('/api/chat', createChatRouter(agentService));
console.log('✅ Routes configured: POST /api/chat');

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
console.log('✅ Health check: GET /health');

app.listen(config.port, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📋 Available tools: search, calculate_datetime`);
  console.log('='.repeat(50));
});
