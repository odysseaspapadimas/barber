import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface WeekdaySelectorProps {
  value: number[]; // Array of weekday numbers (0-6, where 0=Sunday)
  onChange: (weekdays: number[]) => void;
  className?: string;
}

const WEEKDAYS = [
  { value: 1, label: "Mon", fullName: "Monday" },
  { value: 2, label: "Tue", fullName: "Tuesday" },
  { value: 3, label: "Wed", fullName: "Wednesday" },
  { value: 4, label: "Thu", fullName: "Thursday" },
  { value: 5, label: "Fri", fullName: "Friday" },
  { value: 6, label: "Sat", fullName: "Saturday" },
  { value: 0, label: "Sun", fullName: "Sunday" },
];

/**
 * WeekdaySelector - A user-friendly component for selecting multiple days of the week
 * Uses checkboxes with day names instead of numeric input
 */
export function WeekdaySelector({ value, onChange, className }: WeekdaySelectorProps) {
  const handleToggle = (weekday: number) => {
    if (value.includes(weekday)) {
      onChange(value.filter((d) => d !== weekday));
    } else {
      onChange([...value, weekday].sort());
    }
  };

  return (
    <div className={className}>
      <Label className="block text-sm font-semibold mb-2">Working Days</Label>
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day.value}
            className="flex flex-col items-center gap-1.5"
          >
            <Checkbox
              id={`weekday-${day.value}`}
              checked={value.includes(day.value)}
              onCheckedChange={() => handleToggle(day.value)}
            />
            <label
              htmlFor={`weekday-${day.value}`}
              className="text-xs font-medium cursor-pointer select-none"
              title={day.fullName}
            >
              {day.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Helper function to format weekday numbers to readable string
 */
export function formatWeekdays(weekdays: number[]): string {
  if (weekdays.length === 0) return "No days selected";
  if (weekdays.length === 7) return "Every day";
  
  const sorted = [...weekdays].sort();
  const dayNames = sorted.map((d) => {
    const day = WEEKDAYS.find((wd) => wd.value === d);
    return day ? day.label : d.toString();
  });
  
  return dayNames.join(", ");
}
