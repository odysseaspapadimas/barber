import { createFileRoute } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/trpc/react";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Pending } from "@/components/ui/pending";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { RouterOutput } from "@/lib/types";

export const Route = createFileRoute("/admin/")({
  loader: async ({ context }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await context.queryClient.prefetchQuery(
      context.trpc.bookings.list.queryOptions({
        fromTs: today.getTime(),
        toTs: tomorrow.getTime(),
      })
    );

    await context.queryClient.prefetchQuery(
      context.trpc.bookings.list.queryOptions()
    );
  },
  component: RouteComponent,
  pendingComponent: () => <Pending />,
});

function RouteComponent() {
  const trpc = useTRPC();
  const [activeTab, setActiveTab] = useState("upcoming");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: todayBookings } = useSuspenseQuery(
    trpc.bookings.list.queryOptions({
      fromTs: today.getTime(),
      toTs: tomorrow.getTime(),
    })
  );

  const { data: allBookings } = useSuspenseQuery(
    trpc.bookings.list.queryOptions()
  );

  const upcomingBookings = allBookings.filter(
    (b) => b.status === "confirmed" && b.startTs > new Date()
  );

  const cancelledBookings = allBookings.filter((b) => b.status === "cancelled");

  const getStatsForTab = (tab: string) => {
    switch (tab) {
      case "upcoming":
        return {
          primary: { count: todayBookings.length, label: "Today's Bookings" },
          secondary: {
            count: upcomingBookings.length,
            label: "Upcoming Bookings",
          },
          tertiary: { count: allBookings.length, label: "Total Bookings" },
        };
      case "all":
        return {
          primary: { count: allBookings.length, label: "Total Bookings" },
          secondary: {
            count: cancelledBookings.length,
            label: "Cancelled Bookings",
          },
          tertiary: {
            count: upcomingBookings.length,
            label: "Active Bookings",
          },
        };
      default:
        return {
          primary: { count: todayBookings.length, label: "Today's Bookings" },
          secondary: {
            count: upcomingBookings.length,
            label: "Upcoming Bookings",
          },
          tertiary: { count: allBookings.length, label: "Total Bookings" },
        };
    }
  };

  const stats = getStatsForTab(activeTab);

  return (
    <div className="space-y-6">
      <section className="space-y-6">
        <div className="bg-card rounded-xl border-2 border-border shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-foreground">
            📊 Quick Stats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4">
              <div className="text-3xl font-bold text-primary">
                {stats.primary.count}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stats.primary.label}
              </div>
            </div>
            <div className="bg-accent/10 border-2 border-accent/20 rounded-lg p-4">
              <div className="text-3xl font-bold text-foreground">
                {stats.secondary.count}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stats.secondary.label}
              </div>
            </div>
            <div className="bg-secondary/10 border-2 border-secondary/20 rounded-lg p-4 col-span-2 md:col-span-1">
              <div className="text-3xl font-bold text-foreground">
                {stats.tertiary.count}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stats.tertiary.label}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card rounded-xl border-2 border-border shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">
            📅 Manage Bookings
          </h2>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming Bookings</TabsTrigger>
            <TabsTrigger value="all">All Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            <BookingsTable
              bookings={upcomingBookings}
              emptyMessage="No upcoming bookings"
              showCount={upcomingBookings.length > 10}
              totalCount={upcomingBookings.length}
            />
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <BookingsTable
              bookings={allBookings}
              emptyMessage="No bookings found"
              showCount={allBookings.length > 10}
              totalCount={allBookings.length}
            />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

function BookingsTable({
  bookings,
  emptyMessage,
  showCount,
  totalCount,
}: {
  bookings: RouterOutput["bookings"]["list"];
  emptyMessage: string;
  showCount: boolean;
  totalCount: number;
}) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold">Customer</th>
              <th className="text-left py-3 px-4 font-semibold">Service</th>
              <th className="text-left py-3 px-4 font-semibold">Staff</th>
              <th className="text-left py-3 px-4 font-semibold">Date & Time</th>
              <th className="text-left py-3 px-4 font-semibold">Status</th>
              <th className="text-right py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings
                .slice(0, 10)
                .map((booking) => (
                  <BookingRow key={booking.id} booking={booking} />
                ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCount && (
        <p className="text-xs text-muted-foreground mt-4">
          Showing 10 of {totalCount} bookings
        </p>
      )}
    </>
  );
}

function BookingRow({
  booking,
}: {
  booking: RouterOutput["bookings"]["list"][number];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const cancelMutation = useMutation(
    trpc.bookings.cancel.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.bookings.list.queryKey(),
        });
      },
    })
  );

  const formatDate = (ts: Date) => {
    const d = new Date(ts);
    return (
      d.toLocaleDateString() +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const handleCancel = async () => {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      try {
        await cancelMutation.mutateAsync({ id: booking.id });
      } catch (error) {
        alert("Failed to cancel appointment. Please try again.");
      }
    }
  };

  return (
    <tr className="border-b border-border/50 hover:bg-accent/5 transition-colors">
      <td className="py-3 px-4">
        <div>
          <div className="font-medium">{booking.customerName}</div>
          <div className="text-sm text-muted-foreground">{booking.customerContact}</div>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="font-medium">{booking.service?.name || "Unknown Service"}</div>
        <div className="text-sm text-muted-foreground">
          {booking.service ? `${booking.service.durationMin} min` : ""}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="font-medium">{booking.staff?.name || "Auto-assigned"}</div>
        <div className="text-sm text-muted-foreground">
          {booking.staff?.role || ""}
        </div>
      </td>
      <td className="py-3 px-4 text-sm">{formatDate(booking.startTs)}</td>
      <td className="py-3 px-4">
        <span
          className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${
            booking.status === "confirmed"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
              : booking.status === "cancelled"
              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
          }`}
        >
          {booking.status}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex gap-2 justify-end">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                View
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Booking Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Customer
                  </p>
                  <p>{booking.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Contact
                  </p>
                  <p>{booking.customerContact}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Service
                  </p>
                  <p>{booking.service?.name || "Unknown Service"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Staff
                  </p>
                  <p>{booking.staff?.name || "Auto-assigned"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Date & Time
                  </p>
                  <p>{formatDate(booking.startTs)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <p className="capitalize">{booking.status}</p>
                </div>
                {booking.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Notes
                    </p>
                    <p>{booking.notes}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          {booking.status === "confirmed" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel"}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default Route;
