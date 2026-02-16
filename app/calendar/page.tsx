export const dynamic = "force-dynamic"
import { getCalendarEvents } from '@/app/actions/calendar'
import { CalendarView } from '@/components/calendar/calendar-view'
import { PageHeader } from '@/components/ui/page-header'
import { Calendar } from 'lucide-react'

export default async function CalendarPage({
    searchParams,
}: {
    searchParams: { date?: string }
}) {
    const dateStr = (await searchParams).date
    const events = await getCalendarEvents()

    return (
        <div className="p-8 h-full flex flex-col">
            <PageHeader
                title={
                    <span className="flex items-center gap-2">
                        <Calendar className="h-6 w-6" />
                        Calendar
                    </span>
                }
                className="mb-2"
            />
            <CalendarView initialEvents={events} dateStr={dateStr} />
        </div>
    )
}

