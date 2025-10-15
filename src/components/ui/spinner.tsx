import { cn } from "@/lib/utils";

function Spinner({ className, size = 5 }: { className?: string; size?: number }) {
  // size is Tailwind size (1..10 mapped to h-{size} w-{size})
  return (
    <svg
      className={cn(
        `animate-spin text-primary/80 dark:text-primary-400 h-${size} w-${size}`,
        className
      )}
      viewBox="0 0 24 24"
      fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export { Spinner };
