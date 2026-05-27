import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import logo from "@/assets/blhm-logo.png";

const Login = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin" /></div>;
  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "signin") {
      const { error } = await signIn(email, password);
      setBusy(false);
      if (error) return toast.error(error);
      toast.success("Welcome back");
      nav("/admin");
    } else {
      const { error } = await signUp(email, password, fullName.trim() || undefined);
      setBusy(false);
      if (error) return toast.error(error);
      setSubmitted(true);
    }
  };

  if (submitted) return (
    <div className="min-h-screen grid place-items-center bg-muted/30 px-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-medium p-8 text-center">
        <CheckCircle2 className="w-12 h-12 mx-auto text-secondary mb-3" />
        <h1 className="font-serif text-2xl font-bold mb-2">Request submitted</h1>
        <p className="text-sm text-muted-foreground mb-1">
          Thanks, {fullName || "friend"}. Your editor account request is pending approval by an administrator.
        </p>
        <p className="text-sm text-muted-foreground mb-6 flex items-center justify-center gap-1.5">
          <Mail className="w-4 h-4" /> Check {email} for a verification email.
        </p>
        <button onClick={() => { setSubmitted(false); setMode("signin"); }}
          className="text-sm underline text-muted-foreground">Back to sign in</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 px-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-medium p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logo} alt="BLHM logo" className="w-16 h-16 object-contain mb-3" />
          <h1 className="font-serif text-2xl font-bold">BLHMYOUTH Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signin" ? "Sign in to manage your site" : "Request editor access"}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-sm font-medium block mb-1.5">Full name</label>
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120}
                className="w-full border border-border rounded-lg px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          )}
          <div>
            <label className="text-sm font-medium block mb-1.5">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Password</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button disabled={busy} className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg disabled:opacity-60">
            {busy ? <Loader2 className="animate-spin mx-auto" /> : mode === "signin" ? "Sign in" : "Request access"}
          </button>
        </form>
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-sm text-muted-foreground hover:text-foreground mt-4 w-full text-center">
          {mode === "signin" ? "Need access? Request an account" : "Have an account? Sign in"}
        </button>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          New accounts must be approved by an administrator before they can access the dashboard.
        </p>
      </div>
    </div>
  );
};
export default Login;
