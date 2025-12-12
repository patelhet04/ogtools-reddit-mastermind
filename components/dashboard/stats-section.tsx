"use client"

import { CalendarDays, MessageSquare, Star } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"

interface StatsSectionProps {
  postsScheduled: number
  commentsPending: number
  averageQuality: number
}

export function StatsSection({ postsScheduled, commentsPending, averageQuality }: StatsSectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="Posts Scheduled"
        value={postsScheduled}
        icon={CalendarDays}
        trend={{ value: 12, isPositive: true }}
      />
      <StatCard
        title="Comments Pending"
        value={commentsPending}
        icon={MessageSquare}
        trend={{ value: 8, isPositive: true }}
      />
      <StatCard
        title="Avg Quality Score"
        value={averageQuality.toFixed(1)}
        icon={Star}
        trend={{ value: 5, isPositive: true }}
      />
    </div>
  )
}
