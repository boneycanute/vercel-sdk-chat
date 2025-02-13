import { tool } from "ai";
import { z } from "zod";
import { Pinecone } from "@pinecone-database/pinecone";

type Metadata = {
  content: string;
  source?: string;
  fileType?: string;
  chunkIndex?: number;
  timestamp?: number;
  charCount?: number;
  tokenCount?: number;
  documentId?: string;
  [key: string]: unknown;
};

// Initialize Pinecone client
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Helper function to get embeddings using OpenAI with retry logic
async function getEmbeddingWithRetry(
  text: string,
  maxRetries = 3
): Promise<number[]> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const startTime = new Date().toISOString();
      console.log(
        `[Embedding] Attempt ${i + 1}/${maxRetries} started at ${startTime}`
      );

      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: text,
          model: "text-embedding-3-small", // Updated to match vector creation
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const result = await response.json();
      const embedding = result.data[0].embedding;

      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error("Invalid embedding format received");
      }

      console.log(
        `[Embedding] Successfully generated embedding at ${new Date().toISOString()}`
      );
      return embedding;
    } catch (error) {
      lastError = error as Error;
      console.error(`[Embedding] Attempt ${i + 1} failed:`, error);

      if (i < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw (
    lastError || new Error("Failed to generate embedding after all retries")
  );
}

// Main vector search tool
export const vectorSearch = tool({
  description:
    "Search for relevant information in the vector database when you need additional context or specific information that you don't have. Only use this when necessary.",
  parameters: z.object({
    query: z.string().describe("The search query to find relevant information"),
    namespace: z.string().describe("The namespace/collection to search in"),
    limit: z
      .number()
      .optional()
      .default(3)
      .describe("Maximum number of results to return"),
  }),
  execute: async ({ query, namespace, limit }) => {
    const requestId = Math.random().toString(36).substring(7);
    const startTimeMs = Date.now();

    console.log(`[3][vector-search.ts] Tool execution started:`, {
      requestId,
      namespace: {
        value: namespace,
        type: typeof namespace,
      },
      timestamp: new Date().toISOString(),
    });

    try {
      // Get index statistics before search
      const index = pc.index(process.env.PINECONE_INDEX_NAME!);
      const stats = await index.describeIndexStats();

      // Log detailed index stats
      console.log(`[${requestId}] Detailed index stats:`, {
        totalVectorCount: stats.totalRecordCount,
        dimension: stats.dimension,
        namespaces: stats.namespaces
          ? Object.entries(stats.namespaces).map(([ns, data]) => ({
              namespace: ns,
              vectorCount: data.recordCount,
            }))
          : [],
      });

      console.log(`[4][vector-search.ts] Before vector search:`, {
        requestId,
        namespace: {
          value: namespace,
          type: typeof namespace,
        },
        stats: {
          vectorCount: stats.totalRecordCount,
          dimensions: stats.dimension,
        },
        timestamp: new Date().toISOString(),
      });

      // Generate embedding
      console.log(`[${requestId}] Generating embeddings for query...`);
      const embedding = await getEmbeddingWithRetry(query);
      console.log(`[${requestId}] Embeddings generated successfully.`, {
        length: embedding.length,
        // Log first few values to check embedding pattern
        preview: embedding.slice(0, 5).map((v) => v.toFixed(6)),
        model: "text-embedding-3-small",
      });

      // Query with debug info
      console.log(`[${requestId}] Query parameters:`, {
        vectorLength: embedding.length,
        namespace,
        limit,
      });

      // Perform namespace-specific query using namespace chaining
      const queryResponse = await index.namespace(namespace).query({
        vector: embedding,
        topK: limit,
        includeMetadata: true,
        includeValues: true, // Include vector values to verify dimensions
      });

      console.log(`[${requestId}] Full Pinecone response:`, {
        matches: queryResponse.matches?.map((m) => ({
          id: m.id,
          score: m.score,
          metadata: m.metadata,
          vector: m.values ? `length: ${m.values.length}` : "no vector",
        })),
        namespace: queryResponse.namespace,
        matchCount: queryResponse.matches?.length || 0,
      });

      // Process matches into a more detailed format
      const processedResults =
        queryResponse.matches?.map((match) => {
          const metadata = match.metadata as Metadata;
          return {
            content: metadata.content || "",
            score: match.score,
            source: metadata.source || "Unknown",
            fileType: metadata.fileType || "Unknown",
            chunkIndex: metadata.chunkIndex || 0,
            timestamp: metadata.timestamp || Date.now(),
            charCount: metadata.charCount || metadata.content?.length || 0,
            documentId: metadata.documentId || match.id,
            preview: metadata.content?.substring(0, 200) + "...", // First 200 chars as preview
          };
        }) || [];

      // Log the search completion with stats
      console.log("\n=== Vector Search Completed ===");
      console.log("Search Results:", {
        requestId,
        resultCount: processedResults.length,
        namespace,
        duration: `${Date.now() - startTimeMs}ms`,
        topResults: processedResults.map((r) => ({
          score: r.score,
          source: r.source,
          fileType: r.fileType,
          preview: r.preview?.substring(0, 100) + "...",
        })),
      });

      // Return enhanced results
      return {
        results: processedResults.map((result) => ({
          content: result.content,
          metadata: {
            source: result.source,
            fileType: result.fileType,
            score: result.score,
            documentInfo: {
              id: result.documentId,
              chunkIndex: result.chunkIndex,
              charCount: result.charCount,
              createdAt: new Date(result.timestamp).toISOString(),
            },
          },
        })),
        summary: `Found ${processedResults.length} relevant matches from ${
          processedResults.reduce(
            (sources, r) => sources.add(r.source),
            new Set()
          ).size
        } different sources.`,
      };
    } catch (error) {
      const errorTime = new Date().toISOString();
      console.error("Vector search error:", {
        error,
        query,
        namespace,
        startTime: new Date(startTimeMs).toISOString(),
        errorTime,
        duration: new Date(errorTime).getTime() - startTimeMs,
      });
      throw error;
    }
  },
});
