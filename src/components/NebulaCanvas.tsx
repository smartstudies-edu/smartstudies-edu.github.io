import { useEffect, useMemo, useRef } from "react";

interface NebulaCanvasProps {
  enabled?: boolean;
  intensity?: number;
  colors: string[];
  lite?: boolean;
}

const parseHSL = (hsl: string) => {
  const p = hsl.match(/(\d+)\s+(\d+)%?\s+(\d+)%?/);
  if (!p) return { h: 210, s: 70, l: 55 };
  return { h: +p[1], s: +p[2], l: +p[3] };
};

const toHex = ({ h, s, l }: { h: number; s: number; l: number }) => {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const c = light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

type VantaCloudsInstance = {
  destroy?: () => void;
  setOptions?: (options: Record<string, unknown>) => void;
};

const NebulaCanvas = ({
  enabled = true,
  intensity = 70,
  colors,
  lite = false,
}: NebulaCanvasProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaInstanceRef = useRef<VantaCloudsInstance | null>(null);
  const intensityRef = useRef(intensity);
  const liteRef = useRef(lite);
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const mouseSmoothRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const palette = useMemo(() => colors.map(parseHSL), [colors.join("|")]);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    liteRef.current = lite;
  }, [lite]);

  useEffect(() => {
    if (!enabled || !vantaRef.current) return;

    let mounted = true;

    const init = async () => {
      const [{ default: CLOUDS }, THREE] = await Promise.all([
        import("vanta/dist/vanta.clouds.min.js"),
        import("three"),
      ]);

      if (!mounted || !vantaRef.current) return;

      const p0 = palette[0] ?? { h: 210, s: 70, l: 55 };
      const p1 = palette[1] ?? p0;
      const p2 = palette[2] ?? p1;

      const int = intensityRef.current / 100;
      const liteFactor = liteRef.current ? 0.45 : 1;
      const speed = (0.4 + int * 1.4) * liteFactor;
      const cloudScale = 0.8 + int * (liteRef.current ? 0.75 : 1.8);
      const cloudShadow = 0.5 + int * (liteRef.current ? 0.5 : 1.1);

      vantaInstanceRef.current = CLOUDS({
        el: vantaRef.current,
        THREE,
        mouseControls: false,
        touchControls: false,
        gyroControls: false,
        backgroundColor: toHex({ h: p0.h, s: p0.s * 0.35, l: Math.max(8, p0.l * 0.18) }),
        skyColor: toHex({ h: p0.h, s: p0.s, l: Math.min(90, p0.l + 20) }),
        cloudColor: toHex({ h: p1.h, s: p1.s, l: Math.min(92, p1.l + 26) }),
        cloudShadowColor: toHex({ h: p2.h, s: p2.s * 0.9, l: Math.max(12, p2.l - 12) }),
        sunColor: toHex({ h: p0.h, s: Math.min(100, p0.s + 8), l: Math.min(95, p0.l + 24) }),
        sunGlareColor: toHex({ h: p1.h, s: Math.min(100, p1.s + 5), l: Math.min(98, p1.l + 30) }),
        speed,
        cloudScale,
        cloudShadow,
      }) as VantaCloudsInstance;
    };

    init();

    return () => {
      mounted = false;
      vantaInstanceRef.current?.destroy?.();
      vantaInstanceRef.current = null;
    };
  }, [enabled, palette]);

  useEffect(() => {
    if (!enabled || !hostRef.current) return;

    const onMove = (e: PointerEvent) => {
      mouseTargetRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    const tick = () => {
      const t = mouseTargetRef.current;
      const s = mouseSmoothRef.current;
      const easing = liteRef.current ? 0.045 : 0.08;
      s.x += (t.x - s.x) * easing;
      s.y += (t.y - s.y) * easing;

      const int = intensityRef.current / 100;
      const depth = liteRef.current ? 8 + int * 14 : 16 + int * 44;
      const rotate = liteRef.current ? 0.45 + int * 0.8 : 1 + int * 2.2;

      if (hostRef.current) {
        hostRef.current.style.transform = `translate3d(${(-s.x * depth).toFixed(2)}px, ${(-s.y * depth).toFixed(2)}px, 0) rotateX(${(s.y * rotate).toFixed(2)}deg) rotateY(${(-s.x * rotate).toFixed(2)}deg) scale(1.1)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (hostRef.current) hostRef.current.style.transform = "";
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
      <div ref={hostRef} className="absolute -inset-[8%] will-change-transform [transform-style:preserve-3d]">
        <div ref={vantaRef} className="absolute inset-0" />
      </div>
    </div>
  );
};

export default NebulaCanvas;
