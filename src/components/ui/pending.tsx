import { Spinner } from "./spinner";

function Pending({
  message,
  size = 6,
}: {
  message?: string;
  size?: number;
}) {
  return (
    <div className="bg-card rounded-xl border-2 border-border shadow-lg p-6 flex items-center justify-center">
      <div className="flex items-center gap-4">
        <Spinner size={size} />
        <div className="text-foreground text-sm">{message ?? "Loading..."}</div>
      </div>
    </div>
  );
}

export { Pending };
