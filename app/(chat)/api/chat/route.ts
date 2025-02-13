import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
  tool,
} from "ai";

import { myProvider } from "@/lib/ai/models";
import { getMostRecentUserMessage } from "@/lib/utils";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { vectorSearch } from "@/lib/ai/tools/vector-search";

export const maxDuration = 60;

// Mock user session for testing
const mockSession = {
  user: {
    id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
  },
};

export async function POST(request: Request) {
  const {
    messages,
    selectedChatModel,
    systemPrompt,
    vectorNamespace,
  }: {
    messages: Array<Message>;
    selectedChatModel: string;
    systemPrompt: string;
    vectorNamespace: string;
  } = await request.json();

  // Log the namespace we're receiving
  console.log("[1][route.ts] Received vectorNamespace from request:", {
    value: vectorNamespace,
    type: typeof vectorNamespace,
    timestamp: new Date().toISOString(),
  });

  const userMessage = getMostRecentUserMessage(messages);

  if (!userMessage) {
    return new Response("No user message found", { status: 400 });
  }

  console.log("Starting chat with model:", selectedChatModel);
  console.log("Last user message:", userMessage.content);
  console.log("Using system prompt:", systemPrompt);

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),
        system:
          systemPrompt +
          `\nIMPORTANT: When using the vector search tool, always use the namespace: "${vectorNamespace}"`,
        messages,
        maxSteps: 5,
        experimental_activeTools: ["getWeather", "vectorSearch"],
        experimental_transform: smoothStream({ chunking: "word" }),
        tools: {
          getWeather,
          vectorSearch: tool({
            parameters: vectorSearch.parameters,
            execute: (params, options) => {
              // Override the namespace parameter
              return vectorSearch.execute(
                {
                  ...params,
                  namespace: vectorNamespace,
                },
                options
              );
            },
          }),
        },
        onFinish: async ({ response, reasoning }) => {
          console.log(
            "[2][route.ts] Finished processing with vectorNamespace:",
            {
              value: vectorNamespace,
              type: typeof vectorNamespace,
              timestamp: new Date().toISOString(),
            }
          );
          try {
            // Extract text content from messages
            const processedMessages = response.messages.map((message) => ({
              ...message,
              content:
                typeof message.content === "string"
                  ? message.content
                  : message.content
                      .filter((part) => part.type === "text")
                      .map((part) => (part.type === "text" ? part.text : ""))
                      .join(""),
              reasoning,
            }));

            console.log("Chat response processed", {
              responseLength: processedMessages.length,
              hasReasoning: !!reasoning,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            console.error("Failed to process chat response", error);
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: "stream-text",
        },
      });

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
      });
    },
    onError: (error) => {
      console.error("Error in chat stream:", error);
      return "Oops, an error occurred!";
    },
  });
}
