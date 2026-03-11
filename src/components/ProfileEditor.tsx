import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Pencil, Check, X, User } from "lucide-react";

const AVATAR_OPTIONS = ["😎","🤓","👾","🎮","🐱","🦊","🐸","🌟","🔥","💎","🎯","🏆","🦄","🐉","👻","🤖","🧠","💀","🎭","🐧","🦈","🐺","🦅","🐼","🌈","⚡","🍀","🎵","🛸","🌙","🎪","🧊","🫠","🥷","🤡","👽"];

const ProfileEditor = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name || "");
    setAvatarUrl(profile?.avatar_url || "");
  }, [profile?.display_name, profile?.avatar_url]);

  const save = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl || null,
      })
      .eq("user_id", user.id);

    if (error) toast.error("Failed to update profile");
    else {
      await refreshProfile();
      toast.success("Profile updated!");
      setEditing(false);
    }
    setSaving(false);
  };

  if (!editing) {
    return (
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Profile
        </h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-2xl border-2 border-border">
            {profile?.avatar_url || "😎"}
          </div>
          <div>
            <p className="text-foreground font-bold">{profile?.display_name || profile?.username}</p>
            {profile?.display_name && profile.display_name !== profile.username && (
              <p className="text-xs text-muted-foreground">@{profile?.username}</p>
            )}
            {(!profile?.display_name || profile.display_name === profile.username) && (
              <p className="text-xs text-muted-foreground">@{profile?.username}</p>
            )}
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground hover:text-foreground transition-all">
          <Pencil className="w-3 h-3" /> Edit Profile
        </button>
      </section>
    );
  }

  return (
    <section className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Pencil className="w-4 h-4 text-primary" /> Edit Profile
      </h3>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Avatar</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setAvatarUrl(emoji)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                  avatarUrl === emoji ? "border-primary bg-primary/10 scale-110" : "border-border hover:border-muted-foreground"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={profile?.username || "Your name"}
            maxLength={30}
            className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-warm-bg text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-50">
            <Check className="w-3 h-3" /> {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-muted text-muted-foreground text-xs hover:text-foreground">
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProfileEditor;
