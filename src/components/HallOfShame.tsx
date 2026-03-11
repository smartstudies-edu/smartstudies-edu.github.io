import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skull, Clock } from "lucide-react";

interface ShamedUser {
  username: string;
  ban_reason: string | null;
  is_banned: boolean;
  timeout_until: string | null;
}

const HallOfShame = () => {
  const [shamed, setShamed] = useState<ShamedUser[]>([]);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, ban_reason, is_banned, timeout_until")
        .or("is_banned.eq.true,timeout_until.not.is.null");
      
      if (data) {
        setShamed(data.filter(u => u.is_banned || (u.timeout_until && new Date(u.timeout_until) > new Date())));
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <Skull className="w-12 h-12 mx-auto text-destructive mb-3" />
        <h2 className="text-2xl font-display font-bold text-foreground">Hall of Shame</h2>
        <p className="text-sm text-muted-foreground mt-1">Users who broke the rules. Don't end up here.</p>
      </div>

      {shamed.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-1">🎉 All clear!</p>
          <p className="text-sm">Nobody's in trouble... yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shamed.map((user) => (
            <div
              key={user.username}
              className="flex items-center gap-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5"
            >
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                {user.is_banned ? (
                  <Skull className="w-5 h-5 text-destructive" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{user.username}</p>
                <p className="text-xs text-muted-foreground">
                  {user.is_banned
                    ? `Banned${user.ban_reason ? `: ${user.ban_reason}` : ""}`
                    : `Timed out until ${new Date(user.timeout_until!).toLocaleString()}`}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                user.is_banned ? "bg-destructive/20 text-destructive" : "bg-yellow-500/20 text-yellow-500"
              }`}>
                {user.is_banned ? "BANNED" : "TIMEOUT"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HallOfShame;
