import { useMemo, useState } from "react";
import { Globe, ExternalLink, Maximize2, Minimize2, ArrowLeft } from "lucide-react";

const PRIMARY_PROXY_URL = "https://nexthistory.banglaraloprotidin.com/";

const QUICK_LINKS = [
  { name: "Poki", url: "https://www.poki.com" },
  { name: "CrazyGames", url: "https://www.crazygames.com" },
  { name: "CoolMath", url: "https://www.coolmathgames.com" },
  { name: "Now.gg", url: "https://now.gg" },
  { name: "YouTube", url: "https://www.youtube.com" },
  { name: "Reddit", url: "https://www.reddit.com" },
  { name: "Discord", url: "https://discord.com" },
  { name: "Spotify Web", url: "https://open.spotify.com" },
];

interface ProxyBrowserProps {
  initialUrl?: string;
  homeUrl?: string;
  fallbackProxyUrl?: string; // kept for compatibility (currently unused)
  title?: string;
  subtitle?: string;
}

const ProxyBrowser = ({
  initialUrl,
  homeUrl,
  title = "SmartBrowse",
  subtitle = "Browse through Shadow Proxy — network-friendly in-school access",
}: ProxyBrowserProps) => {
  const [mode, setMode] = useState<"home" | "proxy">("proxy");
  const [fullscreen, setFullscreen] = useState(false);

  const primaryProxy = useMemo(() => homeUrl || initialUrl || PRIMARY_PROXY_URL, [homeUrl, initialUrl]);
  const proxyUrl = primaryProxy;

  if (mode === "proxy") {
    return (
      <div className={`flex flex-col ${fullscreen ? "fixed inset-0 z-50 bg-background" : "h-screen"}`}>
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/90 backdrop-blur-sm shrink-0">
          <button
            onClick={() => setMode("home")}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground flex-1">{title}</span>
          <span className="text-[10px] text-muted-foreground hidden sm:block">Shadow Proxy</span>
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
        <iframe
          src={proxyUrl}
          className="flex-1 w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
          allow="fullscreen"
          title="Shadow Proxy"
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" /> {title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>

      <button
        onClick={() => setMode("proxy")}
        className="w-full p-5 gradient-warm-bg text-primary-foreground rounded-2xl text-center font-bold text-lg hover:opacity-90 transition-opacity shadow-lg"
      >
        🌐 Open Shadow Proxy
      </button>

      <section>
        <h3 className="text-sm font-semibold text-foreground mb-2">⚡ Quick Links</h3>
        <p className="text-[10px] text-muted-foreground mb-3">⚠️ If links are blocked, open them through the proxy above.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUICK_LINKS.map((link) => (
            <button
              key={link.url}
              onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
              className="flex items-center justify-center gap-2 p-3 bg-card border border-border rounded-xl text-sm font-medium text-foreground hover:border-primary/40 hover:bg-muted/50 transition-all"
            >
              {link.name}
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ProxyBrowser;
