import { queryClient, trpc } from "@/integrations/tanstack-query/root-provider";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: RouteComponent,
  pendingComponent: () => <div>Loading...</div>,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.services.list.queryOptions()
    );
  },
});

function ServicesList() {
  const { data: services } = useSuspenseQuery(
    trpc.services.list.queryOptions()
  );

  return (
    <div className="bg-card rounded-xl border-2 border-border shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4 text-foreground">Services</h3>
      <ul className="space-y-3 mb-6">
        {services.map((s) => (
          <li key={s.id} className="border-2 border-border rounded-lg p-4 flex justify-between items-center hover:border-primary/50 transition-colors bg-background">
            <div>
              <div className="font-bold text-lg text-foreground">{s.name}</div>
              <div className="text-sm text-muted-foreground mt-1">
                ⏱️ {Math.round(s.durationMin)} min • 💰 €{(s.priceCents / 100).toFixed(2)}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                Edit
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 pt-6 border-t-2 border-border">
        <CreateServiceForm />
      </div>
    </div>
  );
}

function CreateServiceForm() {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const [priceCents, setPriceCents] = useState(2500);

  const { mutate: addService, isPending } = useMutation(
    trpc.services.add.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.services.list.queryKey(),
        });
      },
    })
  );

  async function submit(e: any) {
    e.preventDefault();
    try {
      const schema = z.object({
        name: z.string().min(1),
        durationMin: z.number().int().positive(),
        priceCents: z.number().int().nonnegative(),
      });
      const parsed = schema.parse({ name, durationMin: duration, priceCents });
      await addService(parsed);
      setName("");
      setDuration(30);
      setPriceCents(2500);
    } catch (err) {
      console.error(err);
      alert("Failed to create service");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h4 className="text-lg font-bold text-foreground">Add New Service</h4>
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Service Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Haircut"
          className="w-full border-2 border-border rounded-lg p-3 bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Duration (min)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            placeholder="30"
            className="w-full border-2 border-border rounded-lg p-3 bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Price (€)</label>
          <input
            type="number"
            step="0.01"
            value={(priceCents / 100).toFixed(2)}
            onChange={(e) =>
              setPriceCents(Math.round(Number(e.target.value) * 100))
            }
            placeholder="15.00"
            className="w-full border-2 border-border rounded-lg p-3 bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Creating..." : "➕ Create Service"}
        </button>
      </div>
    </form>
  );
}

function RouteComponent() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      navigate({ to: '/admin/login' });
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, redirect to login
      navigate({ to: '/admin/login' });
    }
  };

  return (
    <main className="min-h-screen bg-muted p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 bg-card p-6 rounded-xl shadow-lg border-2 border-border">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">🔧 Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your barber shop services</p>
          </div>
          <div className="flex gap-3">
            <a 
              href="/"
              className="px-4 py-2 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/70 transition-colors border-2 border-border"
            >
              ← Back to Site
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:bg-destructive/90 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border-2 border-border shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-foreground">📊 Quick Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4">
                  <div className="text-3xl font-bold text-primary">12</div>
                  <div className="text-sm text-muted-foreground mt-1">Today's Bookings</div>
                </div>
                <div className="bg-accent/10 border-2 border-accent/20 rounded-lg p-4">
                  <div className="text-3xl font-bold text-foreground">4</div>
                  <div className="text-sm text-muted-foreground mt-1">Services</div>
                </div>
                <div className="bg-secondary/10 border-2 border-secondary/20 rounded-lg p-4 col-span-2 md:col-span-1">
                  <div className="text-3xl font-bold text-foreground">€180</div>
                  <div className="text-sm text-muted-foreground mt-1">Today's Revenue</div>
                </div>
              </div>
            </div>
            {/* <DemoBookings /> */}
          </section>
          <aside className="lg:col-span-1">
            <Suspense fallback={
              <div className="bg-card rounded-xl border-2 border-border shadow-lg p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-muted rounded"></div>
                  <div className="h-20 bg-muted rounded"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              </div>
            }>
              <ServicesList />
            </Suspense>
          </aside>
        </div>
      </div>
    </main>
  );
}
