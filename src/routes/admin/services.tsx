import { queryClient, trpc } from "@/integrations/tanstack-query/root-provider";
import type { Service } from "@/lib/types";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { Suspense, useState } from "react";
import { Pending } from "@/components/ui/pending";
import { z } from "zod";

export const Route = createFileRoute("/admin/services")({
  component: RouteComponent,
  pendingComponent: () => <Pending />,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.services.list.queryOptions()
    );
  },
});

const serviceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  durationMin: z.number().int().positive("Duration must be positive"),
  price: z.number().min(0, "Price must be zero or greater"),
  active: z.boolean(),
});

const currencyFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

function ServicesList() {
  const { data: services } = useSuspenseQuery(
    trpc.services.list.queryOptions()
  );

  return (
    <div className="bg-card rounded-xl border-2 border-border shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4 text-foreground">Services</h3>
      <ul className="space-y-3 mb-6">
        {services.length === 0 ? (
          <li className="border-2 border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
            No services yet. Use the form below to create your first offer.
          </li>
        ) : (
          services.map((service) => (
            <ServiceRow key={service.id} service={service} />
          ))
        )}
      </ul>
      <div className="mt-6 pt-6 border-t-2 border-border">
        <CreateServiceForm />
      </div>
    </div>
  );
}

function CreateServiceForm() {
  const [form, setForm] = useState({
    name: "",
    durationMin: "30",
    price: "25.00",
    active: true,
  });

  const { mutateAsync: addService, isPending } = useMutation(
    trpc.services.add.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.services.list.queryKey(),
        });
        setForm({ name: "", durationMin: "30", price: "25.00", active: true });
      },
    })
  );

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const parsed = serviceFormSchema.parse({
        name: form.name.trim(),
        durationMin: Number(form.durationMin),
        price: Number(form.price),
        active: form.active,
      });

      await addService({
        name: parsed.name,
        durationMin: parsed.durationMin,
        priceCents: Math.round(parsed.price * 100),
        active: parsed.active,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create service. Please check your inputs.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h4 className="text-lg font-bold text-foreground">Add New Service</h4>
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Service Name
        </label>
        <input
          value={form.name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="e.g., Haircut"
          className="w-full border-2 border-border rounded-lg p-3 bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Duration (min)
          </label>
          <input
            type="number"
            value={form.durationMin}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, durationMin: e.target.value }))
            }
            placeholder="30"
            className="w-full border-2 border-border rounded-lg p-3 bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Price (€)
          </label>
          <input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, price: e.target.value }))
            }
            placeholder="15.00"
            className="w-full border-2 border-border rounded-lg p-3 bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, active: e.target.checked }))
          }
          className="h-4 w-4"
        />
        Active offering
      </label>
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Creating..." : "\u2795 Create Service"}
        </button>
      </div>
    </form>
  );
}

function RouteComponent() {
  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Services</h1>
          <p className="text-muted-foreground">Create and manage offerings</p>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="bg-card rounded-xl border-2 border-border shadow-lg p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded"></div>
              <div className="h-24 bg-muted rounded"></div>
              <div className="h-24 bg-muted rounded"></div>
            </div>
          </div>
        }
      >
        <ServicesList />
      </Suspense>
    </div>
  );
}

function ServiceRow({ service }: { service: Service }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: service.name,
    durationMin: String(service.durationMin),
    price: (service.priceCents / 100).toFixed(2),
    active: service.active,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.services.list.queryKey(),
    });

  const updateService = useMutation(
    trpc.services.update.mutationOptions({
      onSuccess: () => {
        invalidate();
        setIsEditing(false);
      },
    })
  );

  const deleteService = useMutation(
    trpc.services.remove.mutationOptions({
      onSuccess: () => {
        invalidate();
      },
    })
  );

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const parsed = serviceFormSchema.parse({
        name: form.name.trim(),
        durationMin: Number(form.durationMin),
        price: Number(form.price),
        active: form.active,
      });

      await updateService.mutateAsync({
        id: service.id,
        name: parsed.name,
        durationMin: parsed.durationMin,
        priceCents: Math.round(parsed.price * 100),
        active: parsed.active,
      });
    } catch (err) {
      console.error(err);
      alert("Unable to update service. Please review your changes.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${service.name}? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteService.mutateAsync({ id: service.id });
    } catch (err) {
      console.error(err);
      alert("Failed to delete service");
    }
  }

  if (isEditing) {
    return (
      <li className="border-2 border-primary/40 rounded-lg p-4 bg-background">
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full border-2 border-border rounded-lg p-2 bg-background text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Duration (min)
              </label>
              <input
                type="number"
                value={form.durationMin}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, durationMin: e.target.value }))
                }
                className="w-full border-2 border-border rounded-lg p-2 bg-background text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Price (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: e.target.value }))
                }
                className="w-full border-2 border-border rounded-lg p-2 bg-background text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, active: e.target.checked }))
                }
                className="h-4 w-4"
              />
              <span className="text-sm text-foreground">Active</span>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setForm({
                  name: service.name,
                  durationMin: String(service.durationMin),
                  price: (service.priceCents / 100).toFixed(2),
                  active: service.active,
                });
              }}
              className="px-3 py-1.5 border-2 border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateService.isPending}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {updateService.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="border-2 border-border rounded-lg p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:border-primary/50 transition-colors bg-background">
      <div>
        <div className="font-bold text-lg text-foreground flex items-center gap-2">
          {service.name}
          {!service.active && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-muted text-muted-foreground rounded-full">
              Inactive
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          ⏱️ {service.durationMin} min • 💰 {currencyFormatter.format(service.priceCents / 100)}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setIsEditing(true)}
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={deleteService.isPending}
          className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export default Route;
