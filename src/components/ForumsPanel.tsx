import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  MessageSquare, Plus, ArrowLeft, Send, Trash2,
  Gamepad2, MessageCircle, Lightbulb, Bug, Heart,
} from "lucide-react";

interface ForumPost {
  id: string;
  user_id: string;
  username: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  likes_count: number;
}

interface ForumReply {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

const CATEGORIES = [
  { id: "general", label: "General", icon: MessageCircle, color: "hsl(220 70% 50%)" },
  { id: "game-requests", label: "Game Requests", icon: Gamepad2, color: "hsl(45 90% 50%)" },
  { id: "suggestions", label: "Suggestions", icon: Lightbulb, color: "hsl(160 60% 45%)" },
  { id: "bugs", label: "Bug Reports", icon: Bug, color: "hsl(0 70% 50%)" },
  { id: "off-topic", label: "Off Topic", icon: Heart, color: "hsl(300 60% 55%)" },
];

const FORUM_POSTS_TABLE = "forum_posts" as any;
const FORUM_REPLIES_TABLE = "forum_replies" as any;

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const ForumsPanel = () => {
  const { user, profile, isAdmin } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [activeCategory, setActiveCategory] = useState("general");
  const [activePost, setActivePost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [replyInput, setReplyInput] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from(FORUM_POSTS_TABLE)
      .select("*")
      .eq("category", activeCategory)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setPosts(data as unknown as ForumPost[]);
    setLoading(false);
  };

  const loadReplies = async (postId: string) => {
    const { data } = await supabase
      .from(FORUM_REPLIES_TABLE)
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(100);
    if (data) setReplies(data as unknown as ForumReply[]);
  };

  useEffect(() => {
    loadPosts();
  }, [activeCategory]);

  useEffect(() => {
    if (activePost) loadReplies(activePost.id);
  }, [activePost?.id]);

  const createPost = async () => {
    if (!user || !profile || !newTitle.trim() || !newContent.trim()) return;
    const { error } = await supabase.from(FORUM_POSTS_TABLE).insert({
      user_id: user.id,
      username: profile.username,
      title: newTitle.trim(),
      content: newContent.trim(),
      category: activeCategory,
    });
    if (error) { toast.error("Failed to create post"); return; }
    toast.success("Post created!");
    setNewTitle(""); setNewContent(""); setShowNewPost(false);
    loadPosts();
  };

  const createReply = async () => {
    if (!user || !profile || !activePost || !replyInput.trim()) return;
    const { error } = await supabase.from(FORUM_REPLIES_TABLE).insert({
      post_id: activePost.id,
      user_id: user.id,
      username: profile.username,
      content: replyInput.trim(),
    });
    if (error) { toast.error("Failed to reply"); return; }
    setReplyInput("");
    loadReplies(activePost.id);
  };

  const deletePost = async (postId: string) => {
    await supabase.from(FORUM_POSTS_TABLE).delete().eq("id", postId);
    setActivePost(null);
    loadPosts();
    toast.success("Post deleted");
  };

  const deleteReply = async (replyId: string) => {
    await supabase.from(FORUM_REPLIES_TABLE).delete().eq("id", replyId);
    if (activePost) loadReplies(activePost.id);
  };

  // View a single post + replies
  if (activePost) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button onClick={() => { setActivePost(null); setReplies([]); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Forum
        </button>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-xl font-bold text-foreground">{activePost.title}</h2>
            {(activePost.user_id === user?.id || isAdmin) && (
              <button onClick={() => deletePost(activePost.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            )}
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap mb-4">{activePost.content}</p>
          <p className="text-xs text-muted-foreground">by <strong>{activePost.username}</strong> · {timeAgo(activePost.created_at)}</p>
        </div>

        <h3 className="text-sm font-bold text-foreground mb-3">Replies ({replies.length})</h3>
        <div className="space-y-3 mb-6">
          {replies.map((r) => (
            <div key={r.id} className="bg-muted/50 border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <p className="text-sm text-foreground whitespace-pre-wrap">{r.content}</p>
                {(r.user_id === user?.id || isAdmin) && (
                  <button onClick={() => deleteReply(r.id)} className="p-1 text-muted-foreground hover:text-destructive shrink-0 ml-2"><Trash2 className="w-3 h-3" /></button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">by <strong>{r.username}</strong> · {timeAgo(r.created_at)}</p>
            </div>
          ))}
          {replies.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No replies yet. Be the first!</p>}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={replyInput}
            onChange={(e) => setReplyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createReply()}
            placeholder="Write a reply..."
            className="flex-1 px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          <button onClick={createReply} disabled={!replyInput.trim()} className="p-2.5 rounded-lg gradient-warm-bg text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-primary" /> Forums
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Share your thoughts & request games</p>
        </div>
        <button onClick={() => setShowNewPost(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-warm-bg text-primary-foreground text-sm font-bold hover:opacity-90">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeCategory === cat.id
                ? "gradient-warm-bg text-primary-foreground shadow-md glow-warm"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <cat.icon className="w-3 h-3" /> {cat.label}
          </button>
        ))}
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3">Create New Post</h3>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Post title..."
            className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary mb-3"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={activeCategory === "game-requests" ? "What game would you like added? Include a link if possible..." : "Write your post..."}
            rows={4}
            className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none mb-3"
          />
          <div className="flex gap-2">
            <button onClick={createPost} disabled={!newTitle.trim() || !newContent.trim()} className="px-4 py-2 rounded-lg gradient-warm-bg text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50">Post</button>
            <button onClick={() => { setShowNewPost(false); setNewTitle(""); setNewContent(""); }} className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="text-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No posts yet in this category.</p>
          <p className="text-xs mt-1">Be the first to start a discussion!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <button
              key={post.id}
              onClick={() => setActivePost(post)}
              className="w-full text-left bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all"
            >
              <h3 className="text-sm font-bold text-foreground mb-1">{post.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{post.content}</p>
              <p className="text-xs text-muted-foreground">by <strong>{post.username}</strong> · {timeAgo(post.created_at)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForumsPanel;
