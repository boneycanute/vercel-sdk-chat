"use client";

import type { ChatRequestOptions, CreateMessage, Message } from "ai";
import { memo } from "react";
import equal from "fast-deep-equal";

interface BlockProps {
  chatId: string;
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  stop: () => void;
  messages: Array<Message>;
  setMessages: (messages: Message[]) => void;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions
  ) => void;
  isReadonly: boolean;
}

function PureBlock({
  input,
  setInput,
  handleSubmit,
  isLoading,
  stop,
  isReadonly,
}: BlockProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-0 bottom-0 top-14 flex flex-col rounded-t-xl bg-background shadow-lg">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-2xl">
            <div className="space-y-4 pb-20">
              <div className="rounded-lg border bg-background p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border p-2"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading || isReadonly}
                  />
                  {isLoading ? (
                    <button
                      type="button"
                      onClick={() => stop()}
                      className="rounded-md bg-red-500 px-4 py-2 text-white"
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isReadonly}
                      className="rounded-md bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
                    >
                      Send
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Block = memo(PureBlock, (prevProps, nextProps) => {
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.input !== nextProps.input) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  return true;
});
