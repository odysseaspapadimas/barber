import { useTRPC } from "@/integrations/trpc/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Phone,
  Scissors,
  User,
} from "lucide-react";

export const Route = createFileRoute("/confirm/$bookingId")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.bookings.get.queryOptions({
        id: parseInt(params.bookingId),
      })
    );
  },
});

function RouteComponent() {
  const { bookingId } = Route.useParams();
  const trpc = useTRPC();

  const { data: booking } = useSuspenseQuery(
    trpc.bookings.get.queryOptions({
      id: parseInt(bookingId),
    })
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const formatDuration = (start: Date, end: Date) => {
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    return `${diffMins} minutes`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-muted-foreground">
            Your appointment has been successfully scheduled
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-card border-2 border-border rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Scissors className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Booking #{booking.id}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Confirmation Details
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Date & Time */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Date & Time
                </h3>
                <p className="text-lg text-foreground mb-1">
                  {formatDate(booking.startTs)}
                </p>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatTime(booking.startTs)} •{" "}
                  {formatDuration(booking.startTs, booking.endTs)}
                </p>
              </div>
            </div>

            {/* Service */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Scissors className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Service</h3>
                <p className="text-lg text-foreground">
                  {booking.service.name}
                </p>
                <p className="text-muted-foreground">
                  {booking.service.durationMin} minutes • $
                  {(booking.service.priceCents / 100).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Staff */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Stylist</h3>
                <p className="text-lg text-foreground">
                  {booking.staff?.name || "Auto-assigned"}
                </p>
                {booking.staff?.role && (
                  <p className="text-muted-foreground capitalize">
                    {booking.staff.role}
                  </p>
                )}
                {booking.staff?.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Phone className="w-3 h-3" />
                    {booking.staff.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Customer Details */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Customer Details
                </h3>
                <p className="text-lg text-foreground">
                  {booking.customerName}
                </p>
                {booking.customerContact && (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {booking.customerContact}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Book Another Appointment
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-border bg-background text-foreground rounded-lg font-semibold hover:bg-muted transition-colors"
          >
            Print Confirmation
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to your email address.
            <br />
            Please arrive 5-10 minutes before your appointment time.
          </p>
        </div>
      </div>
    </main>
  );
}
