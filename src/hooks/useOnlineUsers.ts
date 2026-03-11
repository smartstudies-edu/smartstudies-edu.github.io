import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("user_presence")
        .select("user_id, status, last_seen")
        .gte("last_seen", fiveMinAgo);
      setOnlineUsers(data || []);
    };
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = (userId: string) => onlineUsers.some((u) => u.user_id === userId);

  return { onlineUsers, isOnline };
}
