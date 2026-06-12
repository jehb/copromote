import { render, screen } from '@testing-library/react'
import { CalendarView } from '@/components/calendar/calendar-view'
import userEvent from '@testing-library/user-event'
import { format, addMonths, subMonths } from 'date-fns'
import { EventItem } from '@/app/actions/calendar'

// Mock icons to avoid render issues in testing
jest.mock('lucide-react', () => {
    const actual = jest.requireActual('lucide-react')
    return {
        ...actual,
        icons: {
            ...actual.icons,
            MessageSquare: () => <div data-testid="icon-message-square" />,
            Instagram: () => <div data-testid="icon-instagram" />,
            Facebook: () => <div data-testid="icon-facebook" />,
            Linkedin: () => <div data-testid="icon-linkedin" />,
            Twitter: () => <div data-testid="icon-twitter" />
        },
        MessageSquare: () => <div data-testid="icon-message-square" />
    }
})

describe('CalendarView', () => {
    const fixedTime = new Date('2024-03-15T12:00:00Z')

    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(fixedTime)
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    const today = fixedTime

    const mockEvents: EventItem[] = [
        {
            id: 'e1',
            type: 'project_start',
            projectId: 'p1',
            title: 'Website Redesign',
            date: new Date(today.getFullYear(), today.getMonth(), 10).toISOString()
        },
        {
            id: 'e2',
            type: 'promotion_start',
            projectId: 'pr1',
            title: 'Spring Sale',
            date: new Date(today.getFullYear(), today.getMonth(), 12).toISOString()
        },
        {
            id: 'e3',
            type: 'social_post',
            projectId: 's1',
            title: 'New Feature Announcement',
            date: new Date(today.getFullYear(), today.getMonth(), 15).toISOString()
        },
        {
            id: 'e4',
            type: 'logistics_event',
            projectId: 'l1',
            title: 'Team Building',
            date: new Date(today.getFullYear(), today.getMonth(), 20).toISOString()
        },
        {
            id: 'e5',
            type: 'theme',
            projectId: 't1',
            title: 'Sustainability Month',
            date: new Date(today.getFullYear(), today.getMonth(), 25).toISOString()
        }
    ]

    it('renders current month in header and empty grid correctly', () => {
        render(<CalendarView initialEvents={[]} />)
        const expectedHeader = format(today, 'MMMM yyyy')
        expect(screen.getByText(expectedHeader)).toBeInTheDocument()

        // Days of week
        expect(screen.getByText('Sun')).toBeInTheDocument()
        expect(screen.getByText('Sat')).toBeInTheDocument()
    })

    it('renders events on the calendar and correct link destinations', () => {
        render(<CalendarView initialEvents={mockEvents} />)

        // Check if event titles are rendered
        expect(screen.getByText('Website Redesign')).toBeInTheDocument()
        expect(screen.getByText('Spring Sale')).toBeInTheDocument()
        expect(screen.getByText('New Feature Announcement')).toBeInTheDocument()
        expect(screen.getByText('Team Building')).toBeInTheDocument()
        expect(screen.getByText('Sustainability Month')).toBeInTheDocument()

        // Check href logic based on types
        const projectLink = screen.getByText('Website Redesign').closest('a')
        expect(projectLink).toHaveAttribute('href', '/projects/p1')

        const promotionLink = screen.getByText('Spring Sale').closest('a')
        expect(promotionLink).toHaveAttribute('href', '/promotions/pr1')

        const socialLink = screen.getByText('New Feature Announcement').closest('a')
        expect(socialLink).toHaveAttribute('href', '/social/s1')

        const eventLink = screen.getByText('Team Building').closest('a')
        expect(eventLink).toHaveAttribute('href', '/events/e4') // logistics_event uses event.id

        const themeLink = screen.getByText('Sustainability Month').closest('a')
        expect(themeLink).toHaveAttribute('href', '/themes') // themes use '/themes'
    })

    it('navigates to next and previous month links correctly', () => {
        render(<CalendarView initialEvents={[]} />)

        const prevMonthDate = format(subMonths(today, 1), 'yyyy-MM-dd')
        const nextMonthDate = format(addMonths(today, 1), 'yyyy-MM-dd')

        const prevLink = screen.getByText('<')
        expect(prevLink).toHaveAttribute('href', `/calendar?date=${prevMonthDate}`)

        const nextLink = screen.getByText('>')
        expect(nextLink).toHaveAttribute('href', `/calendar?date=${nextMonthDate}`)
    })

    it('filters events when sidebar checkboxes are toggled', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
        render(<CalendarView initialEvents={mockEvents} />)

        // Initially all are shown
        expect(screen.getByText('Website Redesign')).toBeInTheDocument() // Project
        expect(screen.getByText('Spring Sale')).toBeInTheDocument() // Promotion
        expect(screen.getByText('New Feature Announcement')).toBeInTheDocument() // Social
        expect(screen.getByText('Team Building')).toBeInTheDocument() // Event
        expect(screen.getByText('Sustainability Month')).toBeInTheDocument() // Theme

        // Uncheck Projects
        await user.click(screen.getByRole('checkbox', { name: /Projects/i }))
        expect(screen.queryByText('Website Redesign')).not.toBeInTheDocument()

        // Uncheck Promotions
        await user.click(screen.getByRole('checkbox', { name: /Promotions/i }))
        expect(screen.queryByText('Spring Sale')).not.toBeInTheDocument()

        // Uncheck Social Posts
        await user.click(screen.getByRole('checkbox', { name: /Social Posts/i }))
        expect(screen.queryByText('New Feature Announcement')).not.toBeInTheDocument()

        // Uncheck Events
        await user.click(screen.getByRole('checkbox', { name: /Events/i }))
        expect(screen.queryByText('Team Building')).not.toBeInTheDocument()

        // Uncheck Themes
        await user.click(screen.getByRole('checkbox', { name: /Themes/i }))
        expect(screen.queryByText('Sustainability Month')).not.toBeInTheDocument()

        // Re-check Projects
        await user.click(screen.getByRole('checkbox', { name: /Projects/i }))
        expect(screen.getByText('Website Redesign')).toBeInTheDocument()
    })

    it('uses provided dateStr if present', () => {
        const customDate = '2024-12-01'
        render(<CalendarView initialEvents={[]} dateStr={customDate} />)
        expect(screen.getByText('December 2024')).toBeInTheDocument()
    })
})
