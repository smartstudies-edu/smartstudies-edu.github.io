import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Send,
  Hash,
  Megaphone,
  Newspaper,
  Trophy,
  MessageCircle,
  Trash2,
  CornerUpLeft,
  Pin,
  Users,
  Plus,
  UserPlus,
  UserMinus,
  Search,
  ArrowLeft,
  X,
  Check,
  Bell,
  ScrollText,
  Settings,
  Pencil,
  Volume2,
  BarChart3,
  LogOut,
  Circle,
} from "lucide-react";

interface Message {
  id: string;
  channel: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_by: string | null;
}

interface DirectMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
}

interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
}

interface ChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface ChatMention {
  id: string;
  message_id: string;
  channel: string;
  recipient_user_id: string;
  sender_user_id: string;
  excerpt: string | null;
  is_read: boolean;
  created_at: string;
}

interface UserPresence {
  user_id: string;
  status: "online" | "away" | "dnd" | "offline";
  last_seen: string;
}

interface Poll {
  id: string;
  user_id: string;
  username: string;
  question: string;
  options: string[];
  votes: Record<string, string[]>;
  ends_at: string | null;
  created_at: string;
}

const CHAT_REACTIONS_TABLE = "chat_message_reactions" as any;
const CHAT_MENTIONS_TABLE = "chat_mentions" as any;
const USER_PRESENCE_TABLE = "user_presence" as any;
const POLLS_TABLE = "polls" as any;
const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎮", "😮"];

// Soundboard sounds from HubblePlay
const SOUNDBOARD_SOUNDS = [
  { name: "Bruh", url: "https://www.myinstants.com/media/sounds/bruh.mp3", freq: 120 },
  { name: "Vine Boom", url: "https://www.myinstants.com/media/sounds/vine-boom.mp3", freq: 80 },
  { name: "Oof", url: "https://www.myinstants.com/media/sounds/roblox-death-sound_1.mp3", freq: 200 },
  { name: "Wow", url: "https://www.myinstants.com/media/sounds/anime-wow-sound-effect.mp3", freq: 440 },
  { name: "Airhorn", url: "https://www.myinstants.com/media/sounds/air-horn-club-sample.mp3", freq: 600 },
  { name: "Sad Violin", url: "https://www.myinstants.com/media/sounds/sad-violin_1.mp3", freq: 330 },
  { name: "FBI Open Up", url: "https://www.myinstants.com/media/sounds/fbi-open-up.mp3", freq: 500 },
  { name: "Windows XP", url: "https://www.myinstants.com/media/sounds/windowsxpstartup.mp3", freq: 880 },
  { name: "MLG Horn", url: "https://www.myinstants.com/media/sounds/mlg-airhorn.mp3", freq: 700 },
  { name: "Taco Bell", url: "https://www.myinstants.com/media/sounds/taco-bell-bong-sfx.mp3", freq: 350 },
  { name: "Bonk", url: "https://www.myinstants.com/media/sounds/bonk.mp3", freq: 150 },
  { name: "Emotional Damage", url: "https://www.myinstants.com/media/sounds/emotional-damage-meme.mp3", freq: 260 },
];

const CHANNELS = [
  { id: "general", label: "General", icon: MessageCircle },
  { id: "rules", label: "Rules", icon: ScrollText },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "updates", label: "Updates", icon: Newspaper },
  { id: "hall-of-fame", label: "Hall of Fame", icon: Trophy },
  { id: "soundboard", label: "Soundboard", icon: Volume2 },
  { id: "polls", label: "Polls", icon: BarChart3 },
];

type ChatView = "channels" | "friends" | "dms";

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-500",
  away: "bg-yellow-500",
  dnd: "bg-red-500",
  offline: "bg-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  online: "Online",
  away: "Away",
  dnd: "Do Not Disturb",
  offline: "Offline",
};

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildMentionRegex = (username: string) => {
  const u = username.trim();
  return new RegExp(`(^|[\\s.,!?;:()\\[\\]{}<>])@${escapeRegExp(u)}(?=\\s|$|[.,!?;:()\\[\\]{}<>])`, "i");
};

const findMentionedProfiles = (content: string, profiles: Profile[], senderUserId?: string) => {
  const text = content.trim();
  if (!text) return [] as Profile[];

  const sortedProfiles = [...profiles].sort((a, b) => b.username.length - a.username.length);
  const picked: Profile[] = [];

  for (const profile of sortedProfiles) {
    if (senderUserId && profile.user_id === senderUserId) continue;
    const username = profile.username.trim();
    if (!username) continue;

    if (buildMentionRegex(username).test(text)) picked.push(profile);
  }

  return picked;
};

// ... keep existing code

const ChatPanel = ({ initialChannel }: { initialChannel?: string } = {}) => {
  const { user, profile, isAdmin } = useAuth();

  const [view, setView] = useState<ChatView>("channels");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChannel, setActiveChannel] = useState("general");
  const [channelLoading, setChannelLoading] = useState(true);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convoMembers, setConvoMembers] = useState<Record<string, string[]>>({});
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([]);

  const [friends, setFriends] = useState<Friendship[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [friendSearch, setFriendSearch] = useState("");

  const [showCreateGC, setShowCreateGC] = useState(false);
  const [gcName, setGcName] = useState("");
  const [gcMembers, setGcMembers] = useState<string[]>([]);

  // GC management state
  const [showGcSettings, setShowGcSettings] = useState(false);
  const [editGcName, setEditGcName] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState("");

  const [mentions, setMentions] = useState<ChatMention[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [reactionsByMessage, setReactionsByMessage] = useState<Record<string, ChatReaction[]>>({});

  // Online status
  const [userPresence, setUserPresence] = useState<Record<string, UserPresence>>({});
  const [myStatus, setMyStatus] = useState<"online" | "away" | "dnd" | "offline">("online");
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Typing indicators
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Polls
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; username: string; excerpt: string } | null>(null);
  const [pinnedByChannel, setPinnedByChannel] = useState<Record<string, string[]>>(() => {
    try {
      const raw = localStorage.getItem("ss-chat-pins-v1");
      const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const unreadMentions = useMemo(() => mentions.filter((m) => !m.is_read).length, [mentions]);

  useEffect(() => {
    if (!initialChannel) return;
    setView("channels");
    setActiveChannel(initialChannel);
  }, [initialChannel]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      toast.error("This browser doesn't support notifications");
      return;
    }

    if (Notification.permission === "granted") {
      toast.success("Notifications already enabled!");
      return;
    }

    if (Notification.permission === "denied") {
      toast.error("Notifications blocked. Enable in browser settings.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Notifications enabled! You'll get alerts for @mentions.");
      new Notification("SmartStudies", { body: "Notifications are now enabled! 🎉", icon: "/favicon.png" });
    } else {
      toast.error("Notification permission denied");
    }
  }, []);

  // ... keep existing code

  // Update presence
  const updatePresence = useCallback(async (status: "online" | "away" | "dnd" | "offline") => {
    if (!user) return;
    
    const { data: existing } = await supabase
      .from(USER_PRESENCE_TABLE)
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (existing) {
      await supabase
        .from(USER_PRESENCE_TABLE)
        .update({ status, last_seen: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from(USER_PRESENCE_TABLE)
        .insert({ user_id: user.id, status, last_seen: new Date().toISOString() });
    }
    
    setMyStatus(status);
    localStorage.setItem("ss-user-status", status);
  }, [user]);

  // Load presence for friends
  const loadPresence = useCallback(async () => {
    const friendIds = friends
      .filter(f => f.status === "accepted")
      .map(f => f.user_id === user?.id ? f.friend_id : f.user_id);
    
    if (friendIds.length === 0) return;
    
    const { data } = await supabase
      .from(USER_PRESENCE_TABLE)
      .select("*")
      .in("user_id", friendIds);
    
    if (data) {
      const presenceMap: Record<string, UserPresence> = {};
      for (const p of data as unknown as UserPresence[]) {
        presenceMap[p.user_id] = p;
      }
      setUserPresence(presenceMap);
    }
  }, [friends, user?.id]);

  // Broadcast typing
  const broadcastTyping = useCallback((conversationId: string) => {
    if (!user || !profile) return;
    
    const channel = supabase.channel(`typing-${conversationId}`);
    channel.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: user.id, username: profile.username },
    });
  }, [user, profile]);

  // Initialize presence and load saved status
  useEffect(() => {
    if (!user) return;
    
    const savedStatus = localStorage.getItem("ss-user-status") as "online" | "away" | "dnd" | "offline" | null;
    updatePresence(savedStatus || "online");
    
    // Heartbeat to keep presence alive
    const interval = setInterval(() => {
      if (myStatus !== "offline") {
        updatePresence(myStatus);
      }
    }, 60000);
    
    // Set offline on unload
    const handleUnload = () => {
      navigator.sendBeacon && updatePresence("offline");
    };
    
    window.addEventListener("beforeunload", handleUnload);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [user, myStatus, updatePresence]);

  // Load presence when friends change
  useEffect(() => {
    loadPresence();
    
    // Subscribe to presence changes
    const channel = supabase
      .channel("presence-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, () => {
        loadPresence();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [friends, loadPresence]);

  // Subscribe to typing indicators for active conversation
  useEffect(() => {
    if (!activeConvo) return;
    
    const channel = supabase.channel(`typing-${activeConvo.id}`);
    
    channel.on("broadcast", { event: "typing" }, (payload) => {
      const { user_id, username } = payload.payload;
      if (user_id === user?.id) return;
      
      setTypingUsers(prev => {
        const current = prev[activeConvo.id] || [];
        if (!current.includes(username)) {
          return { ...prev, [activeConvo.id]: [...current, username] };
        }
        return prev;
      });
      
      // Clear after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => {
          const current = prev[activeConvo.id] || [];
          return { ...prev, [activeConvo.id]: current.filter(u => u !== username) };
        });
      }, 3000);
    }).subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConvo, user?.id]);

  // Load polls
  useEffect(() => {
    if (activeChannel !== "polls") return;
    
    const loadPolls = async () => {
      const { data } = await supabase
        .from(POLLS_TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (data) setPolls(data as unknown as Poll[]);
    };
    
    loadPolls();
    
    const subscription = supabase
      .channel("polls-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "polls" }, () => loadPolls())
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [activeChannel]);

  const isMentioningCurrentUser = (content: string) => {
    if (!profile?.username) return false;
    return buildMentionRegex(profile.username).test(content);
  };

  const renderMessageContent = (content: string) => {
    if (!profile?.username) return content;

    const mentionToken = `@${profile.username}`;
    const splitPattern = new RegExp(`(${escapeRegExp(mentionToken)})`, "gi");
    const parts = content.split(splitPattern);

    return parts.map((part, index) =>
      part.toLowerCase() === mentionToken.toLowerCase() ? (
        <span key={`${part}-${index}`} className="text-primary font-semibold">
          {part}
        </span>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      )
    );
  };

  const groupedReactionsForMessage = (messageId: string) => {
    const reactions = reactionsByMessage[messageId] || [];
    const grouped = new Map<string, { count: number; reactedByMe: boolean }>();

    for (const reaction of reactions) {
      const current = grouped.get(reaction.emoji) || { count: 0, reactedByMe: false };
      current.count += 1;
      if (reaction.user_id === user?.id) current.reactedByMe = true;
      grouped.set(reaction.emoji, current);
    }

    return Array.from(grouped.entries()).map(([emoji, data]) => ({ emoji, ...data }));
  };

  const loadReactionsForMessages = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    const { data } = await supabase
      .from(CHAT_REACTIONS_TABLE)
      .select("*")
      .in("message_id", messageIds);

    const grouped: Record<string, ChatReaction[]> = {};

    for (const id of messageIds) grouped[id] = [];
    for (const row of ((data || []) as unknown as ChatReaction[])) {
      if (!grouped[row.message_id]) grouped[row.message_id] = [];
      grouped[row.message_id].push(row);
    }

    setReactionsByMessage((prev) => ({ ...prev, ...grouped }));
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const existing = (reactionsByMessage[messageId] || []).find(
      (reaction) => reaction.user_id === user.id && reaction.emoji === emoji
    );

    if (existing) {
      await supabase
        .from(CHAT_REACTIONS_TABLE)
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
    } else {
      await supabase.from(CHAT_REACTIONS_TABLE).insert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      });
    }

    await loadReactionsForMessages([messageId]);
  };

  const loadMentions = async () => {
    if (!user) return;

    const { data } = await supabase
      .from(CHAT_MENTIONS_TABLE)
      .select("*")
      .eq("recipient_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40);

    if (data) setMentions(data as unknown as ChatMention[]);
  };

  const markMentionAsRead = async (mentionId: string) => {
    if (!user) return;

    await supabase
      .from(CHAT_MENTIONS_TABLE)
      .update({ is_read: true })
      .eq("id", mentionId)
      .eq("recipient_user_id", user.id);

    setMentions((prev) => prev.map((mention) => (mention.id === mentionId ? { ...mention, is_read: true } : mention)));
  };

  const markChannelMentionsAsRead = async (channel: string) => {
    if (!user) return;

    const hasUnread = mentions.some((mention) => mention.channel === channel && !mention.is_read);
    if (!hasUnread) return;

    await supabase
      .from(CHAT_MENTIONS_TABLE)
      .update({ is_read: true })
      .eq("recipient_user_id", user.id)
      .eq("channel", channel)
      .eq("is_read", false);

    setMentions((prev) =>
      prev.map((mention) =>
        mention.channel === channel ? { ...mention, is_read: true } : mention
      )
    );
  };

  useEffect(() => {
    if (!user) return;

    loadMentions();

    const ensureAudio = async () => {
      try {
        const AnyAudio = (window.AudioContext || (window as any).webkitAudioContext) as
          | (new () => AudioContext)
          | undefined;
        if (!AnyAudio) return null;
        const ctx = new AnyAudio();
        if (ctx.state === "suspended") await ctx.resume();
        return ctx;
      } catch {
        return null;
      }
    };

    const ping = async (force = false) => {
      const soundEnabled = localStorage.getItem("ss-mention-sound") !== "false";
      const vibrateEnabled = localStorage.getItem("ss-mention-vibrate") === "true";

      if ((force || soundEnabled) && typeof window !== "undefined") {
        const ctx = await ensureAudio();
        if (ctx) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.26);
        }
      }

      if ((force || vibrateEnabled) && navigator.vibrate) {
        navigator.vibrate([10, 45, 20]);
      }
    };

    const sendBrowserNotification = (title: string, body: string) => {
      if (Notification.permission === "granted" && document.hidden) {
        new Notification(title, { body, icon: "/favicon.png" });
      }
    };

    const subscription = supabase
      .channel(`mentions-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_mentions",
          filter: `recipient_user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newMention = payload.new as any;
          const excerpt = newMention.excerpt?.slice(0, 100) || "Someone pinged you!";
          
          toast(`📢 You were mentioned in #${newMention.channel}`, {
            description: excerpt,
            duration: 5000,
          });
          
          sendBrowserNotification(`Mentioned in #${newMention.channel}`, excerpt);
          await ping(false);
          loadMentions();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_mentions",
          filter: `recipient_user_id=eq.${user.id}`,
        },
        () => loadMentions()
      )
      .subscribe();

    const onTest = async () => {
      await ping(true);
    };

    window.addEventListener("ss-mention-test", onTest);

    return () => {
      supabase.removeChannel(subscription);
      window.removeEventListener("ss-mention-test", onTest);
    };
  }, [user?.id]);

  useEffect(() => {
    if (view === "channels") {
      setShowMentions(false);
      markChannelMentionsAsRead(activeChannel);
    }
  }, [activeChannel, view]);

  useEffect(() => {
    if (view !== "channels" || activeChannel === "soundboard" || activeChannel === "polls") return;

    setChannelLoading(true);

    const load = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("channel", activeChannel)
        .order("created_at", { ascending: true })
        .limit(100);

      if (data) setMessages(data as Message[]);
      setChannelLoading(false);
    };

    load();

    const subscription = supabase
      .channel(`ch-${activeChannel}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel=eq.${activeChannel}`,
        },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_messages",
          filter: `channel=eq.${activeChannel}`,
        },
        (payload) =>
          setMessages((prev) => prev.filter((message) => message.id !== (payload.old as any).id))
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [activeChannel, view]);

  useEffect(() => {
    if (view !== "channels" || activeChannel === "soundboard" || activeChannel === "polls") return;

    const messageIds = messages.map((message) => message.id);
    if (messageIds.length === 0) {
      setReactionsByMessage({});
      return;
    }

    loadReactionsForMessages(messageIds);
    const messageIdSet = new Set(messageIds);

    const subscription = supabase
      .channel(`chat-reactions-${activeChannel}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_message_reactions",
        },
        (payload) => {
          const changed = (payload.new || payload.old) as { message_id?: string };
          if (changed?.message_id && messageIdSet.has(changed.message_id)) {
            loadReactionsForMessages([changed.message_id]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [view, activeChannel, messages]);

  useEffect(() => {
    if (!user) return;

    const loadFriends = async () => {
      const { data } = await supabase.from("friendships").select("*");
      if (data) setFriends(data as Friendship[]);
    };

    const loadProfiles = async () => {
      const { data } = await supabase.from("profiles").select("user_id, username, display_name");
      if (data) setAllProfiles(data as Profile[]);
    };

    loadFriends();
    loadProfiles();

    const subscription = supabase
      .channel("friends-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => loadFriends())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    const { data: memberData, error: memberError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (memberError) {
      toast.error("Failed to load conversations", { description: memberError.message });
      return;
    }

    if (!memberData || memberData.length === 0) {
      setConversations([]);
      setConvoMembers({});
      return;
    }

    const ids = memberData.map((row: any) => row.conversation_id);
    const { data: convoData, error: convoError } = await supabase.from("conversations").select("*").in("id", ids);
    if (convoError) {
      toast.error("Failed to load conversations", { description: convoError.message });
      return;
    }
    if (convoData) setConversations(convoData as Conversation[]);

    const { data: allMembers, error: membersError } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .in("conversation_id", ids);

    if (membersError) {
      toast.error("Failed to load conversation members", { description: membersError.message });
      return;
    }

    if (allMembers) {
      const memberMap: Record<string, string[]> = {};
      for (const m of allMembers as any[]) {
        if (!memberMap[m.conversation_id]) memberMap[m.conversation_id] = [];
        memberMap[m.conversation_id].push(m.user_id);
      }
      setConvoMembers(memberMap);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({ user_id: user.id, friend_id: friendId });
    if (error) {
      toast.error("Failed to send request", { description: error.message });
      return;
    }
    toast.success("Friend request sent!");
  };

  const ensureDirectConversation = async (otherUserId: string, opts: { open?: boolean } = {}) => {
    if (!user || !profile) return null;
    const shouldOpen = opts.open !== false;

    const existingInState = conversations.find((c) => {
      if (c.is_group) return false;
      const members = convoMembers[c.id] || [];
      return members.length === 2 && members.includes(user.id) && members.includes(otherUserId);
    });

    if (existingInState) {
      if (shouldOpen) {
        setActiveConvo(existingInState);
        setView("dms");
      }
      return existingInState;
    }

    const { data: myConversations, error: myConvoError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (myConvoError) {
      toast.error("Failed to open DM", { description: myConvoError.message });
      return null;
    }

    if (myConversations) {
      for (const memberRow of myConversations) {
        const { data: conversation } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", memberRow.conversation_id)
          .eq("is_group", false)
          .maybeSingle();

        if (!conversation) continue;

        const { data: members } = await supabase
          .from("conversation_members")
          .select("user_id")
          .eq("conversation_id", memberRow.conversation_id);

        if (!members) continue;

        if (members.length === 2 && members.some((m: any) => m.user_id === otherUserId)) {
          const conv = conversation as unknown as Conversation;
          if (shouldOpen) {
            setActiveConvo(conv);
            setView("dms");
          }
          return conv;
        }
      }
    }

    const { data: newConversation, error: createError } = await supabase
      .from("conversations")
      .insert({ is_group: false, created_by: user.id })
      .select("*")
      .single();

    if (createError || !newConversation) {
      toast.error("Failed to create DM", { description: createError?.message || "Unknown error" });
      return null;
    }

    const { error: addMembersError } = await supabase.from("conversation_members").insert([
      { conversation_id: newConversation.id, user_id: user.id },
      { conversation_id: newConversation.id, user_id: otherUserId },
    ]);

    if (addMembersError) {
      toast.error("Failed to add DM members", { description: addMembersError.message });
      return null;
    }

    await loadConversations();

    const conv = newConversation as Conversation;
    if (shouldOpen) {
      setActiveConvo(conv);
      setView("dms");
    }

    return conv;
  };

  const acceptFriend = async (friendshipId: string) => {
    if (!user) return;
    const friendship = friends.find((f) => f.id === friendshipId);

    const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
    if (error) {
      toast.error("Failed to accept friend", { description: error.message });
      return;
    }

    toast.success("Friend request accepted!");

    if (friendship) {
      const otherUserId = friendship.user_id === user.id ? friendship.friend_id : friendship.user_id;
      await ensureDirectConversation(otherUserId, { open: false });
    }
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (error) {
      toast.error("Failed to remove friend", { description: error.message });
      return;
    }
    toast("Friend removed");
  };

  const startDM = async (otherUserId: string) => {
    await ensureDirectConversation(otherUserId, { open: true });
  };

  const createGroupChat = async () => {
    if (!user || !gcName.trim() || gcMembers.length === 0) return;

    const { data: newConversation, error: createError } = await supabase
      .from("conversations")
      .insert({ name: gcName.trim(), is_group: true, created_by: user.id })
      .select("*")
      .single();

    if (createError || !newConversation) {
      toast.error("Failed to create group chat", { description: createError?.message || "Unknown error" });
      return;
    }

    const members = [user.id, ...gcMembers].map((memberId) => ({
      conversation_id: newConversation.id,
      user_id: memberId,
    }));

    const { error: membersError } = await supabase.from("conversation_members").insert(members);
    if (membersError) {
      toast.error("Failed to add members", { description: membersError.message });
      return;
    }

    await loadConversations();

    setActiveConvo(newConversation as Conversation);
    setShowCreateGC(false);
    setGcName("");
    setGcMembers([]);
    setView("dms");
  };

  // GC Management functions
  const canManageGC = (convo: Conversation) => {
    if (!user || !convo.is_group) return false;
    return convo.created_by === user.id || isAdmin;
  };

  const renameGroupChat = async () => {
    if (!activeConvo || !editGcName.trim()) return;
    const { error } = await supabase
      .from("conversations")
      .update({ name: editGcName.trim() })
      .eq("id", activeConvo.id);

    if (error) {
      toast.error("Failed to rename", { description: error.message });
      return;
    }

    setActiveConvo({ ...activeConvo, name: editGcName.trim() });
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConvo.id ? { ...c, name: editGcName.trim() } : c))
    );
    toast.success("Group chat renamed!");
    setShowGcSettings(false);
  };

  const deleteGroupChat = async () => {
    if (!activeConvo) return;

    await supabase.from("conversation_members").delete().eq("conversation_id", activeConvo.id);
    await supabase.from("direct_messages").delete().eq("conversation_id", activeConvo.id);
    const { error } = await supabase.from("conversations").delete().eq("id", activeConvo.id);

    if (error) {
      toast.error("Failed to delete group chat", { description: error.message });
      return;
    }

    setConversations((prev) => prev.filter((c) => c.id !== activeConvo.id));
    setActiveConvo(null);
    setShowGcSettings(false);
    toast.success("Group chat deleted");
  };

  const leaveGroupChat = async () => {
    if (!activeConvo || !user) return;
    
    // Owner can't leave, they must delete
    if (activeConvo.created_by === user.id) {
      toast.error("As the owner, you must delete the group chat instead of leaving.");
      return;
    }

    const { error } = await supabase
      .from("conversation_members")
      .delete()
      .eq("conversation_id", activeConvo.id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to leave group chat", { description: error.message });
      return;
    }

    setConversations((prev) => prev.filter((c) => c.id !== activeConvo.id));
    setActiveConvo(null);
    toast.success("Left group chat");
  };

  const addMemberToGC = async (userId: string) => {
    if (!activeConvo) return;

    const currentMembers = convoMembers[activeConvo.id] || [];
    if (currentMembers.includes(userId)) {
      toast.error("User is already in this group");
      return;
    }

    const { error } = await supabase.from("conversation_members").insert({
      conversation_id: activeConvo.id,
      user_id: userId,
    });

    if (error) {
      toast.error("Failed to add member", { description: error.message });
      return;
    }

    setConvoMembers((prev) => ({
      ...prev,
      [activeConvo.id]: [...(prev[activeConvo.id] || []), userId],
    }));
    toast.success("Member added!");
    setShowAddMembers(false);
    setAddMemberSearch("");
  };

  const removeMemberFromGC = async (userId: string) => {
    if (!activeConvo) return;

    const { error } = await supabase
      .from("conversation_members")
      .delete()
      .eq("conversation_id", activeConvo.id)
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to remove member", { description: error.message });
      return;
    }

    setConvoMembers((prev) => ({
      ...prev,
      [activeConvo.id]: (prev[activeConvo.id] || []).filter((id) => id !== userId),
    }));
    toast.success("Member removed");
  };

  // Soundboard - use Web Audio API for reliability
  const playSound = (url: string, fallbackFreq?: number) => {
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Fallback: generate a tone with Web Audio API
      try {
        const AnyAudio = (window.AudioContext || (window as any).webkitAudioContext) as
          | (new () => AudioContext)
          | undefined;
        if (!AnyAudio) { toast.error("Audio not supported"); return; }
        const ctx = new AnyAudio();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = fallbackFreq || 440;
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
        toast.info("Played fallback tone (original sound blocked by browser)");
      } catch {
        toast.error("Couldn't play sound — try clicking anywhere first");
      }
    });
  };

  // Polls
  const createPoll = async () => {
    if (!user || !profile || !pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) return;

    const validOptions = pollOptions.filter(o => o.trim());
    const { error } = await supabase.from(POLLS_TABLE).insert({
      user_id: user.id,
      username: profile.username,
      question: pollQuestion.trim(),
      options: validOptions,
      votes: {},
    });

    if (error) {
      toast.error("Failed to create poll", { description: error.message });
      return;
    }

    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowCreatePoll(false);
    toast.success("Poll created!");
  };

  const votePoll = async (pollId: string, optionIndex: number) => {
    if (!user) return;
    
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;

    const newVotes = { ...poll.votes };
    
    // Remove existing vote
    for (const key in newVotes) {
      newVotes[key] = (newVotes[key] || []).filter(id => id !== user.id);
    }
    
    // Add new vote
    const optKey = String(optionIndex);
    if (!newVotes[optKey]) newVotes[optKey] = [];
    newVotes[optKey].push(user.id);

    await supabase.from(POLLS_TABLE).update({ votes: newVotes }).eq("id", pollId);
  };

  const deletePoll = async (pollId: string) => {
    await supabase.from(POLLS_TABLE).delete().eq("id", pollId);
    toast.success("Poll deleted");
  };

  const getProfileByUserId = (userId: string) => allProfiles.find((current) => current.user_id === userId);
  const getAcceptedFriends = () => friends.filter((friend) => friend.status === "accepted");
  const getPendingReceived = () =>
    friends.filter((friend) => friend.status === "pending" && friend.friend_id === user?.id);
  const getPendingSent = () =>
    friends.filter((friend) => friend.status === "pending" && friend.user_id === user?.id);

  const getFriendship = (otherUserId: string) =>
    friends.find(
      (f) =>
        (f.user_id === otherUserId && f.friend_id === user?.id) ||
        (f.friend_id === otherUserId && f.user_id === user?.id)
    );

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    if (!conversation.is_group && user) {
      const members = convoMembers[conversation.id] || [];
      const otherId = members.find((id) => id !== user.id);
      if (otherId) {
        const otherProfile = getProfileByUserId(otherId);
        if (otherProfile) return otherProfile.display_name || otherProfile.username;
      }
    }
    return "Direct Message";
  };

  const isReadOnly = (activeChannel === "announcements" || activeChannel === "updates") && !isAdmin;

  const currentTypers = activeConvo ? (typingUsers[activeConvo.id] || []) : [];

  // ── Load DM messages when activeConvo changes ──
  useEffect(() => {
    if (!activeConvo) {
      setDmMessages([]);
      return;
    }

    const loadDmMessages = async () => {
      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", activeConvo.id)
        .order("created_at", { ascending: true })
        .limit(100);

      if (data) setDmMessages(data as DirectMessage[]);
    };

    loadDmMessages();

    const subscription = supabase
      .channel(`dm-${activeConvo.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${activeConvo.id}`,
        },
        (payload) => setDmMessages((prev) => [...prev, payload.new as DirectMessage])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [activeConvo?.id]);

  // ── Handler functions ──

  const handleDmInputChange = (value: string) => {
    setInput(value);
    if (activeConvo) broadcastTyping(activeConvo.id);
  };

  const sendDM = async () => {
    if (!user || !profile || !activeConvo || !input.trim()) return;
    const content = input.trim();
    setInput("");

    const { error } = await supabase.from("direct_messages").insert({
      conversation_id: activeConvo.id,
      user_id: user.id,
      username: profile.username,
      content,
    });

    if (error) {
      toast.error("Failed to send message", { description: error.message });
    }
  };

  const sendChannelMessage = async () => {
    if (!user || !profile || !input.trim()) return;
    const content = input.trim();
    setInput("");

    const payload: any = {
      channel: activeChannel,
      user_id: user.id,
      username: profile.username,
      content: replyTo ? `> **@${replyTo.username}**: ${replyTo.excerpt}\n\n${content}` : content,
    };

    const { error } = await supabase.from("chat_messages").insert(payload);

    if (error) {
      toast.error("Failed to send message", { description: error.message });
      return;
    }

    // Insert mentions
    const mentioned = findMentionedProfiles(content, allProfiles, user.id);
    if (mentioned.length > 0) {
      const mentionRows = mentioned.map((p) => ({
        message_id: "", // will be filled by trigger or we skip
        channel: activeChannel,
        recipient_user_id: p.user_id,
        sender_user_id: user.id,
        excerpt: content.slice(0, 120),
      }));

      // We need the message id – fetch the latest message we just inserted
      const { data: latest } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("channel", activeChannel)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (latest) {
        for (const row of mentionRows) {
          row.message_id = latest.id;
        }
        await supabase.from(CHAT_MENTIONS_TABLE).insert(mentionRows);
      }
    }

    setReplyTo(null);
  };

  const deleteMessage = async (messageId: string, messageUserId: string) => {
    if (!user) return;
    if (user.id !== messageUserId && !isAdmin) return;

    const { error } = await supabase.from("chat_messages").delete().eq("id", messageId);
    if (error) {
      toast.error("Failed to delete message", { description: error.message });
    }
  };

  const togglePinMessage = (messageId: string) => {
    setPinnedByChannel((prev) => {
      const pins = prev[activeChannel] || [];
      const updated = pins.includes(messageId)
        ? pins.filter((id) => id !== messageId)
        : [...pins, messageId];
      const next = { ...prev, [activeChannel]: updated };
      localStorage.setItem("ss-chat-pins-v1", JSON.stringify(next));
      return next;
    });
  };

  // Active conversation view (DMs / GC)
  if (activeConvo) {
    const gcManagedByMe = canManageGC(activeConvo);
    const currentGcMembers = convoMembers[activeConvo.id] || [];
    const canLeave = activeConvo.is_group && activeConvo.created_by !== user?.id;

    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          <button onClick={() => { setActiveConvo(null); setShowGcSettings(false); }} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-foreground flex-1 truncate">{getConversationName(activeConvo)}</span>
          {activeConvo.is_group && <Users className="w-3.5 h-3.5 text-muted-foreground" />}
          {canLeave && (
            <button
              onClick={leaveGroupChat}
              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Leave group"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
          {activeConvo.is_group && gcManagedByMe && (
            <button
              onClick={() => {
                setEditGcName(activeConvo.name || "");
                setShowGcSettings((p) => !p);
                setShowAddMembers(false);
              }}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Group settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* GC Settings Panel */}
        {showGcSettings && activeConvo.is_group && gcManagedByMe && (
          <div className="border-b border-border bg-card/80 p-3 space-y-3">
            {/* Rename */}
            <div>
              <p className="text-[10px] text-muted-foreground font-medium mb-1">RENAME GROUP</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editGcName}
                  onChange={(e) => setEditGcName(e.target.value)}
                  placeholder="New group name..."
                  className="flex-1 px-2 py-1.5 bg-muted border border-border rounded-md text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <button
                  onClick={renameGroupChat}
                  disabled={!editGcName.trim()}
                  className="px-3 py-1.5 rounded-md gradient-warm-bg text-primary-foreground text-xs font-medium disabled:opacity-50"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Members */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] text-muted-foreground font-medium">MEMBERS ({currentGcMembers.length})</p>
                <button
                  onClick={() => { setShowAddMembers((p) => !p); setAddMemberSearch(""); }}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {showAddMembers && (
                <div className="mb-2 space-y-1">
                  <input
                    type="text"
                    value={addMemberSearch}
                    onChange={(e) => setAddMemberSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full px-2 py-1.5 bg-muted border border-border rounded-md text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                  <div className="max-h-24 overflow-y-auto space-y-0.5">
                    {allProfiles
                      .filter(
                        (p) =>
                          p.user_id !== user?.id &&
                          !currentGcMembers.includes(p.user_id) &&
                          p.username.toLowerCase().includes(addMemberSearch.toLowerCase())
                      )
                      .slice(0, 10)
                      .map((p) => (
                        <div key={p.user_id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted">
                          <span className="text-xs text-foreground">{p.display_name || p.username}</span>
                          <button
                            onClick={() => addMemberToGC(p.user_id)}
                            className="p-1 text-primary hover:bg-primary/10 rounded"
                          >
                            <UserPlus className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="space-y-0.5 max-h-32 overflow-y-auto">
                {currentGcMembers.map((memberId) => {
                  const memberProfile = getProfileByUserId(memberId);
                  const isOwner = activeConvo.created_by === memberId;
                  return (
                    <div key={memberId} className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted">
                      <span className="text-xs text-foreground">
                        {memberProfile?.display_name || memberProfile?.username || "User"}
                        {isOwner && <span className="text-primary ml-1 text-[10px]">(owner)</span>}
                        {memberId === user?.id && <span className="text-muted-foreground ml-1 text-[10px]">(you)</span>}
                      </span>
                      {memberId !== user?.id && memberId !== activeConvo.created_by && gcManagedByMe && (
                        <button
                          onClick={() => removeMemberFromGC(memberId)}
                          className="p-1 text-destructive hover:bg-destructive/10 rounded"
                          title="Remove member"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={deleteGroupChat}
              className="w-full px-3 py-2 rounded-md bg-destructive/15 text-destructive text-xs font-medium hover:bg-destructive/25 transition-colors"
            >
              <Trash2 className="w-3 h-3 inline mr-1.5" />
              Delete Group Chat
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {dmMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No messages yet. Say hi! 👋</div>
          ) : (
            dmMessages.map((message) => (
              <div key={message.id} className="text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-primary text-xs">{message.username}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-foreground text-sm mt-0.5">{message.content}</p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {currentTypers.length > 0 && (
          <div className="px-3 py-1 text-xs text-muted-foreground italic">
            {currentTypers.join(", ")} {currentTypers.length === 1 ? "is" : "are"} typing...
          </div>
        )}

        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(event) => handleDmInputChange(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && sendDM()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-muted border border-border rounded-md text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            <button
              onClick={sendDM}
              className="p-2 rounded-md gradient-warm-bg text-primary-foreground hover:opacity-90"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-0 relative">
      <div className="w-48 shrink-0 border-r border-border flex flex-col">
        <div className="flex border-b border-border">
          {(["channels", "friends", "dms"] as ChatView[]).map((currentView) => (
            <button
              key={currentView}
              onClick={() => setView(currentView)}
              className={`flex-1 py-2 text-[11px] font-medium capitalize transition-colors ${
                view === currentView
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-1">
                {currentView === "dms" ? "DMs" : currentView}
                {currentView === "channels" && unreadMentions > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                    {unreadMentions}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Status selector */}
        {view === "friends" && (
          <div className="p-2 border-b border-border">
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(p => !p)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-xs"
              >
                <Circle className={`w-2.5 h-2.5 ${STATUS_COLORS[myStatus]}`} fill="currentColor" />
                <span className="text-foreground">{STATUS_LABELS[myStatus]}</span>
              </button>
              {showStatusMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50">
                  {(["online", "away", "dnd", "offline"] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => { updatePresence(status); setShowStatusMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted first:rounded-t-lg last:rounded-b-lg"
                    >
                      <Circle className={`w-2.5 h-2.5 ${STATUS_COLORS[status]}`} fill="currentColor" />
                      <span>{STATUS_LABELS[status]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {view === "channels" &&
            CHANNELS.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeChannel === channel.id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <channel.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{channel.label}</span>
              </button>
            ))}

          {view === "friends" && (
            <div className="space-y-2">
              {/* Enable notifications button */}
              <button
                onClick={requestNotificationPermission}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-all"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Notifications</span>
              </button>

              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input
                  type="text"
                  value={friendSearch}
                  onChange={(event) => setFriendSearch(event.target.value)}
                  placeholder="Find users..."
                  className="w-full pl-7 pr-2 py-1.5 bg-muted border border-border rounded-md text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {getPendingReceived().length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground px-1 mb-1 font-medium">PENDING REQUESTS</p>
                  {getPendingReceived().map((friendship) => {
                    const pendingProfile = getProfileByUserId(friendship.user_id);
                    return (
                      <div key={friendship.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/50">
                        <span className="text-xs text-foreground">{pendingProfile?.username || "User"}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => acceptFriend(friendship.id)}
                            className="p-1 text-primary hover:bg-primary/10 rounded"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeFriend(friendship.id)}
                            className="p-1 text-destructive hover:bg-destructive/10 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {getPendingSent().length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground px-1 mb-1 font-medium">SENT REQUESTS</p>
                  {getPendingSent().map((friendship) => {
                    const sentProfile = getProfileByUserId(friendship.friend_id);
                    return (
                      <div key={friendship.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/50">
                        <span className="text-xs text-foreground">{sentProfile?.username || "User"}</span>
                        <button
                          onClick={() => removeFriend(friendship.id)}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                          title="Cancel request"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <p className="text-[10px] text-muted-foreground px-1 mb-1 font-medium">
                  FRIENDS ({getAcceptedFriends().length})
                </p>
                {getAcceptedFriends().map((friendship) => {
                  const friendUserId = friendship.user_id === user?.id ? friendship.friend_id : friendship.user_id;
                  const friendProfile = getProfileByUserId(friendUserId);
                  const presence = userPresence[friendUserId];
                  const friendStatus = presence?.status || "offline";

                  return (
                    <div key={friendship.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted">
                      <div className="flex items-center gap-2">
                        <Circle className={`w-2 h-2 ${STATUS_COLORS[friendStatus]}`} fill="currentColor" />
                        <span className="text-xs text-foreground">{friendProfile?.username || "User"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startDM(friendUserId)} className="text-[10px] text-primary hover:underline">
                          Message
                        </button>
                        <button
                          onClick={() => removeFriend(friendship.id)}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                          title="Unfriend"
                        >
                          <UserMinus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {getAcceptedFriends().length === 0 && (
                  <p className="text-[10px] text-muted-foreground px-2 py-2">No friends yet. Search to add some!</p>
                )}
              </div>

              {friendSearch && (
                <div>
                  <p className="text-[10px] text-muted-foreground px-1 mb-1 font-medium">SEARCH RESULTS</p>
                  {allProfiles
                    .filter(
                      (candidate) =>
                        candidate.user_id !== user?.id &&
                        candidate.username.toLowerCase().includes(friendSearch.toLowerCase())
                    )
                    .map((candidate) => {
                      const existingFriendship = getFriendship(candidate.user_id);
                      const isFriend = existingFriendship?.status === "accepted";
                      const isPending = existingFriendship?.status === "pending";

                      return (
                        <div key={candidate.user_id} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted">
                          <span className="text-xs text-foreground">{candidate.username}</span>
                          {isFriend ? (
                            <button
                              onClick={() => removeFriend(existingFriendship!.id)}
                              className="p-1 text-destructive hover:bg-destructive/10 rounded"
                              title="Unfriend"
                            >
                              <UserMinus className="w-3 h-3" />
                            </button>
                          ) : isPending ? (
                            <span className="text-[10px] text-muted-foreground">Pending</span>
                          ) : (
                            <button
                              onClick={() => sendFriendRequest(candidate.user_id)}
                              className="p-1 text-primary hover:bg-primary/10 rounded"
                              title="Add friend"
                            >
                              <UserPlus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {view === "dms" && (
            <div className="space-y-1">
              <button
                onClick={() => setShowCreateGC(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> New Group Chat
              </button>

              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConvo(conversation)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-foreground hover:bg-muted transition-all"
                >
                  {conversation.is_group ? (
                    <Users className="w-3.5 h-3.5 shrink-0 text-primary" />
                  ) : (
                    <MessageCircle className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">{getConversationName(conversation)}</span>
                </button>
              ))}

              {conversations.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-4 text-center">No conversations yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {showCreateGC && (
        <div className="absolute inset-0 bg-background/80 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Create Group Chat</h3>
            <input
              type="text"
              value={gcName}
              onChange={(event) => setGcName(event.target.value)}
              placeholder="Group name..."
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            <div>
              <p className="text-xs text-muted-foreground mb-2">Add members (friends only):</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {getAcceptedFriends().map((friendship) => {
                  const friendUserId = friendship.user_id === user?.id ? friendship.friend_id : friendship.user_id;
                  const friendProfile = getProfileByUserId(friendUserId);
                  const selected = gcMembers.includes(friendUserId);

                  return (
                    <button
                      key={friendship.id}
                      onClick={() =>
                        setGcMembers((prev) =>
                          selected ? prev.filter((memberId) => memberId !== friendUserId) : [...prev, friendUserId]
                        )
                      }
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                        selected ? "bg-primary/15 text-primary" : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <span>{friendProfile?.username || "User"}</span>
                      {selected && <Check className="w-3 h-3 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createGroupChat}
                disabled={!gcName.trim() || gcMembers.length === 0}
                className="px-4 py-2 rounded-lg gradient-warm-bg text-primary-foreground text-xs font-medium disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateGC(false)}
                className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soundboard channel */}
      {view === "channels" && activeChannel === "soundboard" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-3 py-2 border-b border-border flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Soundboard</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-xs text-muted-foreground mb-4">Click a sound to play it! 🔊</p>
            <div className="grid grid-cols-2 gap-2">
              {SOUNDBOARD_SOUNDS.map((sound) => (
                <button
                  key={sound.name}
                  onClick={() => playSound(sound.url, sound.freq)}
                  className="p-3 rounded-lg bg-muted hover:bg-muted/80 border border-border hover:border-primary/50 transition-all text-sm font-medium text-foreground"
                >
                  🔊 {sound.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Polls channel */}
      {view === "channels" && activeChannel === "polls" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Polls</span>
            </div>
            <button
              onClick={() => setShowCreatePoll(true)}
              className="px-2 py-1 rounded text-xs gradient-warm-bg text-primary-foreground font-medium"
            >
              <Plus className="w-3 h-3 inline mr-1" /> New Poll
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {showCreatePoll && (
              <div className="bg-card border border-border rounded-lg p-3 space-y-2">
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="What's your question?"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                {pollOptions.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...pollOptions];
                      newOpts[i] = e.target.value;
                      setPollOptions(newOpts);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                ))}
                {pollOptions.length < 5 && (
                  <button
                    onClick={() => setPollOptions([...pollOptions, ""])}
                    className="text-xs text-primary hover:underline"
                  >
                    + Add option
                  </button>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={createPoll}
                    disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                    className="px-3 py-1.5 rounded gradient-warm-bg text-primary-foreground text-xs font-medium disabled:opacity-50"
                  >
                    Create Poll
                  </button>
                  <button
                    onClick={() => { setShowCreatePoll(false); setPollQuestion(""); setPollOptions(["", ""]); }}
                    className="px-3 py-1.5 rounded bg-muted text-muted-foreground text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {polls.length === 0 && !showCreatePoll && (
              <div className="text-center py-8 text-muted-foreground text-sm">No polls yet. Create one! 📊</div>
            )}
            
            {polls.map((poll) => {
              const totalVotes = Object.values(poll.votes).flat().length;
              const myVote = Object.entries(poll.votes).find(([_, voters]) => voters.includes(user?.id || ""))?.[0];
              
              return (
                <div key={poll.id} className="bg-card border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{poll.question}</p>
                      <p className="text-[10px] text-muted-foreground">by {poll.username} • {totalVotes} votes</p>
                    </div>
                    {(poll.user_id === user?.id || isAdmin) && (
                      <button
                        onClick={() => deletePoll(poll.id)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {poll.options.map((option, i) => {
                      const voteCount = (poll.votes[String(i)] || []).length;
                      const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                      const isMyVote = myVote === String(i);
                      
                      return (
                        <button
                          key={i}
                          onClick={() => votePoll(poll.id, i)}
                          className={`w-full text-left px-3 py-2 rounded-md text-xs transition-all relative overflow-hidden ${
                            isMyVote ? "bg-primary/20 border border-primary" : "bg-muted hover:bg-muted/80 border border-transparent"
                          }`}
                        >
                          <div
                            className="absolute inset-0 bg-primary/10"
                            style={{ width: `${percentage}%` }}
                          />
                          <div className="relative flex items-center justify-between">
                            <span className="text-foreground">{option}</span>
                            <span className="text-muted-foreground">{percentage}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "channels" && activeChannel !== "soundboard" && activeChannel !== "polls" && (
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {CHANNELS.find((c) => c.id === activeChannel)?.label || activeChannel}
              </span>
              {isReadOnly && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Read-only</span>
              )}
            </div>
            <button
              onClick={() => setShowMentions((prev) => !prev)}
              className={`p-1.5 rounded-md transition-colors relative ${
                showMentions ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              title="View mentions"
            >
              <Bell className="w-4 h-4" />
              {unreadMentions > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground font-bold">
                  {unreadMentions}
                </span>
              )}
            </button>
          </div>

          {showMentions ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <p className="text-[10px] text-muted-foreground font-medium px-1 mb-2">YOUR MENTIONS</p>
              {mentions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No mentions yet</p>
              ) : (
                mentions.map((mention) => (
                  <button
                    key={mention.id}
                    onClick={() => {
                      markMentionAsRead(mention.id);
                      setActiveChannel(mention.channel);
                      setShowMentions(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      mention.is_read
                        ? "border-border bg-muted/30 hover:bg-muted/50"
                        : "border-primary/40 bg-primary/5 hover:bg-primary/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                      <Hash className="w-3 h-3" />
                      <span>{mention.channel}</span>
                      <span>•</span>
                      <span>{new Date(mention.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-foreground line-clamp-2">{mention.excerpt}</p>
                  </button>
                ))
              )}
            </div>
          ) : (
            <>
              {(pinnedByChannel[activeChannel]?.length ?? 0) > 0 && (
                <div className="px-3 py-2 border-b border-border bg-primary/5">
                  <p className="text-[10px] text-primary font-medium flex items-center gap-1 mb-1">
                    <Pin className="w-3 h-3" /> PINNED
                  </p>
                  {messages
                    .filter((m) => pinnedByChannel[activeChannel]?.includes(m.id))
                    .map((m) => (
                      <div key={m.id} className="text-xs text-foreground line-clamp-1">
                        <span className="font-semibold text-primary">{m.username}:</span> {m.content}
                      </div>
                    ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {channelLoading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No messages yet. Be the first! 👋
                  </div>
                ) : (
                  messages.map((message) => {
                    const isPinned = pinnedByChannel[activeChannel]?.includes(message.id);
                    const isMention = isMentioningCurrentUser(message.content);
                    const reactions = groupedReactionsForMessage(message.id);

                    return (
                      <div
                        key={message.id}
                        className={`group text-sm rounded-lg p-2 -mx-2 transition-colors ${
                          isPinned
                            ? "bg-primary/5 border-l-2 border-primary"
                            : isMention
                            ? "bg-primary/10"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-primary text-xs">{message.username}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>

                          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() =>
                                setReplyTo({
                                  id: message.id,
                                  username: message.username,
                                  excerpt: message.content.slice(0, 50),
                                })
                              }
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="Reply"
                            >
                              <CornerUpLeft className="w-3 h-3" />
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => togglePinMessage(message.id)}
                                className={`p-1 rounded hover:bg-muted ${
                                  isPinned ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                }`}
                                title={isPinned ? "Unpin" : "Pin"}
                              >
                                <Pin className="w-3 h-3" />
                              </button>
                            )}

                            {(user?.id === message.user_id || isAdmin) && (
                              <button
                                onClick={() => deleteMessage(message.id, message.user_id)}
                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-foreground text-sm mt-0.5 whitespace-pre-wrap">
                          {renderMessageContent(message.content)}
                        </p>

                        {/* Reactions row */}
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {reactions.map(({ emoji, count, reactedByMe }) => (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(message.id, emoji)}
                              className={`px-1.5 py-0.5 rounded-full text-[11px] border transition-colors ${
                                reactedByMe
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-muted/50 text-muted-foreground hover:border-muted-foreground"
                              }`}
                            >
                              {emoji} {count}
                            </button>
                          ))}

                          {/* Add reaction picker */}
                          <div className="relative group/react">
                            <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                              +
                            </button>
                            <div className="absolute bottom-full left-0 mb-1 hidden group-hover/react:flex bg-card border border-border rounded-lg shadow-lg p-1 gap-0.5 z-10">
                              {REACTION_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction(message.id, emoji)}
                                  className="p-1 hover:bg-muted rounded text-sm"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {replyTo && (
                <div className="px-3 py-1.5 border-t border-border bg-muted/50 flex items-center gap-2 text-xs">
                  <CornerUpLeft className="w-3 h-3 text-primary" />
                  <span className="text-muted-foreground">
                    Replying to <span className="text-primary">@{replyTo.username}</span>
                  </span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {!isReadOnly && (
                <div className="p-3 border-t border-border">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && sendChannelMessage()}
                      placeholder={`Message #${activeChannel}... (use @username to ping)`}
                      className="flex-1 px-3 py-2 bg-muted border border-border rounded-md text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={sendChannelMessage}
                      className="p-2 rounded-md gradient-warm-bg text-primary-foreground hover:opacity-90"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
