import { useTRPC } from "@/integrations/trpc/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, MapPin, Scissors, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    // Calculate dates once in loader to ensure server/client consistency
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTs = tomorrow.getTime();

    await Promise.all([
      context.queryClient.prefetchQuery(
        context.trpc.services.list.queryOptions()
      ),
      context.queryClient.prefetchQuery(
        context.trpc.bookings.available.queryOptions({
          dateTs: todayTs,
        })
      ),
      context.queryClient.prefetchQuery(
        context.trpc.bookings.available.queryOptions({
          dateTs: tomorrowTs,
        })
      ),
    ]);

    // Return dates for component to use
    return { todayTs, tomorrowTs };
  },
  component: RouteComponent,
});

function ServiceCard({
  service,
}: {
  service: {
    id: number;
    name: string;
    durationMin: number;
    priceCents: number;
  };
}) {
  return (
    <Link
      to="/book"
      search={{ serviceId: service.id }}
      className="block border-2 border-border rounded-xl p-6 shadow-md bg-card hover:shadow-lg transition-all duration-200 hover:border-primary/50 hover:scale-[1.02]"
    >
      <div className="flex items-start justify-between mb-3">
        <Scissors className="w-6 h-6 text-primary" />
        <span className="text-sm font-semibold text-primary">
          €{(service.priceCents / 100).toFixed(2)}
        </span>
      </div>
      <h3 className="font-bold text-xl text-foreground mb-2">{service.name}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {service.durationMin} minutes
      </p>
      <div className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold text-center">
        Book Now
      </div>
    </Link>
  );
}

function TimeSlot({ time, available }: { time: string; available: boolean }) {
  return (
    <button
      disabled={!available}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        available
          ? "bg-muted text-foreground hover:bg-primary hover:text-primary-foreground"
          : "bg-muted/50 text-muted-foreground cursor-not-allowed"
      }`}
    >
      {time}
    </button>
  );
}

function RouteComponent() {
  const trpc = useTRPC();
  const { todayTs, tomorrowTs } = Route.useLoaderData();

  const { data: services } = useSuspenseQuery(
    trpc.services.list.queryOptions()
  );

  // Use dates from loader to ensure cache hits
  const today = new Date(todayTs);
  const tomorrow = new Date(tomorrowTs);

  const { data: availableSlots } = useSuspenseQuery(
    trpc.bookings.available.queryOptions({
      dateTs: todayTs,
    })
  );

  const { data: tomorrowSlots } = useSuspenseQuery(
    trpc.bookings.available.queryOptions({
      dateTs: tomorrowTs,
    })
  );

  // Generate time slots for display (9 AM to 6 PM)
  const generateTimeSlots = (date: Date, slots: typeof availableSlots) => {
    const slotsList = [];
    const now = Date.now();

    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);

        // Only include future slots
        if (slotTime.getTime() <= now) continue;

        // Check if this slot is available
        const isAvailable = slots.slots.some(
          (slot) =>
            slot.startTs <= slotTime.getTime() &&
            slot.endTs > slotTime.getTime()
        );

        slotsList.push({ time: timeString, available: isAvailable });
      }
    }
    return slotsList.slice(0, 8); // Show first 8 slots
  };

  // Use today's slots if there are future slots, otherwise use tomorrow's
  const todayFutureSlots = generateTimeSlots(today, availableSlots);
  const hasFutureSlotsToday = todayFutureSlots.length > 0;
  const timeSlots = hasFutureSlotsToday
    ? todayFutureSlots
    : generateTimeSlots(tomorrow, tomorrowSlots);
  const displayDate = hasFutureSlotsToday ? today : tomorrow;

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-4">
              ✂️ Kypseli Cuts
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Professional barber services in the heart of Kypseli. Fast,
              reliable, and no appointments needed for walk-ins.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/book"
                className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg"
              >
                Book Appointment
              </Link>
              <a
                href="#services"
                className="px-8 py-4 border-2 border-border bg-background text-foreground rounded-xl font-semibold text-lg hover:bg-muted transition-colors"
              >
                View Services
              </a>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Quick Service</h3>
                <p className="text-sm text-muted-foreground">
                  30-60 minute appointments
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Local</h3>
                <p className="text-sm text-muted-foreground">
                  Located in Kypseli
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Walk-ins Welcome
                </h3>
                <p className="text-sm text-muted-foreground">
                  No appointment needed
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Main Content */}
          <section className="lg:col-span-2 space-y-8 md:space-y-12">
            {/* Services Section */}
            <div id="services">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Our Services
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Choose from our range of professional barber services. All
                  prices include consultation and styling.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {services
                  .filter((service) => service.active)
                  .map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
              </div>
            </div>

            {/* Available Today */}
            <div className="bg-card border-2 border-border rounded-2xl p-6 md:p-8 shadow-xl">
              <div className="text-center mb-6">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {hasFutureSlotsToday
                    ? "Available Today"
                    : "Available Tomorrow"}
                </h3>
                <p className="text-muted-foreground">
                  {displayDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {timeSlots.map((slot, index) => (
                  <TimeSlot
                    key={index}
                    time={slot.time}
                    available={slot.available}
                  />
                ))}
              </div>
              <div className="text-center mt-6">
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  View All Available Times
                </Link>
              </div>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Quick Book */}
              <div className="p-6 md:p-8 bg-card rounded-2xl shadow-xl border-2 border-border">
                <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground">
                  Ready to Book?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Select a service and time to reserve your slot. No account
                  required.
                </p>
                <Link
                  to="/book"
                  className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors inline-block text-center shadow-lg"
                >
                  Start Booking
                </Link>
              </div>

              {/* Contact Info */}
              <div className="p-6 bg-muted/50 rounded-2xl border border-border">
                <h4 className="font-semibold text-foreground mb-3">Visit Us</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>📍 Kypseli, Athens</p>
                  <p>📞 +30 210 123 4567</p>
                  <p>🕒 Mon-Sat: 9:00-18:00</p>
                  <p>❌ Sun: Closed</p>
                </div>
              </div>

              {/* Admin Link */}
              <div className="text-center">
                <a
                  href="/admin"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Admin Panel →
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
