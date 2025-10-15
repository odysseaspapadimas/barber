import BookingForm from "@/components/BookingForm";
import { createFileRoute } from "@tanstack/react-router";
import { useState, Suspense } from "react";
import { useQuery, useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Pending } from "@/components/ui/pending";
import { useTRPC } from "@/integrations/trpc/react";

export const Route = createFileRoute("/book")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.services.list.queryOptions()
    );
  },
  pendingComponent: () => <Pending message="Loading booking flow…" />,
});

function formatTime(ms: number) {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function RouteComponent() {
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [chosenSlot, setChosenSlot] = useState<number | null>(null);

  const trpc = useTRPC();
  const { data: services } = useSuspenseQuery(
    trpc.services.list.queryOptions()
  );

  const availableBaseOptions = trpc.bookings.available.queryOptions({
    dateTs: new Date(selectedDate + "T00:00:00Z").getTime(),
    serviceId: selectedService ?? 0,
  });

  const { data: available, refetch } = useQuery({
    ...availableBaseOptions,
    enabled: !!selectedService,
  });

  const createBooking = useMutation(
    trpc.bookings.create.mutationOptions({
      onSuccess: (res) => {
        window.location.href = `/confirm/${res.id}`;
      },
    })
  );

  function handleSlotSelect(startTs: number) {
    setChosenSlot(startTs);
  }

  async function handleSubmit(data: any) {
    if (!selectedService || !chosenSlot)
      return alert("Select a service and slot first");
    try {
      await createBooking.mutateAsync({
        serviceId: selectedService,
        startTs: chosenSlot,
        customerName: data.name,
        customerContact: data.phone,
      });
    } catch (err: any) {
      alert(err?.message ?? "Failed to create booking");
      await refetch();
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Book a Service</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <section className="bg-card border-2 border-border rounded-xl p-6 mb-6">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Service
              </label>
              <select
                className="w-full border-2 border-border rounded-lg p-3 bg-background text-foreground"
                value={selectedService ?? ""}
                onChange={(e) =>
                  setSelectedService(Number(e.target.value) || null)
                }
              >
                <option value="">Choose a service…</option>
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.durationMin} min
                  </option>
                ))}
              </select>
            </section>

            <section className="bg-card border-2 border-border rounded-xl p-6 mb-6">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Date
              </label>
              <input
                type="date"
                className="w-full border-2 border-border rounded-lg p-3 bg-background text-foreground"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </section>

            <section className="bg-card border-2 border-border rounded-xl p-6">
              <h3 className="font-bold mb-3">Available slots</h3>
              {!selectedService ? (
                <div className="text-muted-foreground">
                  Please select a service to see slots.
                </div>
              ) : !available ? (
                <div className="text-muted-foreground">Loading slots…</div>
              ) : available.slots.length === 0 ? (
                <div className="text-muted-foreground">
                  No available slots for that day.
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {available.slots.map((slot: any) => (
                    <button
                      key={slot.startTs}
                      onClick={() => handleSlotSelect(slot.startTs)}
                      className={`px-4 py-2 rounded-lg ${
                        chosenSlot === slot.startTs
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {formatTime(slot.startTs)} • Staff {slot.staffId}
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside>
            <div className="bg-card border-2 border-border rounded-xl p-6">
              <h3 className="font-bold mb-3">Confirm booking</h3>
              <Suspense fallback={<Pending message="Loading form…" />}>
                <BookingForm onSubmit={handleSubmit} />
              </Suspense>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
