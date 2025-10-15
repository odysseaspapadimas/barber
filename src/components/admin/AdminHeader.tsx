import { Link, useLocation } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/trpc/react";

const AdminHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const trpc = useTRPC();
  const logoutMutation = useMutation(
    trpc.auth.logout.mutationOptions({
      onSuccess: () => {
        // Cookie is cleared automatically by Better Auth's reactStartCookies plugin
        navigate({ to: "/admin/login" });
      },
      onError: (error) => {
        console.error("Logout failed:", error);
        // Even if logout fails, redirect to login
        navigate({ to: "/admin/login" });
      },
    })
  );

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your barber shop services
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/"
            className="px-3 py-2 bg-muted text-foreground rounded-md font-medium hover:bg-muted/80 transition-colors border border-border"
          >
            ← Back to Site
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-destructive text-destructive-foreground rounded-md font-medium hover:bg-destructive/90 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      <nav className="flex border-b border-border">
        <Link
          to="/admin"
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            isActive("/admin")
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Dashboard
        </Link>
        <Link
          to="/admin/staff"
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            isActive("/admin/staff")
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Manage Staff
        </Link>
        <Link
          to="/admin/schedules"
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            isActive("/admin/schedules")
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Manage Schedules
        </Link>
        <Link
          to="/admin/services"
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            isActive("/admin/services")
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Manage Services
        </Link>
      </nav>
    </header>
  );
};
export default AdminHeader;
