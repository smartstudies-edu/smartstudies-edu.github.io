import { useEffect, useMemo, useRef, useState } from "react";
import { Music, ExternalLink, Radio, Headphones, Play, Pause, Volume2, AlertTriangle, WandSparkles } from "lucide-react";

type AmbientPreset = "focus-pulse" | "rain-room" | "deep-space" | "study-cafe" | "vinyl-noise" | "night-air";
type StationType = "ambient" | "stream";

interface Station {
  id: string;
  type: StationType;
  name: string;
  desc: string;
  icon: string;
  website?: string;
  streamUrls?: string[];
  preset?: AmbientPreset;
}

const STATIONS: Station[] = [
  { id: "focus-pulse", type: "ambient", name: "Focus Pulse", desc: "Steady synth pulse for concentration", icon: "✨", preset: "focus-pulse" },
  { id: "rain-room", type: "ambient", name: "Rain Room", desc: "Soft rain texture with gentle filtering", icon: "🌧️", preset: "rain-room" },
  { id: "deep-space", type: "ambient", name: "Deep Space", desc: "Low cosmic drone and warm sub tones", icon: "🪐", preset: "deep-space" },
  { id: "study-cafe", type: "ambient", name: "Study Cafe", desc: "Cafe-like hum with subtle keys", icon: "☕", preset: "study-cafe" },
  { id: "vinyl-noise", type: "ambient", name: "Vinyl Noise", desc: "Lo-fi crackle bed for reading", icon: "📼", preset: "vinyl-noise" },
  { id: "night-air", type: "ambient", name: "Night Air", desc: "Airy pad + slow movement", icon: "🌌", preset: "night-air" },
  {
    id: "groove-salad",
    type: "stream",
    name: "SomaFM Groove Salad",
    desc: "Classic chill ambient radio",
    icon: "🥗",
    website: "https://somafm.com/groovesalad/",
    streamUrls: [
      "https://ice1.somafm.com/groovesalad-128-mp3",
      "https://ice2.somafm.com/groovesalad-128-mp3",
      "https://ice4.somafm.com/groovesalad-128-mp3",
    ],
  },
  {
    id: "drone-zone",
    type: "stream",
    name: "SomaFM Drone Zone",
    desc: "Deep drone and cinematic ambience",
    icon: "🌠",
    website: "https://somafm.com/dronezone/",
    streamUrls: [
      "https://ice1.somafm.com/dronezone-128-mp3",
      "https://ice2.somafm.com/dronezone-128-mp3",
      "https://ice4.somafm.com/dronezone-128-mp3",
    ],
  },
  {
    id: "secret-agent",
    type: "stream",
    name: "SomaFM Secret Agent",
    desc: "Trip-hop and downtempo",
    icon: "🕶️",
    website: "https://somafm.com/secretagent/",
    streamUrls: [
      "https://ice1.somafm.com/secretagent-128-mp3",
      "https://ice2.somafm.com/secretagent-128-mp3",
    ],
  },
  {
    id: "deepspaceone",
    type: "stream",
    name: "SomaFM Deep Space One",
    desc: "Space ambient and atmospheric electronica",
    icon: "🚀",
    website: "https://somafm.com/deepspaceone/",
    streamUrls: [
      "https://ice1.somafm.com/deepspaceone-128-mp3",
      "https://ice2.somafm.com/deepspaceone-128-mp3",
    ],
  },
  {
    id: "jazz24",
    type: "stream",
    name: "Jazz24",
    desc: "Smooth jazz for long sessions",
    icon: "🎷",
    website: "https://www.jazz24.org/",
    streamUrls: [
      "https://live.wostreaming.net/direct/ppm-jazz24mp3-ibc1",
      "https://live.wostreaming.net/direct/ppm-jazz24aac-ibc1",
    ],
  },
  {
    id: "kusc",
    type: "stream",
    name: "Classical KUSC",
    desc: "Classical focus stream",
    icon: "🎼",
    website: "https://www.kusc.org/",
    streamUrls: [
      "https://playerservices.streamtheworld.com/api/livestream-redirect/KUSCMP128.mp3",
      "https://playerservices.streamtheworld.com/api/livestream-redirect/KUSCAAC.aac",
    ],
  },
];

const QUICK_LINKS = [
  { name: "Lofi Cafe", url: "https://www.lofi.cafe/", icon: "☕" },
  { name: "musicForProgramming", url: "https://musicforprogramming.net/latest/", icon: "💻" },
  { name: "Noisli", url: "https://www.noisli.com/", icon: "🍃" },
  { name: "rain.today", url: "https://rain.today/", icon: "🌧️" },
];

const STREAM_TIMEOUT_MS = 9000;

const MusicPanel = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientCleanupRef = useRef<(() => void) | null>(null);

  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.72);
  const [errorMessage, setErrorMessage] = useState("");
  const [group, setGroup] = useState<"all" | "ambient" | "stream">("all");

  const proxyBase = useMemo(() => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy`, []);
  const activeStation = STATIONS.find((s) => s.id === activeStationId) || null;

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    return () => {
      ambientCleanupRef.current?.();
      if (audioRef.current) audioRef.current.pause();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const filteredStations = STATIONS.filter((station) => group === "all" || station.type === group);

  const stopAmbient = () => {
    ambientCleanupRef.current?.();
    ambientCleanupRef.current = null;
  };

  const ensureAudioContext = async () => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    if (audioContextRef.current.state !== "running") await audioContextRef.current.resume();
    return audioContextRef.current;
  };

  const startAmbient = async (preset: AmbientPreset) => {
    stopAmbient();
    const ctx = await ensureAudioContext();

    const master = ctx.createGain();
    master.gain.value = Math.max(0.06, Math.min(0.45, volume * 0.3));
    master.connect(ctx.destination);

    const sources: AudioScheduledSourceNode[] = [];
    const nodes: AudioNode[] = [master];
    const intervals: number[] = [];

    if (preset === "focus-pulse") {
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      oscA.type = "sine";
      oscB.type = "triangle";
      lfo.type = "sine";

      oscA.frequency.value = 216;
      oscB.frequency.value = 324;
      lfo.frequency.value = 0.22;

      gain.gain.value = 0.16;
      lfoGain.gain.value = 0.09;

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      oscA.connect(gain);
      oscB.connect(gain);
      gain.connect(master);

      [oscA, oscB, lfo].forEach((source) => {
        source.start();
        sources.push(source);
      });
      nodes.push(gain, lfoGain, oscA, oscB, lfo);
    }

    if (preset === "rain-room" || preset === "vinyl-noise") {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let brown = 0;
      for (let i = 0; i < data.length; i += 1) {
        const white = Math.random() * 2 - 1;
        if (preset === "vinyl-noise") {
          brown = (brown + 0.02 * white) / 1.02;
          data[i] = brown * 0.8 + (Math.random() - 0.5) * 0.03;
        } else {
          data[i] = Math.random() * 2 - 1;
        }
      }

      const noise = ctx.createBufferSource();
      const lowPass = ctx.createBiquadFilter();
      const highPass = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      noise.buffer = buffer;
      noise.loop = true;

      lowPass.type = "lowpass";
      highPass.type = "highpass";

      if (preset === "vinyl-noise") {
        lowPass.frequency.value = 2400;
        highPass.frequency.value = 180;
        gain.gain.value = 0.25;
      } else {
        lowPass.frequency.value = 1500;
        highPass.frequency.value = 210;
        gain.gain.value = 0.22;
      }

      noise.connect(lowPass);
      lowPass.connect(highPass);
      highPass.connect(gain);
      gain.connect(master);

      noise.start();
      sources.push(noise);
      nodes.push(noise, lowPass, highPass, gain);
    }

    if (preset === "deep-space" || preset === "night-air") {
      const osc = ctx.createOscillator();
      const sub = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      sub.type = "sine";
      filter.type = "lowpass";

      osc.frequency.value = preset === "night-air" ? 96 : 62;
      sub.frequency.value = preset === "night-air" ? 48 : 31;
      filter.frequency.value = preset === "night-air" ? 680 : 420;
      gain.gain.value = preset === "night-air" ? 0.12 : 0.16;

      osc.connect(filter);
      sub.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start();
      sub.start();
      sources.push(osc, sub);
      nodes.push(osc, sub, filter, gain);
    }

    if (preset === "study-cafe") {
      const roomBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const roomData = roomBuffer.getChannelData(0);
      for (let i = 0; i < roomData.length; i += 1) {
        roomData[i] = (Math.random() * 2 - 1) * 0.12;
      }

      const room = ctx.createBufferSource();
      room.buffer = roomBuffer;
      room.loop = true;

      const roomFilter = ctx.createBiquadFilter();
      roomFilter.type = "bandpass";
      roomFilter.frequency.value = 620;
      roomFilter.Q.value = 0.8;

      const roomGain = ctx.createGain();
      roomGain.gain.value = 0.2;

      room.connect(roomFilter);
      roomFilter.connect(roomGain);
      roomGain.connect(master);
      room.start();
      sources.push(room);
      nodes.push(room, roomFilter, roomGain);

      const triggerKey = () => {
        const key = ctx.createOscillator();
        const keyGain = ctx.createGain();
        key.type = "triangle";
        key.frequency.value = [262, 294, 330, 392, 440][Math.floor(Math.random() * 5)];
        keyGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        keyGain.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.02);
        keyGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
        key.connect(keyGain);
        keyGain.connect(master);
        key.start();
        key.stop(ctx.currentTime + 1.2);
      };

      triggerKey();
      intervals.push(window.setInterval(triggerKey, 2400));
    }

    ambientCleanupRef.current = () => {
      intervals.forEach((id) => window.clearInterval(id));
      sources.forEach((source) => {
        try {
          source.stop();
        } catch {
          // noop
        }
      });
      nodes.forEach((node) => {
        try {
          node.disconnect();
        } catch {
          // noop
        }
      });
    };
  };

  const buildCandidateUrls = (streamUrl: string) => [streamUrl, `${proxyBase}?url=${encodeURIComponent(streamUrl)}`];

  const tryStream = async (streamUrl: string) => {
    const audio = audioRef.current;
    if (!audio) return false;

    const candidates = buildCandidateUrls(streamUrl);

    for (const candidateUrl of candidates) {
      audio.pause();
      audio.src = candidateUrl;
      audio.load();

      const canStart = await new Promise<boolean>((resolve) => {
        let settled = false;

        const done = (result: boolean) => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve(result);
        };

        const onPlayable = () => done(true);
        const onError = () => done(false);
        const timeoutId = window.setTimeout(() => done(false), STREAM_TIMEOUT_MS);

        const cleanup = () => {
          window.clearTimeout(timeoutId);
          audio.removeEventListener("canplay", onPlayable);
          audio.removeEventListener("playing", onPlayable);
          audio.removeEventListener("error", onError);
          audio.removeEventListener("stalled", onError);
          audio.removeEventListener("abort", onError);
        };

        audio.addEventListener("canplay", onPlayable);
        audio.addEventListener("playing", onPlayable);
        audio.addEventListener("error", onError);
        audio.addEventListener("stalled", onError);
        audio.addEventListener("abort", onError);
      });

      if (!canStart) continue;

      try {
        await audio.play();
        return true;
      } catch {
        // continue with next candidate url
      }
    }

    return false;
  };

  const playStation = async (station: Station) => {
    setErrorMessage("");
    setActiveStationId(station.id);

    if (station.type === "ambient" && station.preset) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      try {
        await startAmbient(station.preset);
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
        setErrorMessage("Audio permission is blocked — click the station once more to start.");
      }
      return;
    }

    stopAmbient();

    for (const streamUrl of station.streamUrls || []) {
      const ok = await tryStream(streamUrl);
      if (ok) {
        setIsPlaying(true);
        return;
      }
    }

    const fallbackAmbient = STATIONS.find((item) => item.id === "focus-pulse");
    if (fallbackAmbient?.preset) {
      await startAmbient(fallbackAmbient.preset);
      setActiveStationId(fallbackAmbient.id);
      setIsPlaying(true);
      setErrorMessage("Live stream was blocked on this network, so SmartStudies ambient mode started automatically.");
      return;
    }

    setIsPlaying(false);
    setErrorMessage("Couldn’t start this station. Try another one or open the source website.");
  };

  const pauseStation = () => {
    if (audioRef.current) audioRef.current.pause();
    stopAmbient();
    setIsPlaying(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />

      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
          <Headphones className="w-6 h-6 text-primary" /> Music Lab
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Upgraded picks with network-safe fallback so playback always starts.</p>
      </div>

      <div className="mb-6 p-4 bg-card border border-border rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => (isPlaying ? pauseStation() : activeStation && playStation(activeStation))}
            disabled={!activeStation}
            className="px-4 py-2 rounded-lg gradient-warm-bg text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {isPlaying ? (
              <span className="inline-flex items-center gap-1"><Pause className="w-4 h-4" /> Pause</span>
            ) : (
              <span className="inline-flex items-center gap-1"><Play className="w-4 h-4" /> Play</span>
            )}
          </button>

          <div className="text-sm text-foreground min-w-[220px]">
            {activeStation ? (
              <span>Now playing: <strong>{activeStation.name}</strong></span>
            ) : (
              <span>Select a station to start</span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => {
                const value = Number(e.target.value);
                setVolume(value);
                if (audioRef.current) audioRef.current.volume = value;
              }}
              className="w-32"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p>{errorMessage}</p>
              {activeStation?.type === "stream" && activeStation.website && (
                <a href={activeStation.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline mt-1">
                  Open {activeStation.name} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setGroup("all")} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${group === "all" ? "gradient-warm-bg text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:text-foreground"}`}>All</button>
        <button onClick={() => setGroup("ambient")} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${group === "ambient" ? "gradient-warm-bg text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:text-foreground"}`}>Built-in Ambient</button>
        <button onClick={() => setGroup("stream")} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${group === "stream" ? "gradient-warm-bg text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:text-foreground"}`}>Live Radio</button>
      </div>

      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Radio className="w-5 h-5 text-primary" /> Stations
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {filteredStations.map((station) => {
          const active = activeStationId === station.id;
          return (
            <button
              key={station.id}
              onClick={() => playStation(station)}
              className={`group relative bg-card border rounded-2xl p-6 text-left transition-all card-hover overflow-hidden ${active ? "border-primary/50" : "border-border"}`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity gradient-warm-bg" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 bg-muted border border-border">
                  {station.icon}
                </div>
                <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
                  {station.name}
                  {station.type === "ambient" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground inline-flex items-center gap-1">
                      <WandSparkles className="w-3 h-3" /> SmartStudies
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">{station.desc}</p>
                {station.type === "stream" && station.website && (
                  <a href={station.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    Open source <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Music className="w-5 h-5 text-primary" /> Focus Links
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_LINKS.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-all"
          >
            <span className="text-2xl">{link.icon}</span>
            <div>
              <p className="text-sm font-bold text-foreground">{link.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Open</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default MusicPanel;
