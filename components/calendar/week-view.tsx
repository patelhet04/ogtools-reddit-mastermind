"use client";

import { useState } from "react";
import type { UICalendar, UICalendarItem } from "@/lib/types";
import { CalendarItemCard } from "./calendar-item-card";
import { CalendarItemDetail } from "./calendar-item-detail";
import { cn } from "@/lib/utils";

interface WeekViewProps {
  calendar: UICalendar & { itemsFull?: UICalendarItem[] };
  onItemUpdate?: (item: UICalendarItem) => void;
  onItemDelete?: (itemId: string) => void;
}

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeekView({
  calendar,
  onItemUpdate,
  onItemDelete,
}: WeekViewProps) {
  const [selectedItem, setSelectedItem] = useState<UICalendarItem | null>(null);
  const itemsFull = calendar.itemsFull ?? [];

  const getItemsForDay = (dayOffset: number) => {
    const dayStart = new Date(calendar.weekStart);
    dayStart.setDate(dayStart.getDate() + dayOffset);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    return itemsFull.filter((item) => {
      const itemDate = new Date(item.scheduledTime);
      return itemDate >= dayStart && itemDate <= dayEnd;
    });
  };

  const getDayDate = (dayOffset: number) => {
    const date = new Date(calendar.weekStart);
    date.setDate(date.getDate() + dayOffset);
    return date;
  };

  return (
    <>
      {/* Desktop Week View */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-7 gap-3">
        {dayNames.map((day, index) => {
          const dayDate = getDayDate(index);
          const items = getItemsForDay(index);
            const isToday =
              new Date().toDateString() === dayDate.toDateString();

          return (
              <div key={day} className="min-h-[480px]">
                {/* Day Header */}
                <div
                  className={cn(
                    "text-center py-2.5 rounded-lg mb-3 border",
                    isToday
                      ? "bg-primary/10 border-primary/20"
                      : "bg-muted/50 border-border"
                  )}
                >
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {day}
                </p>
                <p
                  className={cn(
                    "text-lg font-semibold",
                      isToday ? "text-primary" : "text-foreground"
                  )}
                >
                  {dayDate.getDate()}
                </p>
              </div>

                {/* Cards with spacing */}
              <div className="space-y-2">
                {items.map((item) => (
                  <CalendarItemCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Mobile Stacked View */}
      <div className="lg:hidden space-y-4">
        {dayNames.map((day, index) => {
          const dayDate = getDayDate(index);
          const items = getItemsForDay(index);
          const isToday = new Date().toDateString() === dayDate.toDateString();

          if (items.length === 0) return null;

          return (
            <div
              key={day}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div
                className={cn(
                  "flex items-center gap-3 py-2.5 px-4 border-b border-border",
                  isToday ? "bg-primary/10" : "bg-muted/30"
                )}
              >
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  {day}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isToday ? "text-primary" : "text-foreground"
                  )}
                >
                  {dayDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="p-3 space-y-2">
                {items.map((item) => (
                  <CalendarItemCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Item Detail Modal */}
      <CalendarItemDetail
        item={selectedItem}
        allItems={itemsFull}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdate={onItemUpdate}
        onDelete={onItemDelete}
      />
    </>
  );
}
