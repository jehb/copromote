export const dynamic = "force-dynamic"
import { createEvent, getLocations, getUsers } from '@/app/actions/events'
import { getEventSeries } from '@/app/actions/event-series'
import { getContacts } from '@/app/actions/contacts'
import { getOrganizations } from '@/app/actions/organizations'
import { EventForm } from '@/components/events/event-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewEventPage() {
    const [locations, users, contacts, organizations, eventSeries] = await Promise.all([
        getLocations(),
        getUsers(),
        getContacts(),
        getOrganizations(),
        getEventSeries()
    ])

    return (
        <div className="max-w-2xl mx-auto p-8 space-y-8">
            <div>
                <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent hover:underline">
                    <Link href="/events" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Events
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Create New Event</h1>
                <p className="text-muted-foreground">Schedule a new event and assign logistics.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                    <CardDescription>Enter the basic information for this event.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <EventForm
                        locations={locations}
                        users={users}
                        contacts={contacts}
                        organizations={organizations}
                        eventSeries={eventSeries}
                        action={createEvent}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
