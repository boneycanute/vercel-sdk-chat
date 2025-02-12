"use client";

import { Chat } from "@/components/chat";
import { use } from "react";

// This uses gpt-4-mini under the hood
const chatModel = "chat-model-small";

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  console.log("ChatPage", id);

  return (
    <Chat
      id={id}
      initialMessages={[]}
      selectedChatModel={chatModel}
      isReadonly={false}
    />
  );
}
