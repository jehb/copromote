import { render, screen } from '@testing-library/react'
import { EventListView } from '@/components/events/event-list-view'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'

// Mock useRouter
jest.mock('next/navigation', () => ({
    useRouter: jest.fn()
}))

describe('EventListView', () => {
    const mockRouterPush = jest.fn()

    const mockEvents = [
        {
            id: 'e1',
            title: 'Test Event 1',
            startTime: new Date('2026-10-15T10:00:00Z').toISOString(),
            status: 'SCHEDULED',
            series: { title: 'Fall Series' },
            location: { name: 'Main Hall' },
            primaryContact: { name: 'John Doe' },
            socialPosts: [{ platform: 'Instagram' }, { platform: 'LinkedIn' }]
        },
        {
            id: 'e2',
            title: 'Test Event 2',
            startTime: new Date('2026-11-20T14:30:00Z').toISOString(),
            status: 'CANCELED',
            location: null,
            primaryContact: null,
            socialPosts: []
        },
        {
            id: 'e3',
            title: 'Test Event 3',
            startTime: new Date('2026-12-01T14:30:00Z').toISOString(),
            status: 'TENTATIVE',
            location: null,
            primaryContact: null,
            socialPosts: [{ platform: 'Facebook' }, { platform: 'Twitter' }, { platform: 'Unknown' }]
        },
        {
            id: 'e4',
            title: 'Test Event 4',
            startTime: new Date('2022-01-01T14:30:00Z').toISOString(),
            status: 'PAST',
            location: null,
            primaryContact: null,
            socialPosts: []
        }
    ]

    beforeEach(() => {
        jest.clearAllMocks()
        ;(useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush })
    })

    it('renders event details correctly', () => {
        render(<EventListView events={mockEvents} />)
        
        // Headers
        expect(screen.getByText('Event Title')).toBeInTheDocument()
        
        // Row 1
        expect(screen.getByText('Test Event 1')).toBeInTheDocument()
        expect(screen.getByText('Fall Series')).toBeInTheDocument() // series title
        expect(screen.getByText('SCHEDULED')).toBeInTheDocument()
        expect(screen.getByText('Main Hall')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument() // 2 social posts

        // Row 2
        expect(screen.getByText('Test Event 2')).toBeInTheDocument()
        expect(screen.getByText('CANCELED')).toBeInTheDocument()
        expect(screen.getAllByText('No Location')[0]).toBeInTheDocument()
        expect(screen.getAllByText('No contact')[0]).toBeInTheDocument()
        expect(screen.getAllByText('0')[0]).toBeInTheDocument() // 0 social posts

        // Row 3
        expect(screen.getByText('Test Event 3')).toBeInTheDocument()
        expect(screen.getByText('TENTATIVE')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument() // 3 social posts

        // Row 4
        expect(screen.getByText('Test Event 4')).toBeInTheDocument()
        expect(screen.getByText('PAST')).toBeInTheDocument()
    })

    it('navigates to event details on row click', async () => {
        render(<EventListView events={mockEvents} />)
        
        // Click the first row by finding its title and clicking the closest table row
        const titleElement = screen.getByText('Test Event 1')
        const row = titleElement.closest('tr')
        
        await userEvent.click(row!)

        expect(mockRouterPush).toHaveBeenCalledWith('/events/e1')
    })
})
