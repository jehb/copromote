'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Instagram, Facebook, Linkedin, Twitter, MessageSquare, MapPin, User } from 'lucide-react'

interface EventListViewProps {
    events: any[]
}

export function EventListView({ events }: EventListViewProps) {
    const router = useRouter()

    return (
        <div className="border rounded-lg bg-white overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/50">
                        <TableHead className="w-[180px]">Date & Time</TableHead>
                        <TableHead>Event Title</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Primary Contact</TableHead>
                        <TableHead className="text-right">Social</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {events.map((event) => (
                        <TableRow
                            key={event.id}
                            className="cursor-pointer hover:bg-slate-50 transition-colors group"
                            onClick={() => router.push(`/events/${event.id}`)}
                        >
                            <TableCell className="font-medium text-slate-700">
                                <div className="flex flex-col">
                                    <span>{format(new Date(event.startTime), 'MMM d, yyyy')}</span>
                                    <span className="text-xs text-slate-400 font-normal">
                                        {format(new Date(event.startTime), 'h:mm a')}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold group-hover:text-blue-600 transition-colors">
                                        {event.title}
                                    </span>
                                    {event.series && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                                            {event.series.title}
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1.5 text-slate-600">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{event.location?.name || 'No Location'}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {event.primaryContact ? (
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{event.primaryContact.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-slate-300 text-xs italic">No contact</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                {event.socialPosts?.length > 0 ? (
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="flex -space-x-1">
                                            {Array.from(new Set(event.socialPosts.map((p: any) => p.platform))).map((platform: any) => {
                                                const Icon = platform === 'Instagram' ? Instagram :
                                                    platform === 'Facebook' ? Facebook :
                                                        platform === 'LinkedIn' ? Linkedin :
                                                            platform === 'Twitter' ? Twitter : MessageSquare
                                                return (
                                                    <div key={platform as string} className="p-0.5 bg-slate-100 rounded-full border border-white">
                                                        <Icon className="h-2.5 w-2.5 text-slate-500" />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 min-w-[1.5rem] justify-center">
                                            {event.socialPosts.length}
                                        </Badge>
                                    </div>
                                ) : (
                                    <span className="text-slate-300">0</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
