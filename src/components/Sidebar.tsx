import { Hash, MessageCircle, Users, ChevronDown, Plus, LogOut, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CHANNELS = ["general", "gaming", "music", "art", "coding", "memes"];

interface SidebarProps {
  currentChannel: string;
  onSelectChannel: (ch: string) => void;
  conversations: any[];
  onSelectConversation: (id: string) => void;
  activeConversation: string | null;
  view: "channels" | "dms";
  onViewChange: (v: "channels" | "dms") => void;
  profiles: any[];
  currentUserId: string;
  username: string;
  onOpenNewDM: () => void;
  onOpenFriends: () => void;
}

export default function Sidebar({
  currentChannel,
  onSelectChannel,
  conversations,
  onSelectConversation,
  activeConversation,
  view,
  onViewChange,
  profiles,
  currentUserId,
  username,
  onOpenNewDM,
  onOpenFriends,
}: SidebarProps) {
  const getConversationName = (conv: any) => {
    if (conv.name) return conv.name;
    if (conv.is_group) return "Group Chat";
    const otherMember = conv.conversation_members?.find(
      (m: any) => m.user_id !== currentUserId
    );
    if (otherMember) {
      const profile = profiles.find((p) => p.user_id === otherMember.user_id);
      return profile?.display_name || profile?.username || "Unknown";
    }
    return "Conversation";
  };

  return (
    <div className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-bold text-sidebar-foreground tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-sidebar-primary" />
          </div>
          Cloud Chat
        </h2>
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-sidebar-border">
        <button
          onClick={() => onViewChange("channels")}
          className={`flex-1 py-2.5 text-xs font-medium transition ${
            view === "channels"
              ? "text-sidebar-primary border-b-2 border-sidebar-primary"
              : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
          }`}
        >
          Channels
        </button>
        <button
          onClick={() => onViewChange("dms")}
          className={`flex-1 py-2.5 text-xs font-medium transition ${
            view === "dms"
              ? "text-sidebar-primary border-b-2 border-sidebar-primary"
              : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
          }`}
        >
          Messages
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {view === "channels" ? (
          <div className="px-2 space-y-0.5">
            <div className="px-2 py-1.5 text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider flex items-center gap-1">
              <ChevronDown className="w-3 h-3" />
              Text Channels
            </div>
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                onClick={() => onSelectChannel(ch)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition ${
                  currentChannel === ch && view === "channels"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Hash className="w-4 h-4 shrink-0 opacity-60" />
                {ch}
              </button>
            ))}
          </div>
        ) : (
          <div className="px-2 space-y-0.5">
            <button
              onClick={onOpenFriends}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition"
            >
              <Users className="w-4 h-4 shrink-0 opacity-60" />
              Friends
            </button>
            <div className="px-2 py-1.5 text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider flex items-center justify-between">
              <span>Direct Messages</span>
              <button onClick={onOpenNewDM} className="hover:text-sidebar-foreground transition">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition ${
                  activeConversation === conv.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-sidebar-accent flex items-center justify-center text-[10px] font-medium shrink-0">
                  {conv.is_group ? (
                    <Users className="w-3.5 h-3.5" />
                  ) : (
                    getConversationName(conv).charAt(0).toUpperCase()
                  )}
                </div>
                <span className="truncate">{getConversationName(conv)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Panel */}
      <div className="p-3 border-t border-sidebar-border bg-sidebar-background/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {username?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-sidebar-foreground truncate">{username}</div>
            <div className="text-[10px] text-green-400">Online</div>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="p-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
