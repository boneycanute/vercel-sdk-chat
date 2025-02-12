"use client";

import { useChat } from "ai/react";

export type DataStreamDelta = {
  type: "text-delta" | "title" | "id" | "clear" | "finish";
  content: string;
};

export function DataStreamHandler({ id }: { id: string }) {
  const { data: dataStream } = useChat({ id });
  return null; // Simplified version without blocks
}
