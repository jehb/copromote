import { getEvents, getLocations, getUsers } from '@/app/actions/events'
import { getContacts } from '@/app/actions/contacts'
import { getOrganizations } from '@/app/actions/organizations'
import { EventsClientPage } from '@/components/events/events-client-page'

export default async function EventsPage() {
    const [events, locations, users, contacts, organizations] = await Promise.all([
        getEvents(),
        getLocations(),
        getUsers(),
        getContacts(),
        getOrganizations()
    ])

    return (
        <EventsClientPage
            initialData={{
                events,
                locations,
                users,
                contacts,
                organizations
            }}
        />
    )
}
