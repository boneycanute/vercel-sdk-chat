"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  node: any;
  inline: boolean;
  className?: string;
  children: any;
}

export function CodeBlock({
  node,
  inline,
  className,
  children,
  ...props
}: CodeBlockProps) {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";

  if (!inline) {
    return (
      <div className="not-prose relative">
        <SyntaxHighlighter
          {...props}
          style={oneDark}
          language={language}
          PreTag="div"
          className={cn(
            "text-sm w-full overflow-x-auto dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl",
            className
          )}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code
      {...props}
      className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-sm"
    >
      {children}
    </code>
  );
}
