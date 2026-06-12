'use client'

import { useState, useMemo } from 'react'
import { EventItem } from '@/app/actions/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    isSameDay,
    isToday,
    addMonths,
    subMonths
} from 'date-fns'
import { isSameDayUTC } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { Instagram, Facebook, Linkedin, Twitter, MessageSquare } from 'lucide-react'

export function CalendarView({
    initialEvents,
    dateStr
}: {
    initialEvents: EventItem[],
    dateStr?: string
}) {
    const today = new Date()
    const displayDate = dateStr ? new Date(dateStr) : today
    const monthStart = startOfMonth(displayDate)
    const monthEnd = endOfMonth(displayDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Simple formatting for previous/next month links
    const prevMonth = format(subMonths(displayDate, 1), 'yyyy-MM-dd')
    const nextMonth = format(addMonths(displayDate, 1), 'yyyy-MM-dd')

    const [filters, setFilters] = useState({
        promotions: true,
        social: true,
        projects: true,
        events: true,
        themes: true
    })

    // ⚡ Bolt: Memoized derived filtering to prevent O(N) recalculations on unrelated state changes
    const filteredEvents = useMemo(() => {
        return initialEvents.filter(event => {
            if (event.type.startsWith('promotion_') && !filters.promotions) return false
            if (event.type === 'social_post' && !filters.social) return false
            if ((event.type.startsWith('project_') || event.type === 'event') && !filters.projects) return false
            if (event.type === 'logistics_event' && !filters.events) return false
            if (event.type === 'theme' && !filters.themes) return false
            return true
        })
    }, [initialEvents, filters])

    // ⚡ Bolt: Pre-compute O(1) lookup map to avoid O(N*D) filtering in render loop
    const eventsByDate = useMemo(() => {
        const map = new Map<string, EventItem[]>()
        filteredEvents.forEach(event => {
            if (!event.date) return
            const d = typeof event.date === 'string' ? new Date(event.date) : event.date
            const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`
            const existing = map.get(key) || []
            existing.push(event)
            map.set(key, existing)
        })
        return map
    }, [filteredEvents])

    return (
        <div className="h-full flex gap-6">
            {/* Sidebar Filters */}
            <div className="w-48 flex-shrink-0 space-y-6 pt-14">
                <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Filters</h3>
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="projects"
                                checked={filters.projects}
                                onChange={(e) => setFilters(prev => ({ ...prev, projects: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor="projects" className="cursor-pointer">Projects</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="promotions"
                                checked={filters.promotions}
                                onChange={(e) => setFilters(prev => ({ ...prev, promotions: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <Label htmlFor="promotions" className="cursor-pointer">Promotions</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="social"
                                checked={filters.social}
                                onChange={(e) => setFilters(prev => ({ ...prev, social: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                            />
                            <Label htmlFor="social" className="cursor-pointer">Social Posts</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="events"
                                checked={filters.events}
                                onChange={(e) => setFilters(prev => ({ ...prev, events: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <Label htmlFor="events" className="cursor-pointer">Events</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="themes"
                                checked={filters.themes}
                                onChange={(e) => setFilters(prev => ({ ...prev, themes: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                            <Label htmlFor="themes" className="cursor-pointer">Themes</Label>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-500"></div>
                        <span>Project</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-100 border border-purple-500"></div>
                        <span>Promotion</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-pink-100 border border-pink-500"></div>
                        <span>Social Post</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-500"></div>
                        <span>Event</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-teal-100 border border-teal-500"></div>
                        <span>Theme</span>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <Link href={`/calendar?date=${prevMonth}`} className="p-2 hover:bg-slate-100 rounded">&lt;</Link>
                        <span className="text-xl font-medium min-w-[150px] text-center">{format(displayDate, 'MMMM yyyy')}</span>
                        <Link href={`/calendar?date=${nextMonth}`} className="p-2 hover:bg-slate-100 rounded">&gt;</Link>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-slate-200 border rounded-lg overflow-hidden flex-1 min-h-[600px] shadow-sm">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="bg-slate-50 p-2 text-center font-semibold text-slate-500 text-sm">
                            {day}
                        </div>
                    ))}

                    {/* Fill empty start days */}
                    {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-white p-2 min-h-[100px] border-t" />
                    ))}

                    {days.map(day => {
                        const dayKey = `${day.getUTCFullYear()}-${day.getUTCMonth()}-${day.getUTCDate()}`
                        const dayEvents = eventsByDate.get(dayKey) || []
                        return (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "bg-white p-2 min-h-[100px] border-t hover:bg-slate-50 transition-colors",
                                    isToday(day) && "bg-blue-50/30"
                                )}
                            >
                                <div className={cn(
                                    "text-right text-sm font-medium mb-1",
                                    isToday(day) ? "text-blue-600" : "text-slate-500"
                                )}>
                                    {format(day, 'd')}
                                </div>
                                <div className="space-y-1">
                                    {dayEvents.map(event => {
                                        let href = '#'
                                        let badgeClass = ''

                                        if (event.type.startsWith('project_')) {
                                            href = `/projects/${event.projectId}`
                                            badgeClass = event.type.includes('start')
                                                ? 'border-green-500 text-green-700 bg-green-50'
                                                : 'border-red-500 text-red-700 bg-red-50'
                                        } else if (event.type.startsWith('promotion_')) {
                                            href = `/promotions/${event.projectId}`
                                            badgeClass = 'border-purple-500 text-purple-700 bg-purple-50'
                                        } else if (event.type === 'social_post') {
                                            href = `/social/${event.projectId}`
                                            badgeClass = 'border-pink-500 text-pink-700 bg-pink-50'
                                        } else if (event.type === 'logistics_event') {
                                            href = `/events/${event.id}`
                                            badgeClass = 'border-orange-500 text-orange-700 bg-orange-50'
                                        } else if (event.type === 'theme') {
                                            href = `/themes`
                                            badgeClass = 'border-teal-500 text-teal-800 bg-teal-100 font-medium'
                                        } else {
                                            badgeClass = 'border-blue-500 text-blue-700 bg-blue-50'
                                        }

                                        return (
                                            <Link key={event.id} href={href} className="block">
                                                <Badge variant="outline" className={cn("w-full justify-start text-[10px] leading-tight px-1 py-0.5 truncate cursor-pointer font-normal", badgeClass)}>
                                                    {event.type === 'social_post' && <MessageSquare className="h-3 w-3 mr-1 inline-block flex-shrink-0" />}
                                                    {event.title}
                                                </Badge>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
