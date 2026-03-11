import { useState, useEffect } from "react";

import { openInAboutBlank, openInBlob } from "@/lib/cloaking";
import { CLOAK_PRESETS } from "@/lib/cloakPresets";
import { toast } from "sonner";
import ProfileEditor from "@/components/ProfileEditor";
import { Switch } from "@/components/ui/switch";
import {
  Globe, Eye, Palette, Monitor, BookOpen,
  Check, RotateCcw, Paintbrush, Layers, Sparkles, MousePointer, Gauge,
  Bell, Smartphone,
} from "lucide-react";

const CLOUD_COLORS = [
  { name: "Gold", hsl: "45 100% 58%" },
  { name: "Violet", hsl: "270 70% 55%" },
  { name: "Cyan", hsl: "190 90% 50%" },
  { name: "Rose", hsl: "340 80% 55%" },
  { name: "Emerald", hsl: "160 60% 45%" },
  { name: "Blue", hsl: "220 80% 55%" },
  { name: "Coral", hsl: "16 90% 58%" },
  { name: "Lavender", hsl: "260 60% 68%" },
  { name: "Mint", hsl: "170 70% 50%" },
  { name: "Amber", hsl: "38 95% 50%" },
  { name: "Sakura", hsl: "330 65% 65%" },
  { name: "Arctic", hsl: "200 80% 60%" },
];

const AMBIENT_THEMES = [
  { name: "Default", desc: "Matches your accent color", colors: ["🟡", "🟠"] },
  { name: "Ocean", desc: "Deep blue & teal waves", colors: ["🔵", "🌊"] },
  { name: "Sunset", desc: "Warm orange & crimson", colors: ["🟠", "🔴"] },
  { name: "Aurora", desc: "Green & purple northern lights", colors: ["🟢", "🟣"] },
  { name: "Neon", desc: "Vibrant pink, cyan & yellow", colors: ["💜", "💛"] },
];

// When a user picks an ambient theme, also align the single-color glow to the theme.
const AMBIENT_THEME_BASE_COLOR: Record<string, string | undefined> = {
  Ocean: "200 85% 50%",
  Sunset: "15 95% 55%",
  Aurora: "180 80% 50%",
  Neon: "300 90% 60%",
};

interface SettingsProps {
  accentColor: string;
  onAccentChange: (color: string) => void;
  performanceMode: boolean;
  onPerformanceModeChange: (enabled: boolean) => void;
}

const ACCENT_PRESETS = [
  { name: "Gold", value: "45 100% 58%" },
  { name: "Cyan", value: "190 90% 50%" },
  { name: "Purple", value: "270 70% 55%" },
  { name: "Rose", value: "340 80% 55%" },
  { name: "Lime", value: "100 70% 45%" },
  { name: "Orange", value: "25 95% 55%" },
  { name: "Sky Blue", value: "205 85% 55%" },
  { name: "Teal", value: "170 65% 45%" },
  { name: "Pink", value: "320 75% 60%" },
  { name: "Crimson", value: "0 80% 50%" },
  { name: "Indigo", value: "240 60% 55%" },
  { name: "Emerald", value: "155 70% 40%" },
];

const BG_PRESETS = [
  { name: "Dark Navy", bg: "230 15% 8%", card: "230 15% 11%", muted: "230 12% 15%", border: "230 12% 18%" },
  { name: "Midnight", bg: "240 20% 5%", card: "240 18% 8%", muted: "240 15% 12%", border: "240 15% 15%" },
  { name: "Charcoal", bg: "220 10% 10%", card: "220 10% 13%", muted: "220 8% 17%", border: "220 8% 20%" },
  { name: "AMOLED", bg: "0 0% 0%", card: "0 0% 5%", muted: "0 0% 10%", border: "0 0% 15%" },
  { name: "Warm Dark", bg: "20 10% 8%", card: "20 10% 11%", muted: "20 8% 15%", border: "20 8% 18%" },
  { name: "Ocean", bg: "210 25% 8%", card: "210 22% 11%", muted: "210 18% 15%", border: "210 18% 18%" },
  { name: "Forest", bg: "155 20% 8%", card: "155 18% 11%", muted: "155 14% 15%", border: "155 14% 18%" },
  { name: "Plum Night", bg: "285 18% 9%", card: "285 16% 12%", muted: "285 12% 16%", border: "285 12% 19%" },
  { name: "Steel", bg: "215 14% 9%", card: "215 12% 12%", muted: "215 10% 16%", border: "215 10% 19%" },
  { name: "Sandstone", bg: "32 14% 10%", card: "32 12% 13%", muted: "32 10% 17%", border: "32 10% 20%" },
];

const PATTERN_PRESETS = [
  { name: "None", className: "" },
  { name: "Dots", className: "pattern-dots" },
  { name: "Grid", className: "pattern-grid" },
  { name: "Diagonal", className: "pattern-diagonal" },
  { name: "Cross", className: "pattern-cross" },
  { name: "Waves", className: "pattern-waves" },
  { name: "Hexagon", className: "pattern-hexagon" },
  { name: "Circuit", className: "pattern-circuit" },
  { name: "Stars", className: "pattern-stars" },
  { name: "Diamond", className: "pattern-diamond" },
  { name: "Noise", className: "pattern-noise" },
  { name: "Aurora", className: "pattern-aurora" },
  { name: "Topography", className: "pattern-topography" },
  { name: "Matrix", className: "pattern-matrix" },
  { name: "Plaid", className: "pattern-plaid" },
  { name: "Ripples", className: "pattern-ripples" },
  { name: "Carbon", className: "pattern-carbon" },
  { name: "Zigzag", className: "pattern-zigzag" },
  { name: "Mesh", className: "pattern-mesh" },
  { name: "Scanlines", className: "pattern-scanlines" },
];


const SettingsPanel = ({ accentColor, onAccentChange, performanceMode, onPerformanceModeChange }: SettingsProps) => {
  
  const [activeCloak, setActiveCloak] = useState(() => localStorage.getItem("ss-cloak") || "Default");
  const [activeBg, setActiveBg] = useState(() => localStorage.getItem("ss-bg-theme") || "Dark Navy");
  const [activePattern, setActivePattern] = useState(() => localStorage.getItem("ss-pattern") || "None");
  const [customHue, setCustomHue] = useState(() => parseInt(accentColor.split(" ")[0]) || 45);

  const [nebulaIntensity, setNebulaIntensity] = useState(
    () => parseInt(localStorage.getItem("ss-nebula-intensity") || "70")
  );
  const [nebulaColor, setNebulaColor] = useState(
    () => localStorage.getItem("ss-nebula-color") || "45 100% 58%"
  );
  const [nebulaEnabled, setNebulaEnabled] = useState(
    () => localStorage.getItem("ss-nebula-enabled") !== "false"
  );
  const [nebulaTheme, setNebulaTheme] = useState(
    () => localStorage.getItem("ss-nebula-theme") || "Default"
  );

  const [mouseGlowEnabled, setMouseGlowEnabled] = useState(() => localStorage.getItem("ss-mouse-glow") !== "false");
  const [mentionSoundEnabled, setMentionSoundEnabled] = useState(() => localStorage.getItem("ss-mention-sound") !== "false");
  const [mentionVibrateEnabled, setMentionVibrateEnabled] = useState(() => localStorage.getItem("ss-mention-vibrate") === "true");

  useEffect(() => {
    localStorage.setItem("ss-mouse-glow", String(mouseGlowEnabled));
    window.dispatchEvent(new CustomEvent("ss-mouse-glow-change", { detail: { enabled: mouseGlowEnabled } }));
  }, [mouseGlowEnabled]);

  useEffect(() => {
    localStorage.setItem("ss-mention-sound", String(mentionSoundEnabled));
    localStorage.setItem("ss-mention-vibrate", String(mentionVibrateEnabled));
    window.dispatchEvent(
      new CustomEvent("ss-mention-prefs-change", {
        detail: { sound: mentionSoundEnabled, vibrate: mentionVibrateEnabled },
      })
    );
  }, [mentionSoundEnabled, mentionVibrateEnabled]);

  // Dispatch nebula settings to window for Dashboard to read
  useEffect(() => {
    localStorage.setItem("ss-nebula-intensity", String(nebulaIntensity));
    localStorage.setItem("ss-nebula-color", nebulaColor);
    localStorage.setItem("ss-nebula-enabled", String(nebulaEnabled));
    localStorage.setItem("ss-nebula-theme", nebulaTheme);
    window.dispatchEvent(new CustomEvent("ss-nebula-change", { detail: { intensity: nebulaIntensity, color: nebulaColor, enabled: nebulaEnabled, theme: nebulaTheme } }));
  }, [nebulaIntensity, nebulaColor, nebulaEnabled, nebulaTheme]);

  const applyCloak = (preset: typeof CLOAK_PRESETS[0]) => {
    setActiveCloak(preset.name);
    localStorage.setItem("ss-cloak", preset.name);
    document.title = preset.title;

    document.querySelectorAll("link[rel*='icon']").forEach((node) => node.remove());
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = preset.favicon || "/favicon.ico";
    document.head.appendChild(link);
  };

  const applyBg = (preset: typeof BG_PRESETS[0]) => {
    setActiveBg(preset.name);
    localStorage.setItem("ss-bg-theme", preset.name);
    const root = document.documentElement;
    root.style.setProperty("--background", preset.bg);
    root.style.setProperty("--card", preset.card);
    root.style.setProperty("--muted", preset.muted);
    root.style.setProperty("--input", preset.muted);
    root.style.setProperty("--border", preset.border);
    root.style.setProperty("--sidebar-background", preset.bg);
    root.style.setProperty("--sidebar-accent", preset.muted);
    root.style.setProperty("--sidebar-border", preset.border);
  };

  const applyPattern = (preset: typeof PATTERN_PRESETS[0]) => {
    setActivePattern(preset.name);
    localStorage.setItem("ss-pattern", preset.name);
    const body = document.body;
    // Remove all pattern classes
    PATTERN_PRESETS.forEach((p) => {
      if (p.className) body.classList.remove(p.className);
    });
    // Add selected
    if (preset.className) body.classList.add(preset.className);
  };

  // Restore on mount
  useEffect(() => {
    const savedCloak = localStorage.getItem("ss-cloak");
    if (savedCloak && savedCloak !== "Default") {
      const preset = CLOAK_PRESETS.find((p) => p.name === savedCloak);
      if (preset) applyCloak(preset);
    }
    const savedBg = localStorage.getItem("ss-bg-theme");
    if (savedBg && savedBg !== "Dark Navy") {
      const preset = BG_PRESETS.find((p) => p.name === savedBg);
      if (preset) applyBg(preset);
    }
    const savedPattern = localStorage.getItem("ss-pattern");
    if (savedPattern && savedPattern !== "None") {
      const preset = PATTERN_PRESETS.find((p) => p.name === savedPattern);
      if (preset) applyPattern(preset);
    }
  }, []);

  const handleAboutBlank = async () => {
    const success = await openInAboutBlank();
    if (success) {
      toast.success("Opened in about:blank! You can close this tab.");
    } else {
      toast.error("Pop-ups are blocked! Enable pop-ups for this site in your browser settings, then try again.", {
        duration: 6000,
      });
    }
  };

  const handleBlob = async () => {
    const success = await openInBlob();
    if (success) {
      toast.success("Opened via blob URL! You can close this tab.");
    } else {
      toast.error("Pop-ups are blocked! Enable pop-ups for this site in your browser settings, then try again.", {
        duration: 6000,
      });
    }
  };

  const handleCustomHue = (hue: number) => {
    setCustomHue(hue);
    onAccentChange(`${hue} 80% 55%`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 overflow-y-auto h-screen pb-24">
      <div>
        <h2 className="text-xl font-display font-bold text-foreground mb-1">Settings</h2>
        <p className="text-sm text-muted-foreground">Customize your SmartStudies experience</p>
      </div>

      {/* Profile */}
      <ProfileEditor />

      {/* Performance Mode */}
      <section className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary" /> Performance Mode
            </h3>
            <p className="text-xs text-muted-foreground">
              Instantly disables heavy effects and lowers animation intensity for smoother performance.
            </p>
          </div>
          <Switch checked={performanceMode} onCheckedChange={onPerformanceModeChange} />
        </div>
      </section>

      {/* Mouse Glow */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          <MousePointer className="w-4 h-4 text-primary" /> Cursor Glow
        </h3>
        <p className="text-xs text-muted-foreground mb-3">Ambient glow that follows your mouse</p>
        <button
          onClick={() => setMouseGlowEnabled(!mouseGlowEnabled)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            mouseGlowEnabled
              ? "gradient-warm-bg text-primary-foreground shadow-md"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {mouseGlowEnabled ? "Enabled" : "Disabled"}
        </button>
      </section>

      {/* Mentions & Notifications */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" /> Mentions & Pings
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Control how @mentions in chat get your attention.
        </p>

        <div className="flex flex-col gap-3 mb-4">
          <button
            onClick={() => setMentionSoundEnabled((v) => !v)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              mentionSoundEnabled
                ? "gradient-warm-bg text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span>Sound alert on new @mentions</span>
            <span className="text-[10px] uppercase tracking-wide">
              {mentionSoundEnabled ? "On" : "Off"}
            </span>
          </button>

          <button
            onClick={() => setMentionVibrateEnabled((v) => !v)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              mentionVibrateEnabled
                ? "gradient-warm-bg text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3 h-3" /> Vibration / haptic tap
            </span>
            <span className="text-[10px] uppercase tracking-wide">
              {mentionVibrateEnabled ? "On" : "Off"}
            </span>
          </button>
        </div>

        <button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("ss-mention-test", {
                detail: { source: "settings" },
              })
            )
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/60 transition-colors"
        >
          <Bell className="w-3 h-3" /> Test mention ping
        </button>
      </section>

      {/* Tab Cloak */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" /> Tab Cloak
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Disguise the browser tab to look like a school site
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CLOAK_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyCloak(preset)}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all text-xs ${
                activeCloak === preset.name
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-muted-foreground bg-muted/50"
              }`}
            >
              <span className="text-base">{preset.icon}</span>
              <span className="text-foreground font-medium truncate">{preset.name}</span>
              {activeCloak === preset.name && <Check className="w-3 h-3 text-primary ml-auto shrink-0" />}
            </button>
          ))}
        </div>
      </section>

      {/* Stealth Mode */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" /> Stealth Mode
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Open SmartStudies in a cloaked tab — URL hides in about:blank or blob.
          <span className="text-primary font-medium"> Pop-ups must be enabled!</span>
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleAboutBlank}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-muted hover:border-primary/50 transition-all text-center"
          >
            <Globe className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-foreground">about:blank</span>
            <span className="text-xs text-muted-foreground">URL shows about:blank</span>
          </button>
          <button
            onClick={handleBlob}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-muted hover:border-primary/50 transition-all text-center"
          >
            <Monitor className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-foreground">Blob URL</span>
            <span className="text-xs text-muted-foreground">URL shows blob:...</span>
          </button>
        </div>
      </section>

      {/* Accent Color */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" /> Accent Color
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Pick a preset or slide for any color</p>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => { onAccentChange(preset.value); setCustomHue(parseInt(preset.value.split(" ")[0])); }}
              className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-xs ${
                accentColor === preset.value
                  ? "border-foreground bg-muted"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <div className="w-4 h-4 rounded-full shrink-0" style={{ background: `hsl(${preset.value})` }} />
              <span className="text-foreground truncate">{preset.name}</span>
            </button>
          ))}
        </div>

        {/* Custom hue slider */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <Paintbrush className="w-3 h-3" /> Custom Color
          </label>
          <div className="relative">
            <input
              type="range"
              min={0}
              max={360}
              value={customHue}
              onChange={(e) => handleCustomHue(Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{
                background: "linear-gradient(to right, hsl(0 80% 55%), hsl(60 80% 55%), hsl(120 80% 55%), hsl(180 80% 55%), hsl(240 80% 55%), hsl(300 80% 55%), hsl(360 80% 55%))",
              }}
            />
            <div
              className="w-5 h-5 rounded-full border-2 border-foreground absolute top-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `calc(${(customHue / 360) * 100}% - 10px)`,
                background: `hsl(${customHue} 80% 55%)`,
              }}
            />
          </div>
        </div>
      </section>

      {/* Background Theme */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" /> Background Theme
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Change the overall dark theme style</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BG_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyBg(preset)}
              className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all text-xs ${
                activeBg === preset.name
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <div
                className="w-5 h-5 rounded border border-border shrink-0"
                style={{ background: `hsl(${preset.bg})` }}
              />
              <span className="text-foreground font-medium">{preset.name}</span>
              {activeBg === preset.name && <Check className="w-3 h-3 text-primary ml-auto shrink-0" />}
            </button>
          ))}
        </div>
      </section>

      {/* Background Pattern */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" /> Background Pattern
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Choose a bold overlay pattern for a stronger ambient vibe</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PATTERN_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPattern(preset)}
              className={`relative flex items-center gap-2 p-2.5 rounded-lg border transition-all text-xs ${
                activePattern === preset.name
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <div
                className={`w-8 h-8 rounded border border-border shrink-0 bg-background ${preset.className}`}
              />
              <span className="text-foreground font-medium">{preset.name}</span>
              {activePattern === preset.name && <Check className="w-3 h-3 text-primary ml-auto shrink-0" />}
            </button>
          ))}
        </div>
      </section>

      {/* Clouds Ambient */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Clouds Ambient
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Animated 3D cloud layers behind the UI — dreamy atmospheric effect
        </p>

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setNebulaEnabled(!nebulaEnabled)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              nebulaEnabled
                ? "gradient-warm-bg text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {nebulaEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        {nebulaEnabled && (
          <>
            {/* Ambient Theme Presets */}
            <label className="text-xs text-muted-foreground mb-2 block">Ambient Theme</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {AMBIENT_THEMES.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => {
                    setNebulaTheme(theme.name);
                    const base = AMBIENT_THEME_BASE_COLOR[theme.name];
                    if (base) setNebulaColor(base);
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all text-xs ${
                    nebulaTheme === theme.name ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <span className="text-base">{theme.colors.join("")}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-foreground font-medium block">{theme.name}</span>
                    <span className="text-[10px] text-muted-foreground block truncate">{theme.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            <label className="text-xs text-muted-foreground mb-2 block">
              Intensity: {nebulaIntensity}%
            </label>
            <input
              type="range"
              min={10}
              max={100}
              value={nebulaIntensity}
              onChange={(e) => setNebulaIntensity(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer mb-4"
              style={{ background: `linear-gradient(to right, hsl(var(--muted)), hsl(${nebulaColor}))` }}
            />

            <label className="text-xs text-muted-foreground mb-2 block">Cloud Color</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CLOUD_COLORS.map((nc) => (
                <button
                  key={nc.name}
                  onClick={() => { setNebulaColor(nc.hsl); setNebulaTheme("Default"); }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs ${
                    nebulaColor === nc.hsl ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full" style={{ background: `hsl(${nc.hsl})`, boxShadow: `0 0 12px hsl(${nc.hsl} / 0.5)` }} />
                  <span className="text-foreground">{nc.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Reset */}
      <section className="bg-card border border-border rounded-xl p-5">
        <button
          onClick={() => {
            applyBg(BG_PRESETS[0]);
            applyPattern(PATTERN_PRESETS[0]);
            onAccentChange("45 100% 58%");
            setCustomHue(45);
            setNebulaEnabled(true);
            setNebulaIntensity(85);
            setNebulaColor("45 100% 58%");
            setNebulaTheme("Default");
            onPerformanceModeChange(false);
            const cloak = CLOAK_PRESETS.find((p) => p.name === "Default")!;
            applyCloak(cloak);
            toast.success("All settings reset to defaults");
          }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset All to Defaults
        </button>
      </section>
    </div>
  );
};

export default SettingsPanel;
