import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { useConversations } from "@/hooks/useConversations";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { useFriendships } from "@/hooks/useFriendships";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import AuthForm from "@/components/AuthForm";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import DMChatArea from "@/components/DMChatArea";
import OnlineUsersPanel from "@/components/OnlineUsersPanel";
import FriendsPanel from "@/components/FriendsPanel";

export default function Index() {
  const { session, loading, profile } = useAuth();
  const [channel, setChannel] = useState("general");
  const [view, setView] = useState<"channels" | "dms">("channels");
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [showFriends, setShowFriends] = useState(false);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  const userId = session?.user?.id;
  const username = profile?.username || session?.user?.user_metadata?.username || "User";

  const { messages, loading: msgsLoading, sendMessage, deleteMessage, toggleReaction } = useMessages(channel);
  const { conversations, refetch: refetchConvs } = useConversations(userId);
  const { messages: dmMessages, loading: dmLoading, sendMessage: sendDM } = useDirectMessages(activeConversation);
  const { friends, pending, incoming, sendRequest, acceptRequest, removeFriend } = useFriendships(userId);
  const { onlineUsers, isOnline } = useOnlineUsers();

  // Fetch all profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from("profiles").select("*");
      setAllProfiles(data || []);
    };
    fetchProfiles();
    const interval = setInterval(fetchProfiles, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!session) return <AuthForm />;

  const getConversationName = (convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return "Conversation";
    if (conv.name) return conv.name;
    const otherMember = conv.conversation_members?.find((m: any) => m.user_id !== userId);
    if (otherMember) {
      const p = allProfiles.find((pr) => pr.user_id === otherMember.user_id);
      return p?.display_name || p?.username || "Unknown";
    }
    return "Conversation";
  };

  const handleSendChannelMsg = (content: string) => {
    if (userId) sendMessage(content, userId, username);
  };

  const handleSendDM = (content: string) => {
    if (userId) sendDM(content, userId, username);
  };

  const handleNewDM = async () => {
    // For now, open friends panel to start conversations
    setShowFriends(true);
  };

  const onlineUserIds = onlineUsers.map((u) => u.user_id);

  const renderMainContent = () => {
    if (showFriends) {
      return (
        <FriendsPanel
          friends={friends}
          incoming={incoming}
          pending={pending}
          profiles={allProfiles}
          currentUserId={userId!}
          onAccept={acceptRequest}
          onRemove={removeFriend}
          onSendRequest={sendRequest}
          onClose={() => setShowFriends(false)}
        />
      );
    }

    if (view === "dms" && activeConversation) {
      return (
        <DMChatArea
          conversationName={getConversationName(activeConversation)}
          messages={dmMessages}
          loading={dmLoading}
          onSend={handleSendDM}
          currentUserId={userId!}
          profiles={allProfiles}
        />
      );
    }

    return (
      <ChatArea
        channel={channel}
        messages={messages}
        loading={msgsLoading}
        onSend={handleSendChannelMsg}
        onDelete={deleteMessage}
        onReaction={(msgId, emoji) => userId && toggleReaction(msgId, emoji, userId)}
        currentUserId={userId!}
        profiles={allProfiles}
      />
    );
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar
        currentChannel={channel}
        onSelectChannel={(ch) => { setChannel(ch); setView("channels"); setShowFriends(false); setActiveConversation(null); }}
        conversations={conversations}
        onSelectConversation={(id) => { setActiveConversation(id); setView("dms"); setShowFriends(false); }}
        activeConversation={activeConversation}
        view={view}
        onViewChange={(v) => { setView(v); setShowFriends(false); }}
        profiles={allProfiles}
        currentUserId={userId!}
        username={username}
        onOpenNewDM={handleNewDM}
        onOpenFriends={() => { setShowFriends(true); setActiveConversation(null); }}
      />
      {renderMainContent()}
      {view === "channels" && !showFriends && (
        <OnlineUsersPanel profiles={allProfiles} onlineUserIds={onlineUserIds} />
      )}
    </div>
  );
}
