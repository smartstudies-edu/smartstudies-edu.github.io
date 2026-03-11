import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

const COLORS = [
  "hsl(0, 80%, 55%)",
  "hsl(45, 100%, 55%)",
  "hsl(120, 60%, 45%)",
  "hsl(200, 80%, 50%)",
  "hsl(270, 70%, 55%)",
  "hsl(320, 75%, 50%)",
  "hsl(30, 90%, 55%)",
  "hsl(180, 70%, 45%)",
];

const LOGO_W = 150;
const LOGO_H = 80;
const CORNER_TOLERANCE = 5;

const DVDScreensaver = () => {
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  const posRef = useRef({ x: 100, y: 100 });
  const velRef = useRef({ dx: 180, dy: 140 }); // px/s
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef(0);

  const [color, setColor] = useState(COLORS[0]);
  const [bounceCount, setBounceCount] = useState(0);
  const [cornerHits, setCornerHits] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === panelRef.current);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const animate = (now: number) => {
      const container = containerRef.current;
      const logoEl = logoRef.current;
      if (!container || !logoEl) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      if (lastFrameRef.current === 0) lastFrameRef.current = now;
      const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000);
      lastFrameRef.current = now;

      const width = container.clientWidth;
      const height = container.clientHeight;

      let { x, y } = posRef.current;
      let { dx, dy } = velRef.current;

      x += dx * dt;
      y += dy * dt;

      let bounced = false;

      if (x <= 0 || x + LOGO_W >= width) {
        dx = -dx;
        x = x <= 0 ? 0 : Math.max(0, width - LOGO_W);
        bounced = true;
      }

      if (y <= 0 || y + LOGO_H >= height) {
        dy = -dy;
        y = y <= 0 ? 0 : Math.max(0, height - LOGO_H);
        bounced = true;
      }

      if (bounced) {
        setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
        setBounceCount((count) => count + 1);

        const isCorner = (x <= CORNER_TOLERANCE || x + LOGO_W >= width - CORNER_TOLERANCE) &&
          (y <= CORNER_TOLERANCE || y + LOGO_H >= height - CORNER_TOLERANCE);
        if (isCorner) setCornerHits((count) => count + 1);
      }

      posRef.current = { x, y };
      velRef.current = { dx, dy };
      logoEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = 0;
    };
  }, []);

  const toggleFullscreen = async () => {
    const root = panelRef.current;
    if (!root) return;

    if (document.fullscreenElement === root) {
      await document.exitFullscreen();
      return;
    }

    await root.requestFullscreen();
  };

  return (
    <div ref={panelRef} className="h-screen flex flex-col bg-background">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h2 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
          📀 DVD Screensaver
        </h2>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Bounces: {bounceCount}</span>
          <span className={cornerHits > 0 ? "text-primary font-bold" : ""}>
            Corner Hits: {cornerHits} {cornerHits > 0 && "🎉"}
          </span>
          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground inline-flex items-center gap-1"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-black">
        <div
          ref={logoRef}
          className="absolute transition-none select-none"
          style={{
            width: LOGO_W,
            height: LOGO_H,
            transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`,
          }}
        >
          <svg viewBox="0 0 210 107" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
            <text x="105" y="50" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight="700" fontSize="36" fill={color}>
              DVD
            </text>
            <text x="105" y="80" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight="400" fontSize="14" fill={color} opacity="0.7">
              VIDEO
            </text>
            <ellipse cx="105" cy="95" rx="50" ry="5" fill={color} opacity="0.3" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DVDScreensaver;
