"use client";
import { use, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Chat } from "@/components/chat";
import { setRegularPrompt } from "@/lib/ai/prompts";
import { generateUUID } from "@/lib/utils";
import { Message } from "ai";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AgentData {
  id: string;
  agent_name: string;
  system_prompt: string;
  primary_model: string;
  vector_db_config: {
    namespace: string;
    documentCount: number;
    documents: string[];
    status: string;
  };
  opening_message: string;
  user_message_color: string;
  agent_message_color: string;
  quick_messages: string[];
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPromptReady, setIsPromptReady] = useState(false);
  const chatModel = "chat-model-small";

  useEffect(() => {
    console.log("Agent ID : ", id);
    const fetchAgentData = async () => {
      try {
        const { data, error } = await supabase
          .from("agents")
          .select("*")
          .eq("agent_id", id)
          .single();

        if (error) throw error;

        if (data) {
          console.log("Data Fetched : ", data);
          // Add vector search instructions to the system prompt
          const vectorSearchPrompt = `
## TOOL USAGE GUIDELINES

1. Vector Search Tool:
- Use vector search when you need to find specific information from your knowledge base
- Search whenever a user's question might be answered by the documents in your database
- Use natural language queries that capture the essence of what you're looking for

2. Weather Tool:
- Only use when weather information is specifically requested
`;
          setAgentData(data);
          // Update the system prompt from agent data with vector search guidelines
          if (data.system_prompt) {
            setRegularPrompt(data.system_prompt + "\n" + vectorSearchPrompt);
            setIsPromptReady(true);
          }
        } else {
          setError("Agent not found");
        }
      } catch (err) {
        console.error("Error fetching agent data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch agent data"
        );
      }
    };

    if (id) {
      fetchAgentData();
    }
  }, [id]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!agentData || !isPromptReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const initialMessages = agentData.opening_message
    ? [
        {
          id: generateUUID(),
          role: "assistant" as const,
          content: agentData.opening_message,
        },
      ]
    : [];

  return (
    <div className="flex flex-col h-screen">
      {agentData && isPromptReady ? (
        <Chat
          id={id}
          initialMessages={initialMessages}
          selectedChatModel={chatModel}
          isReadonly={false}
          systemPrompt={agentData.system_prompt}
          vectorNamespace={agentData.vector_db_config.namespace}
        />
      ) : error ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-500">Error: {error}</div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );
}
