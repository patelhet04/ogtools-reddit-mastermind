import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return <div className={cn("animate-pulse bg-muted rounded-lg", className)} />
}

export function CalendarCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <LoadingSkeleton className="h-5 w-32" />
        <LoadingSkeleton className="h-6 w-16 rounded-full" />
      </div>
      <LoadingSkeleton className="h-4 w-48 mb-2" />
      <LoadingSkeleton className="h-4 w-36" />
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-8 w-16" />
        </div>
        <LoadingSkeleton className="w-10 h-10 rounded-xl" />
      </div>
    </div>
  )
}
