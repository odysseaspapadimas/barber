import AdminHeader from "@/components/admin/AdminHeader";
import { Pending } from "@/components/ui/pending";
import { $getSession } from "../../integrations/trpc/routers/functions";
import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location, context }) => {
    // Allow access to login page without authentication
    if (
      location.pathname === "/admin/login" ||
      location.pathname === "/admin/signup"
    ) {
      return;
    }

    const { session } = await $getSession(context.queryClient);

    if (!session) {
      throw redirect({
        to: "/admin/login",
      });
    }
  },
  component: RouteComponent,
  pendingComponent: () => <Pending />,
});

function RouteComponent() {
  const location = useLocation();

  // Exclude header from login and signup pages
  if (
    location.pathname === "/admin/login" ||
    location.pathname === "/admin/signup"
  ) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background container mx-auto px-4 py-6">
      <AdminHeader />
      <main className="">
        <Outlet />
      </main>
    </div>
  );
}
