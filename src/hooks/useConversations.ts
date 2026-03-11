import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data: memberships } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);

    if (!memberships?.length) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const ids = memberships.map((m) => m.conversation_id);
    const { data } = await supabase
      .from("conversations")
      .select("*, conversation_members(user_id)")
      .in("id", ids)
      .order("created_at", { ascending: false });

    setConversations(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, refetch: fetchConversations };
}
