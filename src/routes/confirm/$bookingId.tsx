import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/confirm/$bookingId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { bookingId } = Route.useParams();

  return (
    <main>
      <h1>Booking Confirmed</h1>
      <p>Your booking id: {bookingId}</p>
    </main>
  );
}
