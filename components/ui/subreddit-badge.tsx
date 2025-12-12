import { cn } from "@/lib/utils";

interface SubredditBadgeProps {
  subreddit: string;
  className?: string;
}

export function SubredditBadge({ subreddit, className }: SubredditBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground",
        className
      )}
    >
      r/{subreddit}
    </span>
  );
}
