import type { Collection, Metadata, Where } from "chromadb";
import type { RetrievalOptions } from "./types.js";

interface SearchResult {
  id: string;
  metadata: Record<string, unknown>;
  distance: number;
}

export class VectorStore {
  private collection: Collection | null = null;
  private collectionName: string;

  constructor(
    private host: string,
    private port: number,
    collectionName: string
  ) {
    this.collectionName = collectionName;
  }

  async initialize(_dimensions: number): Promise<void> {
    try {
      console.log(`   [VectorStore] Initializing collection: ${this.collectionName}`);
      console.log(`   [VectorStore] Connecting to ChromaDB at ${this.host}:${this.port}`);

      const { ChromaClient } = await import("chromadb");
      const client = new ChromaClient({
        host: this.host,
        port: this.port,
      });

      this.collection = await client.getOrCreateCollection({
        name: this.collectionName,
        metadata: { "hnsw:space": "cosine" },
      });

      console.log(`   [VectorStore] ✅ Collection initialized`);
    } catch (error) {
      console.error("   [VectorStore] ❌ Failed to initialize:", error);
      throw error;
    }
  }

  async add(id: string, embedding: number[], metadata: Metadata): Promise<void> {
    if (!this.collection) {
      throw new Error("VectorStore not initialized");
    }

    await this.collection.add({
      ids: [id],
      embeddings: [embedding],
      metadatas: [metadata],
      documents: [(metadata["content"] as string) || ""],
    });
  }

  async addBatch(ids: string[], embeddings: number[][], metadatas: Metadata[]): Promise<void> {
    if (!this.collection) {
      throw new Error("VectorStore not initialized");
    }

    const documents = metadatas.map((m) => (m["content"] as string) || "");

    await this.collection.add({
      ids,
      embeddings,
      metadatas,
      documents,
    });
  }

  async search(queryEmbedding: number[], options: RetrievalOptions): Promise<SearchResult[]> {
    if (!this.collection) {
      throw new Error("VectorStore not initialized");
    }

    const where: Where = {};

    if (options.userId) {
      where["userId"] = options.userId;
    }

    if (options.sessionId) {
      where["sessionId"] = options.sessionId;
    }

    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: options.topK || 3,
      where: Object.keys(where).length > 0 ? where : undefined,
    });

    if (!results.ids || results.ids.length === 0 || !results.ids[0]) {
      return [];
    }

    return results.ids[0].map((id: string, index: number) => ({
      id,
      metadata: results.metadatas?.[0]?.[index] || {},
      distance: results.distances?.[0]?.[index] ?? 1,
    }));
  }

  async delete(id: string): Promise<void> {
    if (!this.collection) {
      throw new Error("VectorStore not initialized");
    }

    await this.collection.delete({ ids: [id] });
  }

  async deleteBySession(sessionId: string): Promise<void> {
    if (!this.collection) {
      throw new Error("VectorStore not initialized");
    }

    await this.collection.delete({
      where: { sessionId },
    });
  }

  async deleteAll(): Promise<void> {
    if (!this.collection) {
      throw new Error("VectorStore not initialized");
    }

    await this.collection.delete({ where: {} });
  }

  async count(): Promise<number> {
    if (!this.collection) {
      throw new Error("VectorStore not initialized");
    }

    return await this.collection.count();
  }

  async getCollection(): Promise<Collection> {
    if (!this.collection) {
      throw new Error("VectorStore not initialized");
    }
    return this.collection;
  }
}
