'use client'

import { useQuery } from '@tanstack/react-query'
import { getEvents, getLocations, getUsers } from '@/app/actions/events'
import { getContacts } from '@/app/actions/contacts'
import { getOrganizations } from '@/app/actions/organizations'
import { Button } from '@/components/ui/button'
import { EventCard } from '@/components/events/event-card'
import Link from 'next/link'
import { Plus, MapPin, Loader2 } from 'lucide-react'

interface EventsClientPageProps {
    initialData: {
        events: any[]
        locations: any[]
        users: any[]
        contacts: any[]
        organizations: any[]
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

    const isLoadingAny = isLoadingEvents

    return (
        <div className="p-4 md:p-8 space-y-4 md:space-y-8 h-full flex flex-col max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Events</h1>
                    <p className="text-muted-foreground text-sm md:text-base">Manage upcoming events and logistics</p>
                </div>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
                    <Link href="/events/new">
                        <Plus className="h-4 w-4 md:mr-2" />
                        <span className="md:inline">Create Event</span>
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event: any) => (
                    <EventCard
                        key={event.id}
                        event={event}
                        locations={locations}
                        users={users}
                        contacts={contacts}
                        organizations={organizations}
                    />
                ))}

                {events.length === 0 && !isLoadingAny && (
                    <div className="col-span-full text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
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
                )}

                {isLoadingAny && events.length === 0 && (
                    <div className="col-span-full flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                )}
            </div>
        </div>
    )
}
