import { EventDetails } from '@/components/events/event-details'
import { getEvent, getLocations, getUsers } from '@/app/actions/events'
import { getContacts } from '@/app/actions/contacts'
import { getOrganizations } from '@/app/actions/organizations'
import { getEventSeries } from '@/app/actions/event-series'
import { getMyRole } from '@/app/actions/user-role'
import { notFound } from 'next/navigation'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EventPage({ params }: PageProps) {
    const { id } = await params
    const event = await getEvent(id)

    if (!event) {
        notFound()
    }

    const [locations, users, contacts, organizations, eventSeries, role] = await Promise.all([
        getLocations(),
        getUsers(),
        getContacts(),
        getOrganizations(),
        getEventSeries(),
        getMyRole()
    ])

    return (
        <EventDetails
            event={event}
            locations={locations}
            users={users}
            contacts={contacts}
            organizations={organizations}
            eventSeries={eventSeries}
            isAdmin={role === 'ADMIN'}
        />
    )
}
