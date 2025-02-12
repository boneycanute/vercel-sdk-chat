"use client";

import type { ChatRequestOptions, Message } from "ai";
import cx from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useState } from "react";
import equal from "fast-deep-equal";

import { LoaderIcon, PencilEditIcon, SparklesIcon } from "./icons";
import { Markdown } from "./markdown";
import { MessageActions } from "./message-actions";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { MessageEditor } from "./message-editor";
import { cn } from "@/lib/utils";

const PurePreviewMessage = ({
  chatId,
  message,
  isLoading,
  setMessages,
  reload,
  isReadonly,
}: {
  chatId: string;
  message: Message;
  isLoading: boolean;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[])
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  isReadonly: boolean;
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");

  return (
    <AnimatePresence>
      <motion.div
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            "flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
            {
              "w-full": mode === "edit",
              "group-data-[role=user]/message:w-fit": mode !== "edit",
            }
          )}
        >
          {message.role === "assistant" && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 w-full">
            {mode === "view" && (
              <div className="flex flex-row gap-2 items-start">
                {message.role === "user" && !isReadonly && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 opacity-0 group-hover/message:opacity-100 transition-opacity"
                        onClick={() => setMode("edit")}
                      >
                        <PencilEditIcon size={12} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit message</TooltipContent>
                  </Tooltip>
                )}

                <div
                  className={cx(
                    "rounded-lg px-4 py-3 ring-1 ring-border bg-background min-h-[44px] break-words",
                    {
                      "ml-auto": message.role === "user",
                    }
                  )}
                >
                  <Markdown>{message.content}</Markdown>
                </div>

                {message.role === "assistant" && (
                  <MessageActions
                    message={message}
                    chatId={chatId}
                    isLoading={isLoading}
                  />
                )}
              </div>
            )}

            {mode === "edit" && (
              <MessageEditor
                message={message}
                setMessages={setMessages}
                setMode={setMode}
                reload={reload}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (!equal(prevProps.message, nextProps.message)) return false;
    return true;
  }
);

export const ThinkingMessage = () => {
  return (
    <motion.div
      className="w-full max-w-3xl mx-auto px-4"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex gap-4">
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
          <div className="translate-y-px">
            <SparklesIcon size={14} />
          </div>
        </div>
        <div className="rounded-lg px-4 py-3 ring-1 ring-border bg-background min-h-[44px] w-fit flex items-center gap-2">
          <LoaderIcon size={14} />
          Thinking...
        </div>
      </div>
    </motion.div>
  );
};
