import { Pending } from "@/components/ui/pending";
import { useTRPC } from "@/integrations/trpc/react";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-form";
import { toast } from "sonner";
import { useAppForm } from "@/hooks/form";
import { bookingFormSchema } from "@/lib/types";
import { z } from "zod";

const searchSchema = z.object({
  serviceId: z.number().optional(),
});

export const Route = createFileRoute("/book")({
  validateSearch: searchSchema,
  component: RouteComponent,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(
        context.trpc.services.list.queryOptions()
      ),
      context.queryClient.prefetchQuery(context.trpc.staff.list.queryOptions()),
    ]);
  },
  pendingComponent: () => <Pending message="Loading booking flow…" />,
});

function RouteComponent() {
  const { serviceId: selectedServiceIdFromUrl } = Route.useSearch();
  const trpc = useTRPC();
  const { data: services } = useSuspenseQuery(
    trpc.services.list.queryOptions()
  );
  const { data: staff } = useSuspenseQuery(trpc.staff.list.queryOptions());

  const form = useAppForm({
    defaultValues: {
      date: "",
      serviceId: selectedServiceIdFromUrl || null as number | null,
      staffId: null as number | null,
      startTs: null as number | null,
      customerName: "",
      customerContact: "",
    },
    validators: {
      onChange: bookingFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          serviceId: value.serviceId!,
          startTs: new Date(value.startTs!),
          staffId: value.staffId!,
          customerName: value.customerName,
          customerContact: value.customerContact,
        };
        await createBooking.mutateAsync(payload);
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to create booking");
        await refetch();
      }
    },
  });

  const selectedDate = useStore(form.store, (state) => state.values.date);
  const selectedServiceId = useStore(
    form.store,
    (state) => state.values.serviceId
  );
  const selectedStaffId = useStore(form.store, (state) => state.values.staffId);

  const {
    data: available,
    refetch,
    isLoading: isLoadingSlots,
  } = useQuery({
    ...trpc.bookings.available.queryOptions({
      dateTs: selectedDate ? new Date(selectedDate + "T00:00:00Z").getTime() : 0,
      serviceId: selectedServiceId ?? 0,
      staffId: selectedStaffId ?? undefined,
    }),
    enabled: !!(
      selectedDate &&
      selectedServiceId &&
      selectedStaffId &&
      selectedServiceId > 0 &&
      selectedStaffId > 0
    ),
  });

  const createBooking = useMutation(
    trpc.bookings.create.mutationOptions({
      onSuccess: (res) => {
        window.location.href = `/confirm/${res.id}`;
      },
    })
  );

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Book a Service</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="md:col-span-2 space-y-6">
            <section className="bg-card border-2 border-border rounded-xl p-6">
              <form.AppField name="date">
                {(f) => <f.DateField label="Date" />}
              </form.AppField>
            </section>

            <section className="bg-card border-2 border-border rounded-xl p-6">
              <form.AppField name="serviceId">
                {(f) => (
                  <f.ServiceField
                    label="Choose a Service"
                    services={services}
                  />
                )}
              </form.AppField>
            </section>

            <section className="bg-card border-2 border-border rounded-xl p-6">
              <form.AppField name="staffId">
                {(f) => <f.StaffField label="Choose a Staff" staff={staff} />}
              </form.AppField>
            </section>

            <section className="bg-card border-2 border-border rounded-xl p-6">
              <form.AppField name="startTs">
                {(f) => (
                  <f.TimeField
                    label="Available times"
                    availableSlots={available}
                    isLoading={isLoadingSlots}
                  />
                )}
              </form.AppField>
            </section>
          </div>

          <aside>
            <div className="bg-card border-2 border-border rounded-xl p-6">
              <h3 className="font-bold mb-3">Customer Details</h3>
              <div className="space-y-4">
                <form.AppField name="customerName">
                  {(f) => <f.TextField label="Name" />}
                </form.AppField>
                <form.AppField name="customerContact">
                  {(f) => <f.TextField label="Phone" />}
                </form.AppField>

                <div className="flex justify-end pt-4">
                  <form.AppForm>
                    <form.SubscribeButton label="Book" />
                  </form.AppForm>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
