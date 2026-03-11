import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield,
  Ban,
  Users,
  Search,
  Check,
  Clock,
  Edit2,
  ChevronDown,
  UserCog,
  Plus,
  Trash2,
  ScrollText,
  Link2,
} from "lucide-react";
import LinksVault from "@/components/LinksVault";

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  is_banned: boolean;
  ban_reason: string | null;
  timeout_until: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

const TIMEOUT_OPTIONS = [
  { label: "5 minutes", ms: 5 * 60 * 1000 },
  { label: "30 minutes", ms: 30 * 60 * 1000 },
  { label: "1 hour", ms: 60 * 60 * 1000 },
  { label: "6 hours", ms: 6 * 60 * 60 * 1000 },
  { label: "24 hours", ms: 24 * 60 * 60 * 1000 },
  { label: "7 days", ms: 7 * 24 * 60 * 60 * 1000 },
];

interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  type: string;
  sort_order: number;
  created_at?: string;
}

interface ChangelogChange {
  id: string;
  entry_id: string;
  kind: string;
  text: string;
  sort_order: number;
}

const CHANGE_KINDS = ["feat", "fix", "improve", "misc"];
const KIND_LABELS: Record<string, string> = { feat: "New", fix: "Fix", improve: "Improved", misc: "Misc" };

const parseVersion = (raw: string) =>
  raw
    .replace(/^v/i, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);

const compareVersionDesc = (a: string, b: string) => {
  const av = parseVersion(a);
  const bv = parseVersion(b);
  const maxLen = Math.max(av.length, bv.length);

  for (let i = 0; i < maxLen; i += 1) {
    const left = av[i] ?? 0;
    const right = bv[i] ?? 0;
    if (left !== right) return right - left;
  }
  return 0;
};

const sortChangelogEntries = (entries: ChangelogEntry[]) =>
  [...entries].sort((a, b) => {
    const byVersion = compareVersionDesc(a.version, b.version);
    if (byVersion !== 0) return byVersion;
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });

const ModPanel = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState("");

  // Ban state
  const [banTarget, setBanTarget] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");

  // Timeout state
  const [timeoutTarget, setTimeoutTarget] = useState<string | null>(null);

  // Username change state
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState("");

  // Role change state
  const [roleTarget, setRoleTarget] = useState<string | null>(null);

  // Changelog state
  const [clEntries, setClEntries] = useState<ChangelogEntry[]>([]);
  const [clChanges, setClChanges] = useState<ChangelogChange[]>([]);
  const [changelogLoading, setChangelogLoading] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showLinksVault, setShowLinksVault] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newType, setNewType] = useState("release");
  const [addChangeEntry, setAddChangeEntry] = useState<string | null>(null);
  const [addChangeKind, setAddChangeKind] = useState("feat");
  const [addChangeText, setAddChangeText] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
    loadChangelog();
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    const { data: profilesData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: rolesData } = await supabase.from("user_roles").select("*");
    if (profilesData) setUsers(profilesData as unknown as UserProfile[]);
    if (rolesData) setRoles(rolesData as UserRole[]);
    setLoading(false);
  };

  const loadChangelog = async () => {
    setChangelogLoading(true);

    const [entriesResponse, changesResponse] = await Promise.all([
      supabase.from("changelog_entries" as any).select("*"),
      supabase.from("changelog_changes" as any).select("*").order("sort_order", { ascending: true }),
    ]);

    if (entriesResponse.error || changesResponse.error) {
      showStatus("Failed to refresh changelog");
      setChangelogLoading(false);
      return;
    }

    const entries = (entriesResponse.data || []) as unknown as ChangelogEntry[];
    const changes = (changesResponse.data || []) as unknown as ChangelogChange[];
    setClEntries(sortChangelogEntries(entries));
    setClChanges(changes);
    setChangelogLoading(false);
  };

  const showStatus = (msg: string) => {
    setActionStatus(msg);
    setTimeout(() => setActionStatus(""), 3000);
  };

  const banUser = async (userId: string) => {
    await supabase
      .from("profiles")
      .update({ is_banned: true, ban_reason: banReason || "Banned by admin" } as any)
      .eq("user_id", userId);
    setBanTarget(null);
    setBanReason("");
    showStatus("User banned");
    loadUsers();
  };

  const unbanUser = async (userId: string) => {
    await supabase.from("profiles").update({ is_banned: false, ban_reason: null } as any).eq("user_id", userId);
    showStatus("User unbanned");
    loadUsers();
  };

  const timeoutUser = async (userId: string, durationMs: number) => {
    const until = new Date(Date.now() + durationMs).toISOString();
    await supabase.from("profiles").update({ timeout_until: until } as any).eq("user_id", userId);
    setTimeoutTarget(null);
    showStatus("User timed out");
    loadUsers();
  };

  const removeTimeout = async (userId: string) => {
    await supabase.from("profiles").update({ timeout_until: null } as any).eq("user_id", userId);
    showStatus("Timeout removed");
    loadUsers();
  };

  const changeUsername = async (userId: string) => {
    if (!newUsername.trim()) return;
    await supabase
      .from("profiles")
      .update({ username: newUsername.trim(), display_name: newUsername.trim() } as any)
      .eq("user_id", userId);
    setEditTarget(null);
    setNewUsername("");
    showStatus("Username changed");
    loadUsers();
  };

  const setUserRole = async (userId: string, newRole: "admin" | "moderator" | "user") => {
    // Prevent self-demotion
    if (userId === user?.id && newRole !== "admin") {
      showStatus("You can't remove your own admin role!");
      setRoleTarget(null);
      return;
    }
    // Delete existing role, then insert new one
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    setRoleTarget(null);
    showStatus(`Role changed to ${newRole}`);
    loadUsers();
  };

  const deleteAccount = async (targetUserId: string, username: string) => {
    if (!isAdmin) return;
    if (!user) {
      showStatus("You must be logged in");
      return;
    }
    if (targetUserId === user.id) {
      showStatus("You can't delete your own account here");
      return;
    }

    const ok = window.confirm(`Delete account @${username}? This is permanent.`);
    if (!ok) return;

    const { error } = await supabase.functions.invoke("admin-delete-user", {
      body: { user_id: targetUserId },
    });

    if (error) {
      showStatus("Delete failed");
      return;
    }

    showStatus("Account deleted");
    loadUsers();
  };

  const getUserRole = (userId: string) => {
    const role = roles.find((r) => r.user_id === userId);
    return role?.role || "user";
  };

  const isTimedOut = (u: UserProfile) => u.timeout_until && new Date(u.timeout_until) > new Date();

  const filteredUsers = users.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()));

  if (!isAdmin) return null;

  const addChangelogEntry = async () => {
    if (!newVersion.trim() || !newDate.trim()) return;

    const nextSortOrder = clEntries.reduce((max, entry) => Math.max(max, entry.sort_order), -1) + 1;
    const { data, error } = await supabase
      .from("changelog_entries" as any)
      .insert({
        version: newVersion.trim(),
        date: newDate.trim(),
        type: newType,
        sort_order: nextSortOrder,
      } as any)
      .select("*")
      .single();

    if (error) {
      showStatus("Failed to add changelog entry");
      return;
    }

    const createdEntry = data as unknown as ChangelogEntry;
    setClEntries((prev) => sortChangelogEntries([...prev, createdEntry]));
    setNewVersion("");
    setNewDate("");
    setNewType("release");
    showStatus("Changelog entry added");
  };

  const deleteChangelogEntry = async (id: string) => {
    const { error: changesError } = await supabase.from("changelog_changes" as any).delete().eq("entry_id", id);
    if (changesError) {
      showStatus("Failed to delete entry changes");
      return;
    }

    const { error } = await supabase.from("changelog_entries" as any).delete().eq("id", id);
    if (error) {
      showStatus("Failed to delete changelog entry");
      return;
    }

    setClEntries((prev) => prev.filter((entry) => entry.id !== id));
    setClChanges((prev) => prev.filter((change) => change.entry_id !== id));
    showStatus("Changelog entry deleted");
  };

  const addChangelogChange = async () => {
    if (!addChangeEntry || !addChangeText.trim()) return;

    const entryChanges = clChanges.filter((c) => c.entry_id === addChangeEntry);
    const nextSortOrder = entryChanges.reduce((max, change) => Math.max(max, change.sort_order), -1) + 1;

    const { data, error } = await supabase
      .from("changelog_changes" as any)
      .insert({
        entry_id: addChangeEntry,
        kind: addChangeKind,
        text: addChangeText.trim(),
        sort_order: nextSortOrder,
      } as any)
      .select("*")
      .single();

    if (error) {
      showStatus("Failed to add changelog change");
      return;
    }

    const createdChange = data as unknown as ChangelogChange;
    setClChanges((prev) => [...prev, createdChange]);
    setAddChangeEntry(null);
    setAddChangeText("");
    setAddChangeKind("feat");
    showStatus("Change added");
  };

  const deleteChangelogChange = async (id: string) => {
    const { error } = await supabase.from("changelog_changes" as any).delete().eq("id", id);
    if (error) {
      showStatus("Failed to delete change");
      return;
    }

    setClChanges((prev) => prev.filter((change) => change.id !== id));
    showStatus("Change deleted");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Mod Panel
        </h2>
        <p className="text-sm text-muted-foreground">Manage users, roles, bans, timeouts, and usernames</p>
      </div>

      {actionStatus && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {actionStatus}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <Users className="w-5 h-5 text-primary mb-1" />
          <p className="text-2xl font-bold text-foreground">{users.length}</p>
          <p className="text-xs text-muted-foreground">Total Users</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <Ban className="w-5 h-5 text-destructive mb-1" />
          <p className="text-2xl font-bold text-foreground">{users.filter((u) => u.is_banned).length}</p>
          <p className="text-xs text-muted-foreground">Banned</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <Clock className="w-5 h-5 text-yellow-500 mb-1" />
          <p className="text-2xl font-bold text-foreground">{users.filter((u) => isTimedOut(u)).length}</p>
          <p className="text-xs text-muted-foreground">Timed Out</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <Shield className="w-5 h-5 text-primary mb-1" />
          <p className="text-2xl font-bold text-foreground">{roles.filter((r) => r.role === "admin").length}</p>
          <p className="text-xs text-muted-foreground">Admins</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
        />
      </div>

      {/* Ban Dialog */}
      {banTarget && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
          <h4 className="text-sm font-semibold text-destructive mb-2">
            Ban User: {users.find((u) => u.user_id === banTarget)?.username}
          </h4>
          <input
            type="text"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Ban reason (optional)..."
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={() => banUser(banTarget)}
              className="px-4 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium"
            >
              Confirm Ban
            </button>
            <button onClick={() => setBanTarget(null)} className="px-4 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Timeout Dialog */}
      {timeoutTarget && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Timeout: {users.find((u) => u.user_id === timeoutTarget)?.username}
          </h4>
          <div className="flex flex-wrap gap-2">
            {TIMEOUT_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => timeoutUser(timeoutTarget, opt.ms)}
                className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-300 text-xs font-medium hover:bg-yellow-500/30 transition-colors"
              >
                {opt.label}
              </button>
            ))}
            <button onClick={() => setTimeoutTarget(null)} className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Username Dialog */}
      {editTarget && (
        <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
          <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
            <Edit2 className="w-4 h-4" /> Change Username: {users.find((u) => u.user_id === editTarget)?.username}
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="New username..."
              className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm"
            />
            <button onClick={() => changeUsername(editTarget)} className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              Save
            </button>
            <button
              onClick={() => {
                setEditTarget(null);
                setNewUsername("");
              }}
              className="px-4 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Role Change Dialog */}
      {roleTarget && (
        <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
          <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
            <UserCog className="w-4 h-4" /> Change Role: {users.find((u) => u.user_id === roleTarget)?.username} (current: {getUserRole(roleTarget)})
          </h4>
          <div className="flex gap-2">
            {(["admin", "moderator", "user"] as const).map((role) => (
              <button
                key={role}
                onClick={() => setUserRole(roleTarget, role)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  getUserRole(roleTarget) === role ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
            <button onClick={() => setRoleTarget(null)} className="px-4 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* User List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground font-medium p-3">Username</th>
                  <th className="text-left text-xs text-muted-foreground font-medium p-3">Role</th>
                  <th className="text-left text-xs text-muted-foreground font-medium p-3">Status</th>
                  <th className="text-right text-xs text-muted-foreground font-medium p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="p-3">
                      <p className="text-sm font-medium text-foreground">{u.username}</p>
                      {u.display_name && u.display_name !== u.username && <p className="text-xs text-muted-foreground">{u.display_name}</p>}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          getUserRole(u.user_id) === "admin"
                            ? "bg-primary/15 text-primary"
                            : getUserRole(u.user_id) === "moderator"
                              ? "bg-yellow-500/15 text-yellow-400"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {getUserRole(u.user_id)}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.is_banned ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">Banned</span>
                      ) : isTimedOut(u) ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-medium">Timed Out</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium">Active</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 justify-end flex-wrap">
                        <button
                          onClick={() => setRoleTarget(u.user_id)}
                          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          title="Change role"
                        >
                          <UserCog className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setEditTarget(u.user_id);
                            setNewUsername(u.username);
                          }}
                          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          title="Change username"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {isTimedOut(u) ? (
                          <button
                            onClick={() => removeTimeout(u.user_id)}
                            className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                          >
                            Untimeout
                          </button>
                        ) : (
                          <button
                            onClick={() => setTimeoutTarget(u.user_id)}
                            className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                            title="Timeout"
                          >
                            <Clock className="w-3 h-3" />
                          </button>
                        )}
                        {u.is_banned ? (
                          <button
                            onClick={() => unbanUser(u.user_id)}
                            className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => setBanTarget(u.user_id)}
                            className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            title="Ban"
                          >
                            <Ban className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteAccount(u.user_id, u.username)}
                          className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          title="Delete account"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Changelog Management */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setShowChangelog(!showChangelog)}
            className="flex items-center gap-2 text-base font-display font-bold text-foreground"
          >
            <ScrollText className="w-5 h-5 text-primary" /> Changelog Manager
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${showChangelog ? "rotate-180" : ""}`}
            />
          </button>
          {showChangelog && (
            <button
              onClick={loadChangelog}
              className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
              disabled={changelogLoading}
            >
              {changelogLoading ? "Refreshing..." : "Refresh"}
            </button>
          )}
        </div>

        {showChangelog && (
          <div className="space-y-4">
            {changelogLoading && <p className="text-xs text-muted-foreground">Refreshing changelog...</p>}
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Add Version
              </h4>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="Version (e.g. 1.6.0)"
                  className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm w-36"
                />
                <input
                  type="text"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  placeholder="Date (e.g. Mar 10, 2026)"
                  className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm w-48"
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm"
                >
                  <option value="release">Release</option>
                  <option value="upcoming">Upcoming</option>
                </select>
                <button
                  onClick={addChangelogEntry}
                  disabled={changelogLoading}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {changelogLoading ? "Saving..." : "Add"}
                </button>
              </div>
            </div>

            {/* Existing entries */}
            {clEntries.map((entry) => {
              const entryChanges = clChanges.filter((c) => c.entry_id === entry.id);
              return (
                <div
                  key={entry.id}
                  className={`border rounded-xl p-4 ${entry.type === "upcoming" ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {entry.type === "upcoming" && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded gradient-warm-bg text-primary-foreground">
                          Soon
                        </span>
                      )}
                      <span className="text-sm font-semibold text-foreground">v{entry.version}</span>
                      <span className="text-xs text-muted-foreground">{entry.date}</span>
                    </div>
                    <button
                      onClick={() => deleteChangelogEntry(entry.id)}
                      className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete version"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Changes list */}
                  <div className="space-y-1.5 mb-3">
                    {entryChanges.map((change) => (
                      <div key={change.id} className="flex items-center gap-2 text-xs group">
                        <span
                          className={`px-1.5 py-0.5 rounded font-medium ${
                            change.kind === "feat"
                              ? "text-green-400 bg-green-400/10"
                              : change.kind === "fix"
                                ? "text-red-400 bg-red-400/10"
                                : change.kind === "improve"
                                  ? "text-blue-400 bg-blue-400/10"
                                  : "text-muted-foreground bg-muted"
                          }`}
                        >
                          {KIND_LABELS[change.kind] || change.kind}
                        </span>
                        <span className="text-foreground/80 flex-1">{change.text}</span>
                        <button
                          onClick={() => deleteChangelogChange(change.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-destructive hover:bg-destructive/10 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add change */}
                  {addChangeEntry === entry.id ? (
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={addChangeKind}
                        onChange={(e) => setAddChangeKind(e.target.value)}
                        className="px-2 py-1.5 bg-muted border border-border rounded-lg text-foreground text-xs"
                      >
                        {CHANGE_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {KIND_LABELS[k]}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={addChangeText}
                        onChange={(e) => setAddChangeText(e.target.value)}
                        placeholder="Change description..."
                        className="flex-1 min-w-[200px] px-3 py-1.5 bg-muted border border-border rounded-lg text-foreground text-xs"
                        onKeyDown={(e) => e.key === "Enter" && addChangelogChange()}
                      />
                      <button onClick={addChangelogChange} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setAddChangeEntry(null);
                          setAddChangeText("");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setAddChangeEntry(entry.id)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <Plus className="w-3 h-3" /> Add change
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Links Vault */}
      <div className="mt-8">
        <button
          onClick={() => setShowLinksVault(!showLinksVault)}
          className="flex items-center gap-2 text-base font-display font-bold text-foreground mb-4"
        >
          <Link2 className="w-5 h-5 text-primary" /> Links Vault
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showLinksVault ? "rotate-180" : ""}`} />
        </button>
        {showLinksVault && <LinksVault />}
      </div>
    </div>
  );
};

export default ModPanel;
