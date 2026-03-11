import { useState } from "react";
import { UserPlus, Check, X, UserMinus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FriendsPanelProps {
  friends: any[];
  incoming: any[];
  pending: any[];
  profiles: any[];
  currentUserId: string;
  onAccept: (id: string) => void;
  onRemove: (id: string) => void;
  onSendRequest: (userId: string) => void;
  onClose: () => void;
}

export default function FriendsPanel({
  friends,
  incoming,
  pending,
  profiles,
  currentUserId,
  onAccept,
  onRemove,
  onSendRequest,
  onClose,
}: FriendsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [tab, setTab] = useState<"all" | "pending" | "add">("all");

  const getProfile = (userId: string) => profiles.find((p) => p.user_id === userId);

  const getFriendId = (f: any) => (f.user_id === currentUserId ? f.friend_id : f.user_id);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${searchQuery}%`)
      .neq("user_id", currentUserId)
      .limit(10);
    setSearchResults(data || []);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <div className="h-12 border-b border-border flex items-center px-4 shrink-0">
        <span className="font-semibold text-foreground">Friends</span>
        <div className="flex gap-2 ml-4">
          {(["all", "pending", "add"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                tab === t ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {t === "all" ? "All" : t === "pending" ? `Pending${incoming.length ? ` (${incoming.length})` : ""}` : "Add Friend"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "all" && (
          <div className="space-y-1">
            {friends.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No friends yet. Add some!</p>
            ) : (
              friends.map((f) => {
                const profile = getProfile(getFriendId(f));
                return (
                  <div key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/30 transition">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {(profile?.display_name || profile?.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm text-foreground">{profile?.display_name || profile?.username}</span>
                    <button onClick={() => onRemove(f.id)} className="p-1.5 rounded-md hover:bg-destructive/20 transition" title="Remove friend">
                      <UserMinus className="w-4 h-4 text-destructive/70" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "pending" && (
          <div className="space-y-3">
            {incoming.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Incoming</p>
                {incoming.map((f) => {
                  const profile = getProfile(f.user_id);
                  return (
                    <div key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/30 transition">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {(profile?.username || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 text-sm text-foreground">{profile?.username}</span>
                      <button onClick={() => onAccept(f.id)} className="p-1.5 rounded-md hover:bg-green-500/20 transition">
                        <Check className="w-4 h-4 text-green-400" />
                      </button>
                      <button onClick={() => onRemove(f.id)} className="p-1.5 rounded-md hover:bg-destructive/20 transition">
                        <X className="w-4 h-4 text-destructive/70" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {pending.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Sent</p>
                {pending.map((f) => {
                  const profile = getProfile(f.friend_id);
                  return (
                    <div key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/30 transition">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {(profile?.username || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 text-sm text-foreground">{profile?.username || "Unknown"}</span>
                      <button onClick={() => onRemove(f.id)} className="p-1.5 rounded-md hover:bg-destructive/20 transition" title="Cancel">
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {incoming.length === 0 && pending.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-8">No pending requests</p>
            )}
          </div>
        )}

        {tab === "add" && (
          <div>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 flex items-center gap-2 bg-accent/50 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search by username"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition"
              >
                Search
              </button>
            </div>
            <div className="space-y-1">
              {searchResults.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/30 transition">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm text-foreground">{p.display_name || p.username}</span>
                  <button
                    onClick={() => onSendRequest(p.user_id)}
                    className="p-1.5 rounded-md hover:bg-primary/20 transition"
                    title="Send friend request"
                  >
                    <UserPlus className="w-4 h-4 text-primary" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
