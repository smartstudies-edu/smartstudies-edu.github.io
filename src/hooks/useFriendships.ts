import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFriendships(userId: string | undefined) {
  const [friends, setFriends] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);

  const fetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (!data) return;
    setFriends(data.filter((f) => f.status === "accepted"));
    setPending(data.filter((f) => f.status === "pending" && f.user_id === userId));
    setIncoming(data.filter((f) => f.status === "pending" && f.friend_id === userId));
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const sendRequest = async (friendId: string) => {
    await supabase.from("friendships").insert({ user_id: userId!, friend_id: friendId });
    fetch();
  };

  const acceptRequest = async (id: string) => {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    fetch();
  };

  const removeFriend = async (id: string) => {
    await supabase.from("friendships").delete().eq("id", id);
    fetch();
  };

  return { friends, pending, incoming, sendRequest, acceptRequest, removeFriend, refetch: fetch };
}
