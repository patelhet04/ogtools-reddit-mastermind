"use client";

import type { UICalendarItem } from "@/lib/types";
import { PersonaAvatar } from "@/components/ui/persona-avatar";
import { SubredditBadge } from "@/components/ui/subreddit-badge";
import { cn } from "@/lib/utils";
import { MessageSquare, FileText, Package } from "lucide-react";

interface CalendarItemCardProps {
  item: UICalendarItem;
  onClick: () => void;
}

export function CalendarItemCard({ item, onClick }: CalendarItemCardProps) {
  const isPost = item.type === "post";
  const time = new Date(item.scheduledTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg transition-all duration-150",
        "border hover:shadow-sm active:scale-[0.99]",
        isPost
          ? "bg-card border-border hover:border-primary/30"
          : "bg-muted/40 border-border/50 hover:border-border"
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <PersonaAvatar persona={item.persona} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isPost ? (
              <FileText className="w-3 h-3 text-primary shrink-0" />
            ) : (
              <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0" />
            )}
            <span className="text-[10px] text-muted-foreground">{time}</span>
            {item.mentionsProduct && (
              <Package className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
          </div>
        </div>
      </div>

      <SubredditBadge subreddit={item.subreddit} className="text-[10px] mb-2" />

      {isPost && item.title && (
        <p className="text-xs font-medium text-foreground line-clamp-1 mb-1">
          {item.title}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
        {item.content}
      </p>
    </button>
  );
}
