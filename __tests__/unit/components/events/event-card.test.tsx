import React from 'react'
import { render, screen } from '@testing-library/react'
import { EventCard } from '@/components/events/event-card'

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}))

jest.mock('@/app/actions/events', () => ({
    deleteEvent: jest.fn(),
}))

describe('EventCard', () => {
    const mockEvent = {
        id: '1',
        title: 'Sample Event',
        startTime: new Date('2024-01-01T12:00:00Z').toISOString(),
        endTime: new Date('2024-01-01T14:00:00Z').toISOString(),
        status: 'published',
        location: { name: 'HQ' },
        organizer: { name: 'John Doe' },
        description: '<p>Test Event</p>',
        posts: [{ id: 'post1', platform: 'Twitter' }]
    }

    it('renders the event card correctly', () => {
        render(<EventCard event={mockEvent} locations={[]} users={[]} contacts={[]} organizations={[]} eventSeries={[]} />)
        expect(screen.getByText('Sample Event')).toBeInTheDocument()
    })
})
