"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type CalendarProps = {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  initialFocus?: boolean;
  className?: string;
}

function Calendar({
  className,
  mode = "single",
  selected,
  onSelect,
  disabled,
  initialFocus,
  ...props
}: CalendarProps) {
  // Simple calendar implementation for demo purposes
  // In production, you'd want to use a proper calendar library
  const today = new Date();
  const currentMonth = selected || today;

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const days = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-9 w-9"></div>);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const isSelected = selected && date.toDateString() === selected.toDateString();
    const isDisabled = disabled && disabled(date);
    const isToday = date.toDateString() === today.toDateString();

    days.push(
      <button
        key={day}
        onClick={() => !isDisabled && onSelect?.(date)}
        disabled={isDisabled}
        className={cn(
          "h-9 w-9 text-sm rounded-md hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-primary text-primary-foreground",
          isToday && !isSelected && "bg-accent text-accent-foreground",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {day}
      </button>
    );
  }

  return (
    <div className={cn("p-3", className)} {...props}>
      <div className="space-y-4">
        <div className="text-sm font-medium text-center">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="h-9 w-9 text-xs font-medium text-muted-foreground flex items-center justify-center">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    </div>
  );
}
Calendar.displayName = "Calendar"

export { Calendar }
