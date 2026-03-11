import { Circle } from "lucide-react";

interface OnlineUsersPanelProps {
  profiles: any[];
  onlineUserIds: string[];
}

export default function OnlineUsersPanel({ profiles, onlineUserIds }: OnlineUsersPanelProps) {
  const online = profiles.filter((p) => onlineUserIds.includes(p.user_id));
  const offline = profiles.filter((p) => !onlineUserIds.includes(p.user_id));

  return (
    <div className="w-56 bg-card border-l border-border h-full overflow-y-auto py-3 hidden lg:block">
      {online.length > 0 && (
        <>
          <div className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Online — {online.length}
          </div>
          {online.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-4 py-1 hover:bg-accent/30 rounded-md transition mx-1">
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {(p.display_name || p.username).charAt(0).toUpperCase()}
                </div>
                <Circle className="w-2.5 h-2.5 text-green-400 fill-green-400 absolute -bottom-0.5 -right-0.5" />
              </div>
              <span className="text-sm text-foreground truncate">{p.display_name || p.username}</span>
            </div>
          ))}
        </>
      )}
      {offline.length > 0 && (
        <>
          <div className="px-4 py-1.5 mt-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Offline — {offline.length}
          </div>
          {offline.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-4 py-1 opacity-50">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                {(p.display_name || p.username).charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-muted-foreground truncate">{p.display_name || p.username}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
