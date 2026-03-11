import { useEffect, useRef, useState } from "react";

interface MouseGlowProps {
  color?: string;
  intensity?: number;
  enabled?: boolean;
  lite?: boolean;
}

const getInitialPoint = () => {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
};

const MouseGlow = ({ color = "45 100% 58%", intensity = 60, enabled = true, lite = false }: MouseGlowProps) => {
  const initial = getInitialPoint();
  const [hasMoved, setHasMoved] = useState(false);
  const [canRender, setCanRender] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const targetRef = useRef({ ...initial });
  const leadRef = useRef({ ...initial });
  const trailRef = useRef({ ...initial });
  const hasMovedRef = useRef(false);
  const lastMoveRef = useRef(0);

  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef(0);

  const leadElRef = useRef<HTMLDivElement>(null);
  const trailElRef = useRef<HTMLDivElement>(null);
  const coreElRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const finePointerMedia = window.matchMedia("(any-pointer: fine)");
    const reduceMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncCapabilities = () => {
      // Render on most screens (Chromebooks/tablets included), but stay conservative on tiny devices.
      const isLargeEnough = window.innerWidth >= 520;
      setCanRender(finePointerMedia.matches || isLargeEnough);
      setReducedMotion(reduceMotionMedia.matches);
    };

    syncCapabilities();

    finePointerMedia.addEventListener("change", syncCapabilities);
    reduceMotionMedia.addEventListener("change", syncCapabilities);
    window.addEventListener("resize", syncCapabilities, { passive: true });

    return () => {
      finePointerMedia.removeEventListener("change", syncCapabilities);
      reduceMotionMedia.removeEventListener("change", syncCapabilities);
      window.removeEventListener("resize", syncCapabilities);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !canRender || typeof window === "undefined") return;

    const move = (x: number, y: number) => {
      targetRef.current.x = x;
      targetRef.current.y = y;
      lastMoveRef.current = performance.now();

      if (!hasMovedRef.current) {
        hasMovedRef.current = true;
        setHasMoved(true);
      }
    };

    const onPointerMove = (event: PointerEvent) => move(event.clientX, event.clientY);

    const animate = (now: number) => {
      if (document.hidden) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const frameBudget = reducedMotion || lite ? 46 : 22;
      if (now - lastFrameRef.current < frameBudget) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameRef.current = now;

      const target = targetRef.current;
      const lead = leadRef.current;
      const trail = trailRef.current;

      const idleFor = now - lastMoveRef.current;
      if (!reducedMotion && !lite && idleFor > 1800) {
        const drift = now / 1000;
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        target.x = cx + Math.sin(drift * 0.65) * 22;
        target.y = cy + Math.cos(drift * 0.5) * 16;
      }

      if (reducedMotion) {
        lead.x = target.x;
        lead.y = target.y;
        trail.x = target.x;
        trail.y = target.y;
      } else {
        const leadK = lite ? 0.18 : 0.28;
        const trailK = lite ? 0.14 : 0.22;
        lead.x += (target.x - lead.x) * leadK;
        lead.y += (target.y - lead.y) * leadK;
        trail.x += (lead.x - trail.x) * trailK;
        trail.y += (lead.y - trail.y) * trailK;
      }

      if (leadElRef.current) {
        leadElRef.current.style.transform = `translate3d(${lead.x - 118}px, ${lead.y - 118}px, 0)`;
      }
      if (trailElRef.current) {
        trailElRef.current.style.transform = `translate3d(${trail.x - 82}px, ${trail.y - 82}px, 0)`;
      }
      if (coreElRef.current) {
        coreElRef.current.style.transform = `translate3d(${lead.x - 5}px, ${lead.y - 5}px, 0)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    const bootstrapTimeout = window.setTimeout(() => {
      if (!hasMovedRef.current) {
        hasMovedRef.current = true;
        setHasMoved(true);
      }
    }, 180);

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    lastMoveRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.clearTimeout(bootstrapTimeout);
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, canRender, reducedMotion, lite]);

  if (!enabled || !canRender) return null;

  const leadOpacity = Math.min(0.62, 0.14 + (intensity / 100) * 0.42);
  const trailOpacity = Math.min(0.34, 0.06 + (intensity / 100) * 0.24);

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[80] overflow-hidden transition-opacity duration-150 ${hasMoved ? "opacity-100" : "opacity-0"}`}
      style={{ mixBlendMode: reducedMotion || lite ? "normal" : "screen" }}
      aria-hidden
    >
      <div
        ref={leadElRef}
        className="absolute rounded-full will-change-transform"
        style={{
          width: 236,
          height: 236,
          background: `radial-gradient(circle, hsl(${color} / ${leadOpacity}) 0%, hsl(${color} / ${leadOpacity * 0.34}) 44%, transparent 72%)`,
          filter: lite ? "blur(3px)" : "blur(2px)",
        }}
      />
      <div
        ref={trailElRef}
        className="absolute rounded-full will-change-transform"
        style={{
          width: 164,
          height: 164,
          background: `radial-gradient(circle, hsl(${color} / ${trailOpacity}) 0%, transparent 72%)`,
        }}
      />
      <div
        ref={coreElRef}
        className="absolute rounded-full will-change-transform"
        style={{ width: 10, height: 10, background: `hsl(${color})`, boxShadow: `0 0 14px hsl(${color} / 0.85)` }}
      />
    </div>
  );
};

export default MouseGlow;

