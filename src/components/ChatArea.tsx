import { useState, useRef, useEffect } from "react";
import { Hash, Send, Smile, Trash2, Reply } from "lucide-react";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "😢"];

interface ChatAreaProps {
  channel: string;
  messages: any[];
  loading: boolean;
  onSend: (content: string) => void;
  onDelete: (id: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  currentUserId: string;
  profiles: any[];
}

export default function ChatArea({
  channel,
  messages,
  loading,
  onSend,
  onDelete,
  onReaction,
  currentUserId,
  profiles,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [emojiPickerMsg, setEmojiPickerMsg] = useState<string | null>(null);
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

  const getAvatarLetter = (msg: any) => {
    return getDisplayName(msg).charAt(0).toUpperCase();
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  };

  // Group messages by date
  const grouped: { date: string; msgs: any[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      grouped.push({ date, msgs: [msg] });
    }
  });

  const groupReactions = (reactions: any[] = []) => {
    const map: Record<string, { emoji: string; count: number; users: string[] }> = {};
    reactions.forEach((r) => {
      if (!map[r.emoji]) map[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
      map[r.emoji].count++;
      map[r.emoji].users.push(r.user_id);
    });
    return Object.values(map);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center px-4 shrink-0">
        <Hash className="w-5 h-5 text-muted-foreground mr-2" />
        <span className="font-semibold text-foreground">{channel}</span>
        <span className="ml-3 text-sm text-muted-foreground">Welcome to #{channel}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2" onClick={() => setEmojiPickerMsg(null)}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Hash className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">Welcome to #{channel}</p>
            <p className="text-sm">Be the first to send a message!</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.date}>
              <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="px-3 text-xs font-medium text-muted-foreground">{group.date}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              {group.msgs.map((msg) => {
                const reactions = groupReactions(msg.chat_message_reactions);
                return (
                  <div key={msg.id} className="group flex gap-3 py-1 px-2 hover:bg-accent/30 rounded-lg transition relative">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0 mt-0.5">
                      {getAvatarLetter(msg)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-sm text-foreground">{getDisplayName(msg)}</span>
                        <span className="text-[11px] text-muted-foreground">{formatTime(msg.created_at)}</span>
                      </div>
                      <p className="text-sm text-foreground/90 break-words whitespace-pre-wrap">{msg.content}</p>
                      {reactions.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {reactions.map((r) => (
                            <button
                              key={r.emoji}
                              onClick={() => onReaction(msg.id, r.emoji)}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs border transition ${
                                r.users.includes(currentUserId)
                                  ? "bg-primary/20 border-primary/40 text-primary"
                                  : "bg-accent/50 border-border text-foreground/70 hover:bg-accent"
                              }`}
                            >
                              {r.emoji} {r.count}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="absolute right-2 -top-3 hidden group-hover:flex items-center gap-0.5 bg-card border border-border rounded-md shadow-lg px-1 py-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEmojiPickerMsg(msg.id === emojiPickerMsg ? null : msg.id); }}
                        className="p-1 rounded hover:bg-accent transition"
                        title="React"
                      >
                        <Smile className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {msg.user_id === currentUserId && (
                        <button
                          onClick={() => onDelete(msg.id)}
                          className="p-1 rounded hover:bg-destructive/20 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive/70" />
                        </button>
                      )}
                    </div>
                    {emojiPickerMsg === msg.id && (
                      <div
                        className="absolute right-2 top-6 bg-card border border-border rounded-lg shadow-xl p-2 flex gap-1 z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => { onReaction(msg.id, emoji); setEmojiPickerMsg(null); }}
                            className="p-1.5 rounded hover:bg-accent transition text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-accent/50 rounded-xl px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message #${channel}`}
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
