'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface SocialFilterBarProps {
    promotions: any[]
    events: any[]
}

export function SocialFilterBar({ promotions, events }: SocialFilterBarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isExpanded, setIsExpanded] = useState(false) // Collapsed by default

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== 'all') {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`/social?${params.toString()}`)
    }

    const clearFilters = () => {
        const view = searchParams.get('view') || 'table'
        router.push(`/social?view=${view}`)
    }

    const hasFilters = Array.from(searchParams.keys()).some(k => k !== 'view')

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            {/* Header - Always visible */}
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                    <Filter className="h-4 w-4" />
                    Advanced Filters
                    {hasFilters && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                            Active
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {hasFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation()
                                clearFilters()
                            }}
                            className="text-[10px] h-7 text-slate-500 hover:text-red-500 uppercase tracking-wider font-bold"
                        >
                            <X className="h-3 w-3 mr-1" /> Clear All
                        </Button>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                </div>
            </div>

            {/* Filters - Collapsible */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-4 animate-in slide-in-from-top-2 duration-200 max-h-[70vh] overflow-y-auto">
                    {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 5 columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Status</Label>
                            <Select
                                value={searchParams.get('status') || 'all'}
                                onValueChange={(v) => updateFilter('status', v)}
                            >
                                <SelectTrigger className="h-9 bg-slate-50/50 border-slate-200">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="ready-for-review">Ready for Review</SelectItem>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">From Date</Label>
                            <Input
                                type="date"
                                className="h-9 bg-slate-50/50 border-slate-200"
                                value={searchParams.get('startDate') || ''}
                                onChange={(e) => updateFilter('startDate', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">To Date</Label>
                            <Input
                                type="date"
                                className="h-9 bg-slate-50/50 border-slate-200"
                                value={searchParams.get('endDate') || ''}
                                onChange={(e) => updateFilter('endDate', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Promotion</Label>
                            <Select
                                value={searchParams.get('promotionPeriodId') || 'all'}
                                onValueChange={(v) => updateFilter('promotionPeriodId', v)}
                            >
                                <SelectTrigger className="h-9 bg-slate-50/50 border-slate-200">
                                    <SelectValue placeholder="All Promotions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Promotions</SelectItem>
                                    <SelectItem value="none">None (Unlinked)</SelectItem>
                                    {promotions.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Linked Event</Label>
                            <Select
                                value={searchParams.get('eventId') || 'all'}
                                onValueChange={(v) => updateFilter('eventId', v)}
                            >
                                <SelectTrigger className="h-9 bg-slate-50/50 border-slate-200">
                                    <SelectValue placeholder="All Events" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Events</SelectItem>
                                    <SelectItem value="none">None (Unlinked)</SelectItem>
                                    {events.map(e => (
                                        <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
