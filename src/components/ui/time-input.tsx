import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface TimeInputProps {
  label: string;
  value: number; // minutes from midnight
  onChange: (minutes: number) => void;
  className?: string;
}

/**
 * TimeInput - A user-friendly time picker component
 * Converts between minutes from midnight (0-1439) and HH:MM format
 */
export function TimeInput({ label, value, onChange, className }: TimeInputProps) {
  const [timeStr, setTimeStr] = useState("");

  // Convert minutes to HH:MM format
  useEffect(() => {
    const hours = Math.floor(value / 60);
    const mins = value % 60;
    setTimeStr(`${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setTimeStr(newValue);

    // Parse HH:MM format
    const match = newValue.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const mins = parseInt(match[2], 10);
      
      if (hours >= 0 && hours < 24 && mins >= 0 && mins < 60) {
        onChange(hours * 60 + mins);
      }
    }
  };

  return (
    <div className={className}>
      <Label className="block text-sm font-semibold mb-1">{label}</Label>
      <Input
        type="time"
        value={timeStr}
        onChange={handleChange}
        className="w-full"
      />
    </div>
  );
}

/**
 * Helper function to convert minutes to readable time string
 */
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${String(mins).padStart(2, "0")} ${period}`;
}
