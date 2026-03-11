import { useState, useEffect } from "react";
import { ArrowLeft, Maximize, Minimize, RotateCw, ExternalLink } from "lucide-react";
import type { Game } from "@/data/games";

interface GamePlayerProps {
  game: Game;
  onClose: () => void;
}

const GamePlayer = ({ game, onClose }: GamePlayerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  useEffect(() => {
    const hosts = [
      "https://hubbleplay.github.io",
      "https://k-12-learning-hub.onrender.com",
      "https://fivenightsatepsteins.github.io",
      "https://freedomgamingzone.github.io",
    ];
    const links = hosts.map((href) => {
      const el = document.createElement("link");
      el.rel = "preconnect";
      el.href = href;
      document.head.appendChild(el);
      return el;
    });

    return () => {
      links.forEach((el) => {
        if (document.head.contains(el)) document.head.removeChild(el);
      });
    };
  }, []);

  const sandboxValue = "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-top-navigation-by-user-activation allow-pointer-lock allow-downloads allow-storage-access-by-user-activation";

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">

      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h2 className="font-display text-sm font-semibold text-foreground">{game.title}</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(game.url, "_blank", "noopener,noreferrer")}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setLoading(true); setFrameKey((k) => k + 1); }}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Reload"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background gap-3">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading {game.title}...</p>
          </div>
        )}
        <iframe
          key={`${game.id}-${frameKey}`}
          src={game.url}
          className="w-full h-full border-0"
          title={game.title}
          allow="fullscreen; autoplay; clipboard-write; gamepad"
          sandbox={sandboxValue}
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
};

export default GamePlayer;
