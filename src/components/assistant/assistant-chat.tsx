"use client";

import { useChat } from "ai/react";
import { Message } from "ai";
import { useEffect, useRef } from "react";
import { Bot, Send, Sparkles, User, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AssistantChat({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/agent/chat",
    body: { workspaceId, workspaceName },
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const suggestions = [
    { label: "List leads", text: "Show me all leads in our active workspace" },
    {
      label: "Bulk Import",
      text: "Import these leads at once:\n1. Aarav Verma (+91 9999912345)\n2. Priya Gupta (+91 9999967890)",
    },
    { label: "Assign a Task", text: "Create a high priority task to call Aarav tomorrow" },
  ];

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-4 bg-muted/30">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">CRM AI Agent</h2>
          <p className="text-xs text-muted-foreground">
            Ask questions, create tasks, or bulk import data directly via natural language.
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-6 pt-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <h5 className="font-semibold text-xs leading-none mb-1">API Error</h5>
              <p className="text-xs leading-relaxed text-destructive/90">
                {error.message || "Failed to communicate with the AI model. Check your API configuration."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages Panel */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-md font-semibold text-foreground">What can I do for you today?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              I can access your database. Ask me to pull metrics, assign tasks, or upload a dataset directly in this chat.
            </p>

            <div className="mt-6 w-full grid gap-3 grid-cols-1 sm:grid-cols-3">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleInputChange({
                      target: { value: s.text },
                    } as React.ChangeEvent<HTMLInputElement>);
                  }}
                  className="rounded-lg border border-border bg-background p-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <p className="text-xs font-semibold text-foreground mb-1">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {s.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m: Message) => (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[85%] ${
                  m.role === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border ${
                    m.role === "user"
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-muted border-border text-foreground"
                  }`}
                >
                  {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 border border-border text-foreground"
                  }`}
                >
                  {/* Clean text formatting */}
                  <div className="whitespace-pre-wrap font-sans">{m.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-muted border-border text-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Agent is processing...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4 bg-muted/10">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message or ask to perform actions..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="gap-1.5 shrink-0">
            <Send className="h-4 w-4" /> Send
          </Button>
        </div>
      </form>
    </div>
  );
}
