import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from "ai";

import { myProvider } from "@/lib/ai/models";
import { getMostRecentUserMessage } from "@/lib/utils";
import { getWeather } from "@/lib/ai/tools/get-weather";

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
  }: { 
    messages: Array<Message>; 
    selectedChatModel: string;
    systemPrompt: string;
  } = await request.json();

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
        system: systemPrompt,
        messages,
        maxSteps: 5,
        experimental_activeTools: ["getWeather"],
        experimental_transform: smoothStream({ chunking: "word" }),
        tools: {
          getWeather,
        },
        onFinish: async ({ response, reasoning }) => {
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
