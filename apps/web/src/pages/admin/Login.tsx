import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { signIn, useSession } from "../../lib/auth-client";

export function AdminLoginPage() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from: string }).from.startsWith("/admin")
      ? (location.state as { from: string }).from
      : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isPending && session?.user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? "Sign-in failed");
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-fog relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 10% 0%, color-mix(in srgb, var(--color-mist) 70%, transparent), transparent 55%), radial-gradient(ellipse 60% 40% at 90% 100%, color-mix(in srgb, var(--color-steel) 12%, transparent), transparent 50%)",
        }}
      />
      <div className="relative page-pad py-16 sm:py-24 flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-steel motion-safe:animate-[fade-up_0.5s_ease-out]">
            Baseer Studio
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-graphite motion-safe:animate-[fade-up_0.55s_ease-out]">
            Admin
          </h1>
          <p className="mt-3 font-body text-graphite/65 max-w-sm motion-safe:animate-[fade-up_0.6s_ease-out]">
            Sign in to edit case studies, copy, and site settings.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-10 space-y-5 border-t border-mist pt-8 motion-safe:animate-[fade-up_0.65s_ease-out]"
          >
            <label className="block space-y-1.5">
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-mist bg-fog/80 px-3 py-2.5 font-body focus:outline-none focus-visible:ring-2 focus-visible:ring-steel"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-steel">
                Password
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-mist bg-fog/80 px-3 py-2.5 font-body focus:outline-none focus-visible:ring-2 focus-visible:ring-steel"
              />
            </label>

            {error ? (
              <p className="font-mono text-sm text-amber" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-steel text-fog px-4 py-3 font-mono text-xs uppercase tracking-[0.14em] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-steel"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-8">
            <Link
              to="/"
              className="font-mono text-xs uppercase tracking-[0.12em] text-graphite/50 no-underline hover:text-steel"
            >
              ← View site
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
