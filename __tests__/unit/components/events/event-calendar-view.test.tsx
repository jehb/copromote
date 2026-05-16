import { render, screen } from '@testing-library/react'
import { EventCalendarView } from '@/components/events/event-calendar-view'
import userEvent from '@testing-library/user-event'
import { format, addMonths, subMonths } from 'date-fns'

describe('EventCalendarView', () => {
    const today = new Date()
    
    // Create an event for today
    const mockEvents = [
        {
            id: 'e1',
            title: 'Meeting with Client',
            startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0).toISOString()
        },
        {
            id: 'e2',
            title: 'Team Lunch',
            startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 30, 0).toISOString()
        }
    ]

    it('renders current month in header', () => {
        render(<EventCalendarView events={mockEvents} />)
        const expectedHeader = format(today, 'MMMM yyyy')
        expect(screen.getByText(expectedHeader)).toBeInTheDocument()
    })

    it('renders events on the calendar', () => {
        render(<EventCalendarView events={mockEvents} />)
        
        // Check if event titles are rendered
        // Because of timezone formatting it might include '10:00AM Meeting with Client'
        // We'll just check if the title substring is present
        expect(screen.getByText(/Meeting with Client/)).toBeInTheDocument()
        expect(screen.getByText(/Team Lunch/)).toBeInTheDocument()
    })

    it('navigates to next month', async () => {
        render(<EventCalendarView events={mockEvents} />)
        
        const nextMonthDate = addMonths(today, 1)
        const expectedHeader = format(nextMonthDate, 'MMMM yyyy')

        // There's only one ChevronRight icon, inside a button
        // Let's find it by getting all buttons and clicking the second one (Today is middle, so index 2)
        const buttons = screen.getAllByRole('button')
        // [0] = prev, [1] = today, [2] = next
        await userEvent.click(buttons[2])

        expect(screen.getByText(expectedHeader)).toBeInTheDocument()
        
        // Since we moved to next month, today's events shouldn't be visible (unless it's the exact same day overlapping weeks, but typically not)
        // Actually, if today is the 31st, it might overlap into next month's first week view.
        // Let's just trust the header change.
    })

    it('navigates to previous month', async () => {
        render(<EventCalendarView events={mockEvents} />)
        
        const prevMonthDate = subMonths(today, 1)
        const expectedHeader = format(prevMonthDate, 'MMMM yyyy')

        const buttons = screen.getAllByRole('button')
        await userEvent.click(buttons[0])

        expect(screen.getByText(expectedHeader)).toBeInTheDocument()
    })

    it('navigates to today', async () => {
        render(<EventCalendarView events={mockEvents} />)
        
        // Go next month first
        const buttons = screen.getAllByRole('button')
        await userEvent.click(buttons[2])
        
        // Now click Today
        await userEvent.click(screen.getByRole('button', { name: /Today/i }))

        const expectedHeader = format(today, 'MMMM yyyy')
        expect(screen.getByText(expectedHeader)).toBeInTheDocument()
    })
})
