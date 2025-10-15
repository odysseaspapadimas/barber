import { useTRPC } from "@/integrations/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Shield, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const trpc = useTRPC();

  const loginMutation = useMutation(
    trpc.auth.login.mutationOptions({
      onSuccess: () => {
        // Cookie is set automatically by Better Auth's reactStartCookies plugin
        navigate({ to: "/admin" });
      },
      onError: (err) => {
        console.error("Login error:", err);
        setError(err.message || "Invalid credentials");
      },
    })
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Password is required");
      return;
    }

    loginMutation.mutate({
      email: "admin@kypseli.com",
      password,
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">
            Admin Access
          </h1>
          <p className="text-lg text-muted-foreground">
            Kypseli Cuts Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border-2 border-border rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Secure Login</h2>
                <p className="text-sm text-muted-foreground">Enter your admin credentials</p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-foreground mb-2"
                >
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                    className="block w-full border-2 border-border rounded-xl px-4 py-3 pr-12 text-foreground placeholder-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:bg-muted disabled:cursor-not-allowed"
                    placeholder="Enter admin password"
                    autoComplete="current-password"
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-6 py-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                {loginMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                This portal is restricted to authorized administrators only.
                <br />
                Contact support if you need access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
