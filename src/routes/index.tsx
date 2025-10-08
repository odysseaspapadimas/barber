import BookingForm from '../components/BookingForm';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function ServiceCard({ title, duration, price }: { title: string; duration: string; price: string }) {
  return (
    <div className="border-2 border-border rounded-xl p-6 shadow-md bg-card hover:shadow-lg transition-shadow duration-200 hover:border-primary/50">
      <h3 className="font-bold text-xl text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{duration} • {price}</p>
      <button className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
        Select Service
      </button>
    </div>
  );
}

function RouteComponent() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8 md:mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">✂️ Kypseli Cuts</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Fast, local barber bookings in Kypseli</p>
          </div>
          <nav>
            <a href="/admin" className="text-sm md:text-base text-primary hover:text-primary/80 font-medium transition-colors">
              Admin Panel →
            </a>
          </nav>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <section className="lg:col-span-2 space-y-6 md:space-y-8">
            <div className="rounded-2xl p-6 md:p-8 bg-primary text-primary-foreground shadow-xl border-2 border-primary">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Κλείσε ραντεβού σήμερα</h2>
              <p className="text-base md:text-lg opacity-95 max-w-xl mb-6">
                Pick a service, choose a time, and confirm — all in under a minute. No accounts required.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-primary-foreground/10 backdrop-blur-sm p-4 rounded-lg border border-primary-foreground/20">
                  <span className="text-2xl">💈</span>
                  <p className="mt-2 font-medium">Walk-ins welcome</p>
                </div>
                <div className="bg-primary-foreground/10 backdrop-blur-sm p-4 rounded-lg border border-primary-foreground/20">
                  <span className="text-2xl">⏱️</span>
                  <p className="mt-2 font-medium">Quick 30–60 min</p>
                </div>
                <div className="bg-primary-foreground/10 backdrop-blur-sm p-4 rounded-lg border border-primary-foreground/20">
                  <span className="text-2xl">📍</span>
                  <p className="mt-2 font-medium">Located in Kypseli</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-foreground">Our Services</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <ServiceCard title="Haircut" duration="30 min" price="€15" />
                <ServiceCard title="Beard Trim" duration="20 min" price="€10" />
                <ServiceCard title="Deluxe Cut" duration="50 min" price="€30" />
                <ServiceCard title="Kids Cut" duration="25 min" price="€12" />
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-xl p-6 shadow-md">
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-foreground">Available Today</h3>
              <div className="flex gap-2 md:gap-3 flex-wrap">
                <button className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                  09:00
                </button>
                <button className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                  09:30
                </button>
                <button className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                  10:00
                </button>
                <button className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                  10:30
                </button>
                <button className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                  11:00
                </button>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-1">
            <div className="sticky top-6 p-6 md:p-8 bg-card rounded-2xl shadow-xl border-2 border-border">
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-foreground">Book Now</h3>
              <p className="text-sm md:text-base text-muted-foreground mb-6">
                Select a service and time to reserve your slot.
              </p>
              <BookingForm onSubmit={(d) => console.log('book', d)} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
