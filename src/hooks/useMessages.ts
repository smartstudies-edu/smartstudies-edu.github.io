import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useMessages(channel: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("chat_messages")
      .select("*, chat_message_reactions(*)")
      .eq("channel", channel)
      .order("created_at", { ascending: true })
      .limit(100);
    setMessages(data || []);
    setLoading(false);
  }, [channel]);

  useEffect(() => {
    fetchMessages();

    const sub = supabase
      .channel(`chat-${channel}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "chat_messages",
        filter: `channel=eq.${channel}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setMessages((prev) => [...prev, { ...payload.new, chat_message_reactions: [] }]);
        } else if (payload.eventType === "DELETE") {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [channel, fetchMessages]);

  const sendMessage = async (content: string, userId: string, username: string) => {
    await supabase.from("chat_messages").insert({
      content,
      channel,
      user_id: userId,
      username,
    });
  };

  const deleteMessage = async (id: string) => {
    await supabase.from("chat_messages").delete().eq("id", id);
  };

  const toggleReaction = async (messageId: string, emoji: string, userId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    const existing = msg?.chat_message_reactions?.find(
      (r: any) => r.emoji === emoji && r.user_id === userId
    );
    if (existing) {
      await supabase.from("chat_message_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("chat_message_reactions").insert({
        message_id: messageId,
        emoji,
        user_id: userId,
      });
    }
    fetchMessages();
  };

  return { messages, loading, sendMessage, deleteMessage, toggleReaction };
}
