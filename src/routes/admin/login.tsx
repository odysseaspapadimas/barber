import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/admin/login')({
  component: RouteComponent,
});

function RouteComponent() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Demo: accept password 'demo' or any non-empty password if env not provided
    const ok = password === 'demo' || password.length > 0;
    if (!ok) {
      setError('Invalid password');
      return;
    }
    // set simple client-side auth for demo
    if (typeof window !== 'undefined') {
      localStorage.setItem('kypseli_admin', '1');
      window.location.href = '/admin';
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Admin login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </div>
          {error && <div className="text-destructive">{error}</div>}
          <div className="flex items-center justify-between">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded">Sign in</button>
            <small className="text-sm text-muted-foreground">Demo password: <code>demo</code></small>
          </div>
        </form>
      </div>
    </main>
  );
}
