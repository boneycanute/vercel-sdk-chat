import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from "ai";

import { myProvider } from "@/lib/ai/models";
import { systemPrompt } from "@/lib/ai/prompts";
import {
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from "@/lib/utils";

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
  }: { messages: Array<Message>; selectedChatModel: string } =
    await request.json();

  const userMessage = getMostRecentUserMessage(messages);

  if (!userMessage) {
    return new Response("No user message found", { status: 400 });
  }

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),
        system: systemPrompt({ selectedChatModel }),
        messages,
        maxSteps: 5,
        experimental_activeTools: [],
        experimental_transform: smoothStream({ chunking: "word" }),
        tools: {},
        onFinish: async ({ response, reasoning }) => {
          try {
            const sanitizedResponseMessages = sanitizeResponseMessages({
              messages: response.messages,
              reasoning,
            });
            console.log("Chat response processed", sanitizedResponseMessages);
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
    onError: () => {
      return "Oops, an error occurred!";
    },
  });
}
