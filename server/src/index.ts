import express from "express";
import cors from "cors";
import { config } from "./config/environment.js";
import { LLMService } from "./services/llm.js";
import { ToolRegistry } from "./services/tools/index.js";
import type { ToolExecutor } from "./services/tools/index.js";
import { AgentService } from "./services/agent.js";
import { searchTool, searchExecutor } from "./services/tools/search.js";
import { datetimeTool, datetimeExecutor } from "./services/tools/datetime.js";
import { memorySearchTool, memorySearchExecutor, memorySaveTool, memorySaveExecutor } from "./services/tools/memory.js";
import { createChatRouter } from "./routes/chat.js";
import { createUploadRouter } from "./routes/upload.js";
import { createGenerateRouter } from "./routes/generate.js";
import { createPreviewRouter } from "./routes/preview.js";
import { EmbeddingService } from "./services/embedding/index.js";
import { MemoryService } from "./services/memory/index.js";

console.log("=".repeat(50));
console.log("🤖 Agent Tool Server Starting...");
console.log("=".repeat(50));

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

console.log("\n📦 Initializing Tool Registry...");
const toolRegistry = new ToolRegistry();
toolRegistry.register(searchTool, searchExecutor as ToolExecutor);
toolRegistry.register(datetimeTool, datetimeExecutor as ToolExecutor);

let memoryService: MemoryService | undefined;

console.log("\n📚 Initializing Embedding Service...");
console.log(`   - Model: ${config.embedding.model}`);
console.log(`   - Dimensions: ${config.embedding.dimensions}`);
const embeddingService = new EmbeddingService();
console.log("✅ Embedding Service ready");

console.log("\n💾 Initializing Memory Service...");
try {
  memoryService = new MemoryService(embeddingService);
  await memoryService.initialize();
  console.log("✅ Memory Service ready");
} catch (error) {
  console.error("❌ Failed to initialize Memory Service:", error);
  console.log("⚠️  Continuing without Memory Service");
  memoryService = undefined;
}

if (memoryService) {
  toolRegistry.register(memorySearchTool, async (args: Record<string, unknown>) =>
    memorySearchExecutor(args as { query: string; limit?: number }, memoryService),
  );
  toolRegistry.register(memorySaveTool, async (args: Record<string, unknown>) =>
    memorySaveExecutor(args as { content: string; tags?: string[] }, memoryService),
  );
  console.log("✅ Tools registered: search, calculate_datetime, memory_search, memory_save");
} else {
  console.log("✅ Tools registered: search, calculate_datetime (memory tools disabled)");
}

console.log("\n🔌 Initializing LLM Service...");
console.log(`   - Model: ${config.volcengine.model}`);
console.log(`   - Base URL: ${config.volcengine.baseUrl}`);
const llmService = new LLMService();
console.log("✅ LLM Service ready");

console.log("\n🧠 Initializing Agent Service...");
const agentService = new AgentService(llmService, toolRegistry, memoryService);
console.log("✅ Agent Service ready");

console.log("\n🌐 Setting up routes...");
app.use("/api/chat", createChatRouter(agentService));
console.log("✅ Routes configured: POST /api/chat");

app.use("/api/upload", createUploadRouter());
console.log("✅ Routes configured: POST /api/upload");

app.use("/api/generate", createGenerateRouter());
console.log("✅ Routes configured: POST /api/generate/start, GET /api/generate/status/:taskId");

app.use("/api/preview", createPreviewRouter());
console.log("✅ Routes configured: GET /api/preview/:taskId");

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
console.log("✅ Health check: GET /health");

app.listen(config.port, () => {
  console.log("=".repeat(50));
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📋 Available tools: search, calculate_datetime`);
  console.log(`📋 Memory service: ${memoryService?.isInitialized() ? "enabled" : "disabled"}`);
  console.log("=".repeat(50));
});
