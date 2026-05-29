import { render, screen } from '@testing-library/react'
import { EventCalendarView } from '@/components/events/event-calendar-view'
import userEvent from '@testing-library/user-event'
import { format, addMonths, subMonths } from 'date-fns'

describe('EventCalendarView', () => {
    // Set a fixed system time
    const fixedTime = new Date('2024-03-15T12:00:00Z')

    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(fixedTime)
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    const today = fixedTime
    
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

        const nextBtn = screen.getByRole('button', { name: /Next month/i })
        await user.click(nextBtn)

        expect(screen.getByText(expectedHeader)).toBeInTheDocument()
    })

    it('navigates to previous month', async () => {
        render(<EventCalendarView events={mockEvents} />)
        
        const prevMonthDate = subMonths(today, 1)
        const expectedHeader = format(prevMonthDate, 'MMMM yyyy')

        const prevBtn = screen.getByRole('button', { name: /Previous month/i })
        await user.click(prevBtn)

        expect(screen.getByText(expectedHeader)).toBeInTheDocument()
    })

    it('navigates to today', async () => {
        render(<EventCalendarView events={mockEvents} />)
        
        // Go next month first
        const nextBtn = screen.getByRole('button', { name: /Next month/i })
        await user.click(nextBtn)
        
        // Now click Today
        await user.click(screen.getByRole('button', { name: /Today/i }))

        const expectedHeader = format(today, 'MMMM yyyy')
        expect(screen.getByText(expectedHeader)).toBeInTheDocument()
    })

    it('renders correctly with an empty events array', () => {
        render(<EventCalendarView events={[]} />)

        const expectedHeader = format(today, 'MMMM yyyy')
        expect(screen.getByText(expectedHeader)).toBeInTheDocument()

        // Ensure no event titles are shown
        expect(screen.queryByText(/Meeting with Client/)).not.toBeInTheDocument()
        expect(screen.queryByText(/Team Lunch/)).not.toBeInTheDocument()
    })

    it('renders out-of-month events on the visible calendar grid', () => {
        // Since we fixed time to March 15, 2024, the calendar week starts in late February (Feb 25)
        const outOfMonthEvent = {
            id: 'e3',
            title: 'Late February Planning',
            startTime: new Date(2024, 1, 28, 14, 0, 0).toISOString() // Feb 28, 2024
        }

        render(<EventCalendarView events={[...mockEvents, outOfMonthEvent]} />)

        // It should display the event because Feb 28 is part of the first week row shown in March 2024 grid
        expect(screen.getByText(/Late February Planning/)).toBeInTheDocument()
    })
})
