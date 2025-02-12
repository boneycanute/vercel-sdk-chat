"use client";

import { Attachment, Message } from "ai";
import { useChat } from "ai/react";
import { generateUUID } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

import { ChatHeader } from "@/components/chat-header";
import { MultimodalInput } from "./multimodal-input";
import { Messages } from "./messages";
import { SetStateAction } from "react";

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  isReadonly,
  systemPrompt,
  vectorNamespace,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedChatModel: string;
  isReadonly: boolean;
  systemPrompt: string;
  vectorNamespace: string;
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id,
    body: { 
      id, 
      selectedChatModel: selectedChatModel,
      systemPrompt: systemPrompt,
      vectorNamespace,
    },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onError: (error) => {
      toast.error("An error occurred, please try again!");
    },
  });

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <ChatHeader
        chatId={id}
        selectedModelId={selectedChatModel}
        isReadonly={isReadonly}
      />

      <Messages
        chatId={id}
        isLoading={isLoading}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        isReadonly={isReadonly}
        votes={undefined}
        isBlockVisible={false}
      />

      <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
        {!isReadonly && (
          <MultimodalInput
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            messages={messages}
            setMessages={setMessages}
            append={append}
          />
        )}
      </form>
    </div>
  );
}
