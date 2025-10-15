import { createFileRoute } from "@tanstack/react-router";
import { Pending } from "@/components/ui/pending";

export const Route = createFileRoute("/admin/")({
  component: RouteComponent,
  pendingComponent: () => <Pending />,
});
function RouteComponent() {
  return (
    <div className="">
      <section className="lg:col-span-2 space-y-6">
        <div className="bg-card rounded-xl border-2 border-border shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-foreground">
            📊 Quick Stats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4">
              <div className="text-3xl font-bold text-primary">—</div>
              <div className="text-sm text-muted-foreground mt-1">
                Today's Bookings
              </div>
            </div>
            <div className="bg-accent/10 border-2 border-accent/20 rounded-lg p-4">
              <div className="text-3xl font-bold text-foreground">—</div>
              <div className="text-sm text-muted-foreground mt-1">Services</div>
            </div>
            <div className="bg-secondary/10 border-2 border-secondary/20 rounded-lg p-4 col-span-2 md:col-span-1">
              <div className="text-3xl font-bold text-foreground">—</div>
              <div className="text-sm text-muted-foreground mt-1">
                Today's Revenue
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Route;
