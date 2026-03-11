import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (error) throw error;
        setError("Check your email for verification link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm p-6 rounded-lg bg-card border border-border">
          <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
            ☁️ Cloud Chat
          </h1>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 rounded-md bg-input border border-border text-foreground placeholder:text-muted-foreground"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-md bg-input border border-border text-foreground placeholder:text-muted-foreground"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-md bg-input border border-border text-foreground placeholder:text-muted-foreground"
              required
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              className="w-full p-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition"
          >
            {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">☁️ Cloud Chat</h1>
        <p className="text-muted-foreground">Welcome! You're signed in as {session.user.email}</p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:opacity-90 transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
