'use client'

import { useQuery } from '@tanstack/react-query'
import { getEvents, getLocations, getUsers } from '@/app/actions/events'
import { getContacts } from '@/app/actions/contacts'
import { getOrganizations } from '@/app/actions/organizations'
import { getEventSeries } from '@/app/actions/event-series'
import { Button } from '@/components/ui/button'
import { EventCard } from '@/components/events/event-card'
import Link from 'next/link'
import { Plus, MapPin, Loader2, Calendar, LayoutGrid, List, Calendar as CalendarIcon, Filter } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EventListView } from '@/components/events/event-list-view'
import { EventCalendarView } from '@/components/events/event-calendar-view'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface EventsClientPageProps {
    initialData: {
        events: any[]
        locations: any[]
        users: any[]
        contacts: any[]
        organizations: any[]
        eventSeries: any[]
    }
}

export function EventsClientPage({ initialData }: EventsClientPageProps) {
    // We use individual queries for each entity to allow granular caching and updates
    const { data: events = initialData.events, isLoading: isLoadingEvents } = useQuery({
        queryKey: ['events'],
        queryFn: () => getEvents(),
        initialData: initialData.events,
    })

    const { data: locations = initialData.locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => getLocations(),
        initialData: initialData.locations,
    })

    const { data: users = initialData.users } = useQuery({
        queryKey: ['users'],
        queryFn: () => getUsers(),
        initialData: initialData.users,
    })

    const { data: contacts = initialData.contacts } = useQuery({
        queryKey: ['contacts'], // Shared with Contacts page
        queryFn: () => getContacts(),
        initialData: initialData.contacts,
    })

    const { data: organizations = initialData.organizations } = useQuery({
        queryKey: ['organizations'],
        queryFn: () => getOrganizations(),
        initialData: initialData.organizations,
    })

    const { data: eventSeries = initialData.eventSeries } = useQuery({
        queryKey: ['eventSeries'],
        queryFn: () => getEventSeries(),
        initialData: initialData.eventSeries,
    })

    const [view, setView] = useState<'list' | 'calendar' | 'cards'>('list')
    const [statusFilter, setStatusFilter] = useState<string[]>(['SCHEDULED', 'TENTATIVE'])

    const isLoadingAny = isLoadingEvents

    const filteredEvents = events.filter((event: any) => {
        if (statusFilter.length === 0) return true
        return statusFilter.includes(event.status)
    })

    const viewSwitcher = (
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border shadow-sm">
            <button
                onClick={() => setView('list')}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    view === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
            >
                <List className="h-3.5 w-3.5" />
                List
            </button>
            <button
                onClick={() => setView('calendar')}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    view === 'calendar' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
            >
                <CalendarIcon className="h-3.5 w-3.5" />
                Calendar
            </button>
            <button
                onClick={() => setView('cards')}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    view === 'cards' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
            >
                <LayoutGrid className="h-3.5 w-3.5" />
                Cards
            </button>
        </div>
    )

    return (
        <div className="p-4 md:p-8 space-y-4 md:space-y-8 h-full flex flex-col w-full">
            <PageHeader
                title={
                    <span className="flex items-center gap-2">
                        <Calendar className="h-6 w-6" />
                        Events
                    </span>
                }
                description="Manage upcoming events and logistics"
                actions={
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
                        <Link href="/events/new">
                            <Plus className="h-4 w-4 md:mr-2" />
                            <span className="md:inline">Create Event</span>
                        </Link>
                    </Button>
                }
            />

            <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Display View</h3>
                    {viewSwitcher}
                    <div className="h-6 w-px bg-slate-200 hidden md:block" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 border-dashed">
                                <Filter className="h-3.5 w-3.5 mr-2" />
                                Status
                                {statusFilter.length > 0 && (
                                    <>
                                        <div className="mx-2 h-4 w-px bg-slate-200" />
                                        <span className="rounded-sm bg-slate-100 px-1 font-normal text-slate-500 text-xs">
                                            {statusFilter.length}
                                        </span>
                                    </>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {['TENTATIVE', 'SCHEDULED', 'PAST', 'CANCELED'].map((status) => (
                                <DropdownMenuCheckboxItem
                                    key={status}
                                    checked={statusFilter.includes(status)}
                                    onCheckedChange={(checked) => {
                                        setStatusFilter((prev) =>
                                            checked
                                                ? [...prev, status]
                                                : prev.filter((s) => s !== status)
                                        )
                                    }}
                                >
                                    {status.charAt(0) + status.slice(1).toLowerCase()}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="text-sm text-slate-500 font-medium">
                    Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                </div>
            </div>

            <div className="flex-1">
                {isLoadingAny && events.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100">
                                <MapPin className="h-8 w-8 text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">No events scheduled</h3>
                                <p className="text-slate-500">Add an event to the calendar.</p>
                            </div>
                            <Button asChild variant="outline" className="mt-2 border-slate-200">
                                <Link href="/events/new">Get Started</Link>
                            </Button>
                        </div>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100">
                                <Filter className="h-8 w-8 text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">No events found</h3>
                                <p className="text-slate-500">Try adjusting your filters.</p>
                            </div>
                            <Button variant="outline" className="mt-2 border-slate-200" onClick={() => setStatusFilter([])}>
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {view === 'cards' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredEvents.map((event: any) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        locations={locations}
                                        users={users}
                                        contacts={contacts}
                                        organizations={organizations}
                                        eventSeries={eventSeries}
                                    />
                                ))}
                            </div>
                        )}

                        {view === 'list' && <EventListView events={filteredEvents} />}

                        {view === 'calendar' && <EventCalendarView events={filteredEvents} />}
                    </>
                )}
            </div>
        </div>
    )
}
