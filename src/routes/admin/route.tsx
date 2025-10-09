import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { auth } from "@/lib/auth";

const checkAuthFn = createServerFn({ method: "GET" }).handler(async () => {
  const session = await auth.api.getSession({
    headers: new Headers(),
  });

  console.log(session, "session");

  if (!session) {
    throw redirect({
      to: "/admin/login",
    });
  }

  return { session };
});

export const Route = createFileRoute("/admin")({
  
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
