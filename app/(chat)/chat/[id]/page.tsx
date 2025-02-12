"use client";
import { use, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Chat } from "@/components/chat";

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
  vector_db_config: any;
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
          setAgentData(data);
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

  if (!agentData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const initialMessages = agentData.opening_message
    ? [
        {
          role: "assistant",
          content: agentData.opening_message,
        },
      ]
    : [];

  return (
    <div className="flex flex-col h-screen">
      <Chat
        id={id}
        initialMessages={[]}
        selectedChatModel={chatModel}
        isReadonly={false}
      />
    </div>
  );
}
