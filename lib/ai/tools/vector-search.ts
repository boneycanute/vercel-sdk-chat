import { tool } from "ai";
import { z } from "zod";
import { Pinecone } from "@pinecone-database/pinecone";

type Metadata = {
  content: string;
  [key: string]: unknown;
};

// Initialize Pinecone client
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

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
    const startTime = new Date().toISOString();

    // ONLY use the namespace from the global context
    const effectiveNamespace = (globalThis as any).__VECTOR_NAMESPACE__;
    if (!effectiveNamespace) {
      throw new Error("No namespace provided in global context");
    }

    // Log when tool is invoked
    console.log("\n=== Vector Search Tool Invoked ===");
    console.log("Request Details:", {
      requestId,
      query,
      namespace: effectiveNamespace, // Only log the effective namespace
      limit,
      startTime,
    });

    try {
      // Log before getting embeddings
      console.log(`[${requestId}] Generating embeddings for query...`);
      const embedding = await getEmbedding(query);
      console.log(
        `[${requestId}] Embeddings generated successfully. Length: ${embedding.length}`
      );

      // Log before vector search
      console.log(`[${requestId}] Vector Search Details:`, {
        query,
        namespace: effectiveNamespace,
        indexName: process.env.PINECONE_INDEX_NAME,
        embeddingLength: embedding.length,
        timestamp: new Date().toISOString(),
      });

      // Get the Pinecone index
      const index = pc.index(process.env.PINECONE_INDEX_NAME!);

      // Log query params
      console.log(`[${requestId}] Query params:`, {
        indexName: process.env.PINECONE_INDEX_NAME,
        filter: { namespace: effectiveNamespace },
        topK: limit,
        vectorDimensions: embedding.length,
      });

      // Perform the vector search
      const queryResponse = await index.query({
        vector: embedding,
        filter: { namespace: effectiveNamespace },
        topK: limit,
        includeMetadata: true,
      });

      // Log the full response for debugging
      console.log(
        `[${requestId}] Full Pinecone response:`,
        JSON.stringify(
          {
            matches: queryResponse.matches,
            namespace: effectiveNamespace,
            matchCount: queryResponse.matches?.length || 0,
          },
          null,
          2
        )
      );

      console.log(`[${requestId}] Raw Pinecone response:`, {
        matchCount: queryResponse.matches?.length,
        matches: queryResponse.matches?.map((m) => ({
          score: m.score,
          metadata: m.metadata,
        })),
      });

      const endTime = new Date().toISOString();
      const duration =
        new Date(endTime).getTime() - new Date(startTime).getTime();

      // Enhanced completion logging
      console.log("\n=== Vector Search Completed ===");
      console.log("Search Results:", {
        requestId,
        resultCount: queryResponse.matches?.length || 0,
        namespace: effectiveNamespace, // Use the namespace we sent in the query
        duration: `${duration}ms`,
        topResults: (queryResponse.matches || []).slice(0, 2).map((match) => ({
          similarity: Math.round((match.score || 0) * 100) / 100,
          contentPreview:
            typeof match.metadata?.content === "string"
              ? match.metadata.content.substring(0, 100) + "..."
              : "No content available",
        })),
      });

      return {
        results: (queryResponse.matches || []).map((match) => ({
          content: match.metadata?.content,
          similarity: match.score || 0,
          metadata: match.metadata,
        })),
      };
    } catch (error) {
      const errorTime = new Date().toISOString();
      console.error("Vector search error:", {
        error,
        query,
        namespace: effectiveNamespace,
        startTime,
        errorTime,
        duration: new Date(errorTime).getTime() - new Date(startTime).getTime(),
      });
      throw error;
    }
  },
});

// Helper function to get embeddings using OpenAI
async function getEmbedding(text: string) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-ada-002",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get embedding: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data[0].embedding;
}
