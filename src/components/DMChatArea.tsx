import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle } from "lucide-react";

interface DMChatAreaProps {
  conversationName: string;
  messages: any[];
  loading: boolean;
  onSend: (content: string) => void;
  currentUserId: string;
  profiles: any[];
}

export default function DMChatArea({
  conversationName,
  messages,
  loading,
  onSend,
  currentUserId,
  profiles,
}: DMChatAreaProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  const getDisplayName = (msg: any) => {
    const profile = profiles.find((p) => p.user_id === msg.user_id);
    return profile?.display_name || msg.username;
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <div className="h-12 border-b border-border flex items-center px-4 shrink-0">
        <MessageCircle className="w-5 h-5 text-muted-foreground mr-2" />
        <span className="font-semibold text-foreground">{conversationName}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">Start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 py-1 px-2 hover:bg-accent/30 rounded-lg transition">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0 mt-0.5">
                {getDisplayName(msg).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm text-foreground">{getDisplayName(msg)}</span>
                  <span className="text-[11px] text-muted-foreground">{formatTime(msg.created_at)}</span>
                </div>
                <p className="text-sm text-foreground/90 break-words whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-border shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-accent/50 rounded-xl px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${conversationName}`}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 hover:brightness-110 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
