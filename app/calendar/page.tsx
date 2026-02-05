import { getCalendarEvents } from '@/app/actions/calendar'
import { CalendarView } from '@/components/calendar/calendar-view'

export default async function CalendarPage({
    searchParams,
}: {
    searchParams: { date?: string }
}) {
    const dateStr = (await searchParams).date
    const events = await getCalendarEvents()

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-2">Calendar</h1>
            <CalendarView initialEvents={events} dateStr={dateStr} />
        </div>
    )
}

