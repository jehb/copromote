import React from 'react'
import { render, screen } from '@testing-library/react'
import { EventDetails } from '@/components/events/event-details'

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}))

jest.mock('@/app/actions/events', () => ({
    deleteEvent: jest.fn(),
    updateEvent: jest.fn(),
}))

jest.mock('@/app/actions/external-db', () => ({
    getProducts: jest.fn(),
}))

jest.mock('isomorphic-dompurify', () => ({
    sanitize: (str: string) => str
}))

describe('EventDetails', () => {
    const mockEvent = {
        id: '1',
        title: 'Sample Event',
        startTime: new Date('2024-01-01T12:00:00Z').toISOString(),
        endTime: new Date('2024-01-01T14:00:00Z').toISOString(),
        status: 'published',
        location: { name: 'HQ' },
        organizer: { name: 'John Doe' },
        description: '<p>Test Event</p>',
        posts: [],
        externalProducts: [],
    }

    it('renders the event details correctly', () => {
        render(<EventDetails event={mockEvent} locations={[]} users={[]} contacts={[]} organizations={[]} externalProducts={[]} eventSeries={[]} />)
        expect(screen.getByText('Sample Event')).toBeInTheDocument()
    })
})
