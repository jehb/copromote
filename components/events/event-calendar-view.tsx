'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    isSameDay,
    isToday,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek
} from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TIMEZONE = 'America/New_York'

interface EventCalendarViewProps {
    events: any[]
}

export function EventCalendarView({ events }: EventCalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date())

    // ⚡ Bolt: Pre-compute event lookups by day to eliminate O(N*D) filtering overhead during calendar render
    const eventsByDate = useMemo(() => {
        return events.reduce((acc, event: any) => {
            const dateStr = format(new Date(event.startTime), 'yyyy-MM-dd')
            if (!acc[dateStr]) acc[dateStr] = []
            acc[dateStr].push(event)
            return acc
        }, {} as Record<string, any[]>)
    }, [events])

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
    const goToday = () => setCurrentDate(new Date())

    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-[700px]">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-slate-900 min-w-[150px]">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <div className="flex items-center bg-white border rounded-lg shadow-sm">
                        <button
                            onClick={prevMonth}
                            className="p-2 hover:bg-slate-50 transition-colors border-r"
                            aria-label="Previous month"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={goToday}
                            aria-label="Today"
                            className="px-3 py-1 text-sm font-medium hover:bg-slate-50 transition-colors border-r"
                        >
                            Today
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-slate-50 transition-colors"
                            aria-label="Next month"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-7 border-b bg-slate-50/30">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 auto-rows-fr">
                {calendarDays.map((day, idx) => {
                    const isCurrentMonth = format(day, 'M') === format(currentDate, 'M')
                    const dayEvents = eventsByDate[format(day, 'yyyy-MM-dd')] || []

                    return (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "border-r border-b p-2 flex flex-col gap-1 min-h-[100px] transition-colors",
                                !isCurrentMonth && "bg-slate-50/50",
                                idx % 7 === 6 && "border-r-0"
                            )}
                        >
                            <div className="flex justify-between items-center">
                                <span className={cn(
                                    "text-sm font-medium",
                                    isToday(day)
                                        ? "h-7 w-7 flex items-center justify-center bg-blue-600 text-white rounded-full"
                                        : isCurrentMonth ? "text-slate-900" : "text-slate-400"
                                )}>
                                    {format(day, 'd')}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                                {dayEvents.map((event: any) => (
                                    <Link
                                        key={event.id}
                                        href={`/events/${event.id}`}
                                        className="block"
                                    >
                                        <Badge
                                            variant="outline"
                                            className="w-full justify-start text-[10px] py-0.5 px-1 truncate font-normal border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                                        >
                                            {formatInTimeZone(new Date(event.startTime), TIMEZONE, 'h:mma')} {event.title}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
