import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc/react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pending } from "@/components/ui/pending";
import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TimeInput, formatMinutesToTime } from "@/components/ui/time-input";
import { WeekdaySelector, formatWeekdays } from "@/components/ui/weekday-selector";
import { PlusIcon, Trash2Icon, ClockIcon, CalendarIcon } from "lucide-react";

export const Route = createFileRoute("/admin/schedules")({
  component: RouteComponent,
  pendingComponent: () => <Pending />,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.schedules.list.queryOptions()
    );
    await context.queryClient.prefetchQuery(
      context.trpc.staff.list.queryOptions()
    );
  },
});

const scheduleSchema = z.object({
  staffId: z.number().int().positive(),
  weekdays: z.array(z.number().min(0).max(6)).min(1),
  startMin: z
    .number()
    .min(0)
    .max(24 * 60 - 1),
  endMin: z
    .number()
    .min(1)
    .max(24 * 60),
  slotIntervalMin: z.number().min(1),
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: schedules } = useSuspenseQuery(
    trpc.schedules.list.queryOptions()
  );

  const { data: staffList } = useSuspenseQuery(trpc.staff.list.queryOptions());

  // Group schedules by staff
  const schedulesByStaff = schedules.reduce((acc: any, schedule: any) => {
    if (!acc[schedule.staffId]) {
      acc[schedule.staffId] = [];
    }
    acc[schedule.staffId].push(schedule);
    return acc;
  }, {});

  return (
    <>
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Staff Schedules</h1>
          <p className="text-muted-foreground">
            Manage recurring weekly work schedules
          </p>
        </div>
        <CreateScheduleDialog staffList={staffList || []} />
      </header>

      <div className="space-y-4">
        {staffList && staffList.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                No staff members found. Add staff first to create schedules.
              </p>
            </CardContent>
          </Card>
        ) : (
          staffList?.map((staff: any) => (
            <Card key={staff.id}>
              <CardHeader>
                <CardTitle>{staff.name}</CardTitle>
                <CardDescription>
                  {staff.email || "No email"} • {staff.role}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {schedulesByStaff[staff.id]?.length > 0 ? (
                  <div className="space-y-3">
                    {schedulesByStaff[staff.id].map((schedule: any) => (
                      <ScheduleRow
                        key={schedule.id}
                        schedule={schedule}
                        staff={staff}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No schedule defined yet
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}

function ScheduleRow({
  schedule,
}: {
  schedule: any;
  staff: any;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  async function handleDelete() {
    if (!confirm("Delete this schedule?")) return;
    await del.mutateAsync({ id: schedule.id });
  }

  const del = useMutation(
    trpc.schedules.delete.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.schedules.list.queryKey() }),
    })
  );

  return (
    <div className="border-2 border-border rounded-lg p-4 flex justify-between items-start hover:bg-accent/50 transition-colors">
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarIcon className="w-4 h-4 text-primary" />
          <span>{formatWeekdays(schedule.weekdays)}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ClockIcon className="w-3.5 h-3.5" />
            <span>
              {formatMinutesToTime(schedule.startMin)} -{" "}
              {formatMinutesToTime(schedule.endMin)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium">Slots:</span>
            <span>{schedule.slotIntervalMin} min intervals</span>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={del.isPending}
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2Icon className="w-4 h-4" />
      </Button>
    </div>
  );
}

function CreateScheduleDialog({ staffList }: { staffList: any[] }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    staffId: 0,
    weekdays: [] as number[],
    startMin: 540, // 9:00 AM
    endMin: 1020, // 5:00 PM
    slotIntervalMin: 30,
  });
  const [error, setError] = useState("");

  const create = useMutation(
    trpc.schedules.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.schedules.list.queryKey(),
        });
        setOpen(false);
        setForm({
          staffId: 0,
          weekdays: [],
          startMin: 540,
          endMin: 1020,
          slotIntervalMin: 30,
        });
        setError("");
      },
      onError: (err) => {
        setError(err.message || "Failed to create schedule");
      },
    })
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    
    try {
      const parsed = scheduleSchema.parse(form);
      
      if (parsed.startMin >= parsed.endMin) {
        setError("End time must be after start time");
        return;
      }
      
      await create.mutateAsync(parsed);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0]?.message || "Invalid schedule data");
      } else {
        setError("Failed to create schedule");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Schedule</DialogTitle>
            <DialogDescription>
              Set up a recurring weekly schedule for a staff member
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div>
              <Label className="block text-sm font-semibold mb-2">
                Staff Member
              </Label>
              <select
                value={form.staffId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, staffId: Number(e.target.value) }))
                }
                className="w-full p-2 border-2 border-border rounded-lg bg-background"
                required
              >
                <option value={0}>Select staff...</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <WeekdaySelector
              value={form.weekdays}
              onChange={(weekdays) => setForm((p) => ({ ...p, weekdays }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <TimeInput
                label="Start Time"
                value={form.startMin}
                onChange={(startMin) => setForm((p) => ({ ...p, startMin }))}
              />
              <TimeInput
                label="End Time"
                value={form.endMin}
                onChange={(endMin) => setForm((p) => ({ ...p, endMin }))}
              />
            </div>

            <div>
              <Label className="block text-sm font-semibold mb-2">
                Appointment Slot Duration
              </Label>
              <select
                value={form.slotIntervalMin}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    slotIntervalMin: Number(e.target.value),
                  }))
                }
                className="w-full p-2 border-2 border-border rounded-lg bg-background"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating..." : "Create Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
