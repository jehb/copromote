/* istanbul ignore file */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, Calendar, User, MessageSquare, Instagram, Facebook, Linkedin, Twitter, Copy } from 'lucide-react'
import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { deleteEvent } from '@/app/actions/events'
import { cn } from '@/lib/utils'

const TIMEZONE = 'America/New_York'


interface EventCardProps {
    event: any
    locations: any[]
    users: any[]
    contacts: any[]
    organizations: any[]
    eventSeries: any[]
}

export function EventCard({ event, locations, users, contacts, organizations, eventSeries }: EventCardProps) {
    const router = useRouter()

    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent navigation if clicking the delete button (handled by e.stopPropagation in the button itself, but good to be safe)
        // Actually, the delete button has e.stopPropagation, so this click handler won't fire for it.
        router.push(`/events/${event.id}`)
    }

    return (
        <Card
            className="hover:shadow-md transition-shadow cursor-pointer group"
            onClick={handleCardClick}
        >
            <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider", {
                                'bg-green-50 text-green-700 border-green-200': event.status === 'SCHEDULED' || !event.status,
                                'bg-yellow-50 text-yellow-700 border-yellow-200': event.status === 'TENTATIVE',
                                'bg-slate-100 text-slate-500 border-slate-200': event.status === 'PAST',
                                'bg-red-50 text-red-700 border-red-200': event.status === 'CANCELED',
                            })}>
                                {event.status || 'SCHEDULED'}
                            </Badge>
                            <Badge variant="secondary" className="group-hover:bg-slate-200 transition-colors w-fit">
                                {event.location?.name || 'No Location'}
                            </Badge>
                        </div>
                        {event.series && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                {event.series.title}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Clone Event"
                            title="Clone Event"
                            className="h-6 w-6 text-slate-400 hover:text-primary hover:bg-primary/10"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/events/new?clone=${event.id}`);
                            }}
                        >
                            <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete Event"
                            className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50"
                            onClick={async (e) => {
                                e.stopPropagation();
                                await deleteEvent(event.id);
                            }}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    {event.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 mt-1">{event.description.replace(/<[^>]*>?/gm, '')}</p>
                    )}
                </div>

                <div className="pt-4 border-t space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{formatInTimeZone(new Date(event.startTime), TIMEZONE, 'MMM d, yyyy')}</span>
                        <span className="text-slate-400">|</span>
                        <span>{formatInTimeZone(new Date(event.startTime), TIMEZONE, 'h:mm a')} - {formatInTimeZone(new Date(event.endTime), TIMEZONE, 'h:mm a')}</span>
                    </div>
                    {event.primaryContact && (
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span>Contact: {event.primaryContact.name}</span>
                        </div>
                    )}
                    {event.socialPosts?.length > 0 && (
                        <div className="flex items-center gap-3 pt-2">
                            <div className="flex -space-x-1">
                                {Array.from(new Set(event.socialPosts.map((p: any) => p.platform))).map((platform: any) => {
                                    const Icon = platform === 'Instagram' ? Instagram :
                                        platform === 'Facebook' ? Facebook :
                                            platform === 'LinkedIn' ? Linkedin :
                                                platform === 'Twitter' ? Twitter : MessageSquare
                                    return (
                                        <div key={platform as string} className="p-1 bg-slate-100 rounded-full border border-white">
                                            <Icon className="h-3 w-3 text-slate-500" />
                                        </div>
                                    )
                                })}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                                {event.socialPosts.length} post{event.socialPosts.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
