import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  Coins,
  Dice1,
  Timer,
  Ruler,
  Hash,
  ArrowLeft,
  Scale,
  UserRoundSearch,
  NotebookText,
  AlarmClock,
} from "lucide-react";

type AppId =
  | "calculator"
  | "coinflip"
  | "dice"
  | "stopwatch"
  | "counter"
  | "converter"
  | "picker"
  | "wordlab"
  | "focus"
  | null;

const apps = [
  { id: "calculator" as const, name: "Calculator", icon: Calculator, color: "hsl(220 70% 50%)", desc: "Basic & scientific calculator" },
  { id: "coinflip" as const, name: "Coin Flip", icon: Coins, color: "hsl(45 90% 50%)", desc: "Flip a coin, heads or tails" },
  { id: "dice" as const, name: "Dice Roller", icon: Dice1, color: "hsl(0 70% 50%)", desc: "Roll up to 6 dice" },
  { id: "stopwatch" as const, name: "Stopwatch", icon: Timer, color: "hsl(160 60% 45%)", desc: "Precise stopwatch & timer" },
  { id: "counter" as const, name: "Counter", icon: Hash, color: "hsl(270 60% 55%)", desc: "Click to count up or down" },
  { id: "converter" as const, name: "Unit Converter", icon: Scale, color: "hsl(200 70% 55%)", desc: "Length, mass, and quick conversions" },
  { id: "picker" as const, name: "Name Picker", icon: UserRoundSearch, color: "hsl(330 75% 58%)", desc: "Random student/name picker" },
  { id: "wordlab" as const, name: "Word Lab", icon: NotebookText, color: "hsl(28 80% 55%)", desc: "Word, character, and reading counts" },
  { id: "focus" as const, name: "Focus Sprint", icon: AlarmClock, color: "hsl(95 65% 45%)", desc: "Original Pomodoro-style timer" },
];

const CalculatorApp = () => {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<string | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);

  const handleNum = (n: string) => {
    if (fresh) {
      setDisplay(n);
      setFresh(false);
    } else {
      setDisplay(display === "0" && n !== "." ? n : display + n);
    }
  };

  const handleOp = (nextOp: string) => {
    setPrev(display);
    setOp(nextOp);
    setFresh(true);
  };

  const handleEquals = () => {
    if (!prev || !op) return;
    const a = parseFloat(prev);
    const b = parseFloat(display);
    let result = 0;
    if (op === "+") result = a + b;
    else if (op === "-") result = a - b;
    else if (op === "×") result = a * b;
    else if (op === "÷") result = b !== 0 ? a / b : 0;
    setDisplay(String(parseFloat(result.toFixed(10))));
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const buttons = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "=", "+"];

  return (
    <div className="max-w-xs mx-auto">
      <div className="bg-muted rounded-xl p-4 mb-3 text-right">
        <p className="text-xs text-muted-foreground h-5">{prev && op ? `${prev} ${op}` : ""}</p>
        <p className="text-3xl font-mono font-bold text-foreground truncate">{display}</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button onClick={() => { setDisplay("0"); setPrev(null); setOp(null); setFresh(true); }} className="col-span-2 py-3 rounded-lg bg-destructive/20 text-destructive font-bold text-sm hover:bg-destructive/30">AC</button>
        <button onClick={() => setDisplay(String(parseFloat(display) * -1))} className="py-3 rounded-lg bg-muted text-foreground font-bold text-sm hover:bg-muted/80">±</button>
        <button onClick={() => setDisplay(String(parseFloat(display) / 100))} className="py-3 rounded-lg bg-muted text-foreground font-bold text-sm hover:bg-muted/80">%</button>
        {buttons.map((b) => (
          <button
            key={b}
            onClick={() => {
              if (b === "=") handleEquals();
              else if (["+", "-", "×", "÷"].includes(b)) handleOp(b);
              else handleNum(b);
            }}
            className={`py-3 rounded-lg font-bold text-sm transition-all ${
              ["+", "-", "×", "÷"].includes(b)
                ? "gradient-warm-bg text-primary-foreground"
                : b === "="
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            {b}
          </button>
        ))}
      </div>
    </div>
  );
};

const CoinFlipApp = () => {
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [stats, setStats] = useState({ heads: 0, tails: 0 });

  const flip = () => {
    setFlipping(true);
    setTimeout(() => {
      const r = Math.random() < 0.5 ? "heads" : "tails";
      setResult(r);
      setStats((s) => ({ ...s, [r]: s[r] + 1 }));
      setFlipping(false);
    }, 600);
  };

  return (
    <div className="text-center max-w-xs mx-auto">
      <div
        className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-4xl mb-6 border-4 border-border shadow-xl ${flipping ? "animate-spin" : ""}`}
        style={{ background: result === "heads" ? "hsl(45 90% 50%)" : result === "tails" ? "hsl(200 60% 50%)" : "hsl(var(--muted))" }}
      >
        {result ? (result === "heads" ? "👑" : "🪙") : "?"}
      </div>
      <p className="text-xl font-bold text-foreground mb-1">{result ? result.toUpperCase() : "Ready to flip"}</p>
      <button onClick={flip} disabled={flipping} className="px-8 py-3 rounded-xl gradient-warm-bg text-primary-foreground font-bold mt-4 hover:opacity-90 disabled:opacity-50">
        {flipping ? "Flipping..." : "Flip Coin"}
      </button>
      <div className="flex justify-center gap-6 mt-6 text-sm text-muted-foreground">
        <span>Heads: <strong className="text-foreground">{stats.heads}</strong></span>
        <span>Tails: <strong className="text-foreground">{stats.tails}</strong></span>
      </div>
    </div>
  );
};

const DiceRollerApp = () => {
  const [count, setCount] = useState(1);
  const [results, setResults] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);

  const roll = () => {
    setRolling(true);
    setTimeout(() => {
      setResults(Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1));
      setRolling(false);
    }, 400);
  };

  const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  return (
    <div className="text-center max-w-sm mx-auto">
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className="text-sm text-muted-foreground">Dice:</span>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button key={n} onClick={() => setCount(n)} className={`w-8 h-8 rounded-lg text-xs font-bold ${count === n ? "gradient-warm-bg text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{n}</button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3 mb-6 min-h-[80px]">
        {results.map((r, i) => (
          <div key={i} className={`text-5xl ${rolling ? "animate-bounce" : ""}`}>{diceFaces[r - 1]}</div>
        ))}
      </div>
      {results.length > 0 && (
        <p className="text-lg font-bold text-foreground mb-4">Total: {results.reduce((a, b) => a + b, 0)}</p>
      )}
      <button onClick={roll} disabled={rolling} className="px-8 py-3 rounded-xl gradient-warm-bg text-primary-foreground font-bold hover:opacity-90 disabled:opacity-50">
        {rolling ? "Rolling..." : `Roll ${count} ${count === 1 ? "Die" : "Dice"}`}
      </button>
    </div>
  );
};

const StopwatchApp = () => {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [laps, setLaps] = useState<number[]>([]);

  const start = () => {
    if (running) return;
    setRunning(true);
    const id = window.setInterval(() => setTime((t) => t + 10), 10);
    setIntervalId(id);
  };

  const stop = () => {
    if (intervalId) clearInterval(intervalId);
    setRunning(false);
    setIntervalId(null);
  };

  const reset = () => {
    stop();
    setTime(0);
    setLaps([]);
  };

  const lap = () => setLaps((l) => [...l, time]);

  const fmt = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  };

  return (
    <div className="text-center max-w-xs mx-auto">
      <p className="text-5xl font-mono font-bold text-foreground mb-8">{fmt(time)}</p>
      <div className="flex justify-center gap-3 mb-6">
        {!running ? (
          <button onClick={start} className="px-6 py-3 rounded-xl gradient-warm-bg text-primary-foreground font-bold hover:opacity-90">Start</button>
        ) : (
          <button onClick={stop} className="px-6 py-3 rounded-xl bg-destructive text-destructive-foreground font-bold hover:opacity-90">Stop</button>
        )}
        <button onClick={lap} disabled={!running} className="px-6 py-3 rounded-xl bg-muted text-foreground font-bold disabled:opacity-30">Lap</button>
        <button onClick={reset} className="px-6 py-3 rounded-xl bg-muted text-foreground font-bold">Reset</button>
      </div>
      {laps.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {laps.map((l, i) => (
            <div key={i} className="flex justify-between text-sm px-4 py-1 bg-card rounded-lg border border-border">
              <span className="text-muted-foreground">Lap {i + 1}</span>
              <span className="font-mono text-foreground">{fmt(l)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CounterApp = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="text-center max-w-xs mx-auto">
      <p className="text-7xl font-bold text-foreground mb-8 font-mono">{count}</p>
      <div className="flex justify-center gap-4">
        <button onClick={() => setCount((c) => c - 1)} className="w-16 h-16 rounded-2xl bg-destructive/20 text-destructive text-3xl font-bold hover:bg-destructive/30">−</button>
        <button onClick={() => setCount(0)} className="w-16 h-16 rounded-2xl bg-muted text-muted-foreground text-sm font-bold hover:bg-muted/80">Reset</button>
        <button onClick={() => setCount((c) => c + 1)} className="w-16 h-16 rounded-2xl gradient-warm-bg text-primary-foreground text-3xl font-bold hover:opacity-90">+</button>
      </div>
    </div>
  );
};

const ConverterApp = () => {
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("ft");

  const unitToMeters: Record<string, number> = {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    in: 0.0254,
    ft: 0.3048,
    yd: 0.9144,
  };

  const output = useMemo(() => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return "—";
    const meters = parsed * unitToMeters[from];
    const converted = meters / unitToMeters[to];
    return converted.toFixed(converted < 10 ? 4 : 2);
  }, [from, to, value]);

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Value</label>
        <input value={value} onChange={(e) => setValue(e.target.value)} className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">From</label>
          <select value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm">
            {Object.keys(unitToMeters).map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">To</label>
          <select value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm">
            {Object.keys(unitToMeters).map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div className="p-4 rounded-xl bg-card border border-border">
        <p className="text-xs text-muted-foreground">Converted result</p>
        <p className="text-2xl font-bold text-foreground mt-1">{output} {to}</p>
      </div>
    </div>
  );
};

const NamePickerApp = () => {
  const [input, setInput] = useState("Alex\nMia\nJordan\nNoah");
  const [picked, setPicked] = useState<string | null>(null);

  const names = input
    .split(/[\n,]/)
    .map((name) => name.trim())
    .filter(Boolean);

  const pick = () => {
    if (!names.length) return;
    const next = names[Math.floor(Math.random() * names.length)];
    setPicked(next);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={6}
        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm"
        placeholder="Enter names (one per line or comma-separated)"
      />
      <button onClick={pick} className="px-5 py-2 rounded-lg gradient-warm-bg text-primary-foreground text-sm font-bold">Pick Random Name</button>
      <div className="p-4 rounded-xl bg-card border border-border min-h-20 flex items-center justify-center">
        <p className="text-xl font-bold text-foreground">{picked || "No name picked yet"}</p>
      </div>
      <p className="text-xs text-muted-foreground">{names.length} names loaded</p>
    </div>
  );
};

const WordLabApp = () => {
  const [text, setText] = useState("");

  const words = useMemo(() => (text.trim() ? text.trim().split(/\s+/).length : 0), [text]);
  const chars = text.length;
  const readMinutes = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="max-w-md mx-auto space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm"
        placeholder="Paste writing here to analyze..."
      />
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground">Words</p>
          <p className="text-xl font-bold text-foreground">{words}</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground">Characters</p>
          <p className="text-xl font-bold text-foreground">{chars}</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground">Read Time</p>
          <p className="text-xl font-bold text-foreground">{readMinutes}m</p>
        </div>
      </div>
    </div>
  );
};

const FocusSprintApp = () => {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const setPreset = (next: "focus" | "break") => {
    setMode(next);
    setSeconds(next === "focus" ? 25 * 60 : 5 * 60);
    setRunning(false);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="max-w-sm mx-auto text-center space-y-4">
      <div className="flex justify-center gap-2">
        <button onClick={() => setPreset("focus")} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${mode === "focus" ? "gradient-warm-bg text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Focus 25m</button>
        <button onClick={() => setPreset("break")} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${mode === "break" ? "gradient-warm-bg text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Break 5m</button>
      </div>
      <p className="text-5xl font-mono font-bold text-foreground">{mm}:{ss}</p>
      <div className="flex justify-center gap-3">
        <button onClick={() => setRunning((v) => !v)} className="px-5 py-2 rounded-lg gradient-warm-bg text-primary-foreground text-sm font-bold">{running ? "Pause" : "Start"}</button>
        <button onClick={() => setPreset(mode)} className="px-5 py-2 rounded-lg bg-muted text-foreground text-sm font-bold">Reset</button>
      </div>
    </div>
  );
};

const AppsPanel = () => {
  const [activeApp, setActiveApp] = useState<AppId>(null);

  const renderApp = () => {
    switch (activeApp) {
      case "calculator": return <CalculatorApp />;
      case "coinflip": return <CoinFlipApp />;
      case "dice": return <DiceRollerApp />;
      case "stopwatch": return <StopwatchApp />;
      case "counter": return <CounterApp />;
      case "converter": return <ConverterApp />;
      case "picker": return <NamePickerApp />;
      case "wordlab": return <WordLabApp />;
      case "focus": return <FocusSprintApp />;
      default: return null;
    }
  };

  if (activeApp) {
    const app = apps.find((a) => a.id === activeApp)!;
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={() => setActiveApp(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Apps
        </button>
        <h2 className="text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-3">
          <app.icon className="w-6 h-6" style={{ color: app.color }} /> {app.name}
        </h2>
        {renderApp()}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
          <Ruler className="w-6 h-6 text-primary" /> Apps & Tools
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Expanded with classroom tools + original SmartStudies utilities</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
          <button
            key={app.id}
            onClick={() => setActiveApp(app.id)}
            className="group relative bg-card border border-border rounded-2xl p-6 text-left transition-all card-hover overflow-hidden"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ background: `radial-gradient(circle at center, ${app.color}, transparent 70%)` }} />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg" style={{ background: app.color }}>
                <app.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{app.name}</h3>
              <p className="text-xs text-muted-foreground">{app.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AppsPanel;
