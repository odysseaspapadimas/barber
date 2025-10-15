import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc/react";
import type { StaffSelect } from "@/lib/types";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { Suspense, useState } from "react";
import { z } from "zod";

export const Route = createFileRoute("/admin/staff")({
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.staff.list.queryOptions()
    );
  },
  component: RouteComponent,
});

export default Route;

function RouteComponent() {
  return (
    <>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Team Management
          </h1>
          <p className="text-muted-foreground">
            Invite, update, and remove staff members from your barber shop.
          </p>
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
        <StaffContent />
      </Suspense>
    </>
  );
}

const staffFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Email must be valid"),
  phone: z
    .string()
    .trim()
    .max(32, "Phone cannot exceed 32 characters")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? undefined : value)),
  role: z.string().min(2, "Role must be at least 2 characters"),
  active: z.boolean(),
});

function StaffContent() {
  const trpc = useTRPC();
  const { data: staff } = useSuspenseQuery(trpc.staff.list.queryOptions());

  return (
    <div className="bg-card rounded-xl border-2 border-border shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4 text-foreground">Team</h3>
      <ul className="space-y-3 mb-6">
        {staff.length === 0 ? (
          <li className="border-2 border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
            No staff members yet. Invite your first teammate below.
          </li>
        ) : (
          staff.map((member) => <StaffRow key={member.id} member={member} />)
        )}
      </ul>
      <div className="mt-6 pt-6 border-t-2 border-border">
        <CreateStaffForm />
      </div>
    </div>
  );
}

function CreateStaffForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Stylist",
    active: true,
  });

  const { mutateAsync: createStaff, isPending } = useMutation(
    trpc.staff.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.staff.list.queryKey() });
        setForm({
          name: "",
          email: "",
          phone: "",
          role: "Stylist",
          active: true,
        });
      },
    })
  );

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const parsed = staffFormSchema.parse({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role.trim(),
        active: form.active,
      });

      await createStaff(parsed);
    } catch (err) {
      console.error(err);
      alert("Failed to create staff member. Please verify the details.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h4 className="text-lg font-bold text-foreground">Add Team Member</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Name
          </label>
          <input
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Full name"
            className="w-full border-2 border-border rounded-lg p-3 bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Email
          </label>
          <input
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="email@example.com"
            className="w-full border-2 border-border rounded-lg p-3 bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Phone (optional)
          </label>
          <input
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="+353 85 123 4567"
            className="w-full border-2 border-border rounded-lg p-3 bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Role
          </label>
          <input
            value={form.role}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, role: e.target.value }))
            }
            placeholder="Stylist"
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
        Active staff member
      </label>
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Creating..." : "➕ Add Team Member"}
        </button>
      </div>
    </form>
  );
}

function StaffRow({ member }: { member: StaffSelect }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: member.name,
    email: member.email,
    phone: member.phone ?? "",
    role: member.role ?? "Stylist",
    active: Boolean(member.active),
  });

  const updateStaff = useMutation(
    trpc.staff.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.staff.list.queryKey() });
        setIsEditing(false);
      },
    })
  );

  const deleteStaff = useMutation(
    trpc.staff.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.staff.list.queryKey() });
      },
    })
  );

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const parsed = staffFormSchema.parse({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role.trim(),
        active: form.active,
      });

      await updateStaff.mutateAsync({ id: member.id, ...parsed });
    } catch (err) {
      console.error(err);
      alert("Unable to update staff member. Please verify the fields.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove ${member.name} from your staff?`)) {
      return;
    }

    try {
      await deleteStaff.mutateAsync({ id: member.id });
    } catch (err) {
      console.error(err);
      alert("Failed to delete staff member");
    }
  }

  if (isEditing) {
    return (
      <li className="border-2 border-primary/40 rounded-lg p-4 bg-background">
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                Email
              </label>
              <input
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full border-2 border-border rounded-lg p-2 bg-background text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="w-full border-2 border-border rounded-lg p-2 bg-background text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Role
              </label>
              <input
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, role: e.target.value }))
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
                  name: member.name,
                  email: member.email,
                  phone: member.phone ?? "",
                  role: member.role ?? "Stylist",
                  active: Boolean(member.active),
                });
              }}
              className="px-3 py-1.5 border-2 border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateStaff.isPending}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {updateStaff.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="border-2 border-border rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between hover:border-primary/50 transition-colors bg-background">
      <div>
        <div className="font-bold text-lg text-foreground flex items-center gap-2">
          {member.name}
          {!member.active && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-muted text-muted-foreground rounded-full">
              Inactive
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground mt-1 space-y-1">
          <div>{member.email}</div>
          {member.phone && <div>📞 {member.phone}</div>}
          <div>Role: {member.role ?? "Stylist"}</div>
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
          disabled={deleteStaff.isPending}
          className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
