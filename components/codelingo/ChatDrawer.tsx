"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
// Removed Sheet primitives; using custom animated drawer container instead
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatDrawerProps {
  topic: string;
  languageId: string;
}

export default function ChatDrawer({ topic, languageId }: ChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [eli5, setEli5] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const escapeHtml = (unsafe: string) => unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const formatAssistantMarkdown = (raw: string) => {
    let text = escapeHtml(raw);
    text = text.replace(/```[\s\S]*?```/g, (block) => {
      const inner = block.slice(3, -3);
      return `<pre class="overflow-x-auto rounded-md bg-muted p-3"><code>${inner}</code></pre>`;
    });
    text = text.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-muted">$1</code>');
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/^##\s+(.+)$/gm, '<strong class="text-base">$1</strong>');
    text = text.replace(/^#\s+(.+)$/gm, '<strong class="text-base">$1</strong>');
    text = text.replace(/\n/g, '<br/>');
    return text;
  };

  const sendChat = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || isSending) return;
    const pending = { role: "user" as const, content: trimmed };
    setChatMessages(prev => [...prev, pending]);
    setChatInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, pending],
          languageId,
          eli5,
          topic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to get response");
      if (data?.message) {
        setChatMessages(prev => [...prev, data.message]);
      }
    } catch (e: any) {
      const message = e?.message ? `Error: ${e.message}` : "Sorry, something went wrong.";
      setChatMessages(prev => [...prev, { role: "assistant", content: message }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button with Motion */}
      <motion.button
        aria-label="Open chat"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 rounded-full bg-emerald-600 text-white shadow-lg p-4 md:p-4 active:scale-95"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Bot className="h-6 w-6" />
      </motion.button>

      {/* Chat Drawer with Smooth Slide Animation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ y: "80%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className="fixed bottom-0 left-0 right-0 h-[85vh] bg-background border-t z-50 rounded-t-2xl shadow-xl overflow-hidden"
            >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="text-base font-semibold">Ask AI Tutor</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </div>

              <div className="flex items-center justify-between px-4 py-2 border-b gap-3">
                <div className="text-sm">Explain like I'm 5</div>
                <Switch checked={eli5} onCheckedChange={setEli5} />
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                {chatMessages.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Stuck? Ask a question about "{topic}".
                  </div>
                ) : (
                  chatMessages.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "max-w-[85%] rounded-lg px-3 py-2 text-sm prose prose-invert prose-p:my-0 prose-pre:my-2",
                        m.role === "user" ? "ml-auto bg-emerald-600 text-white prose-invert" : "bg-muted"
                      )}
                    >
                      {m.role === "assistant" ? (
                        <div dangerouslySetInnerHTML={{ __html: formatAssistantMarkdown(m.content) }} />
                      ) : (
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      )}
                    </div>
                  ))
                )}
                {isSending && (
                  <div className="max-w-[75%] rounded-lg px-3 py-2 text-sm bg-muted animate-pulse">Thinking…</div>
                )}
              </div>

              <div className="flex-shrink-0 p-3 border-t flex items-center gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a doubt…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendChat();
                    }
                  }}
                />
                <Button disabled={isSending || chatInput.trim().length === 0} onClick={sendChat} className="bg-emerald-600 hover:bg-emerald-700">
                  Send
                </Button>
              </div>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
