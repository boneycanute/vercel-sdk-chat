import { Message as AIMessage } from "ai";

// Extend the Message type to include chatId
export interface Message extends AIMessage {
  chatId: string;
  createdAt: Date;
}

interface Chat {
  id: string;
  title: string;
  visibility: "public" | "private";
  createdAt: Date;
}

interface ChatStore {
  chats: Map<string, Chat>;
  messages: Map<string, Message[]>;
}

const store: ChatStore = {
  chats: new Map(),
  messages: new Map(),
};

export async function saveChat({ id, title }: { id: string; title: string }) {
  store.chats.set(id, {
    id,
    title,
    visibility: "public",
    createdAt: new Date(),
  });
}

export async function getChatById({ id }: { id: string }) {
  return store.chats.get(id);
}

export async function saveMessages({ messages }: { messages: Message[] }) {
  const chatId = messages[0].chatId;
  const existingMessages = store.messages.get(chatId) || [];
  store.messages.set(chatId, [...existingMessages, ...messages]);
}

export async function getMessagesByChatId({ id }: { id: string }) {
  return store.messages.get(id) || [];
}

export async function deleteChatById({ id }: { id: string }) {
  store.chats.delete(id);
  store.messages.delete(id);
}
