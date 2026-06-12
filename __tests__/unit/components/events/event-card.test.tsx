import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventCard } from '@/components/events/event-card'
import { useRouter } from 'next/navigation'
import { deleteEvent } from '@/app/actions/events'

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}))

jest.mock('@/app/actions/events', () => ({
    deleteEvent: jest.fn(),
}))

describe('EventCard', () => {
    const mockPush = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        ;(useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        })
    })

    const mockEvent = {
        id: '1',
        title: 'Sample Event',
        startTime: new Date('2024-01-01T12:00:00Z').toISOString(),
        endTime: new Date('2024-01-01T14:00:00Z').toISOString(),
        status: 'SCHEDULED',
        location: { name: 'HQ' },
        organizer: { name: 'John Doe' },
        description: '<p>Test Event</p>',
        socialPosts: [{ id: 'post1', platform: 'Twitter' }]
    }

    it('renders the event card correctly', () => {
        render(<EventCard event={mockEvent} locations={[]} users={[]} contacts={[]} organizations={[]} eventSeries={[]} />)
        expect(screen.getByText('Sample Event')).toBeInTheDocument()
        expect(screen.getByText('Test Event')).toBeInTheDocument() // HTML tags stripped
        expect(screen.getByText('SCHEDULED')).toBeInTheDocument()
        expect(screen.getByText('HQ')).toBeInTheDocument()
        expect(screen.getByText('1 post')).toBeInTheDocument()
    })

    it('handles card click navigation', async () => {
        const user = userEvent.setup()
        render(<EventCard event={mockEvent} locations={[]} users={[]} contacts={[]} organizations={[]} eventSeries={[]} />)

        const card = screen.getByText('Sample Event').closest('.cursor-pointer')
        await user.click(card!)

        expect(mockPush).toHaveBeenCalledWith('/events/1')
    })

    it('handles clone button click and stops propagation', async () => {
        const user = userEvent.setup()
        render(<EventCard event={mockEvent} locations={[]} users={[]} contacts={[]} organizations={[]} eventSeries={[]} />)

        const cloneButton = screen.getByRole('button', { name: /clone event/i })
        await user.click(cloneButton)

        expect(mockPush).toHaveBeenCalledWith('/events/new?clone=1')
        expect(mockPush).toHaveBeenCalledTimes(1) // Card click should not fire
    })

    it('handles delete button click and stops propagation', async () => {
        const user = userEvent.setup()
        render(<EventCard event={mockEvent} locations={[]} users={[]} contacts={[]} organizations={[]} eventSeries={[]} />)

        const deleteButton = screen.getByRole('button', { name: /delete event/i })
        await user.click(deleteButton)

        expect(deleteEvent).toHaveBeenCalledWith('1')
        expect(mockPush).not.toHaveBeenCalled() // Card click should not fire
    })

    it('renders different statuses with correct badges', () => {
        const { rerender } = render(<EventCard event={{ ...mockEvent, status: 'TENTATIVE' }} locations={[]} users={[]} contacts={[]} organizations={[]} eventSeries={[]} />)
        expect(screen.getByText('TENTATIVE')).toBeInTheDocument()

        rerender(<EventCard event={{ ...mockEvent, status: 'PAST' }} locations={[]} users={[]} contacts={[]} organizations={[]} eventSeries={[]} />)
        expect(screen.getByText('PAST')).toBeInTheDocument()

        rerender(<EventCard event={{ ...mockEvent, status: 'CANCELED' }} locations={[]} users={[]} contacts={[]} organizations={[]} eventSeries={[]} />)
        expect(screen.getByText('CANCELED')).toBeInTheDocument()
    })

    it('renders optional metadata correctly', () => {
        const eventWithMetadata = {
            ...mockEvent,
            series: { title: 'Summer Series' },
            primaryContact: { name: 'Jane Smith' },
            socialPosts: [
                { id: '1', platform: 'Twitter' },
                { id: '2', platform: 'Instagram' }
            ]
        }

        render(<EventCard event={eventWithMetadata} locations={[]} users={[]} contacts={[]} organizations={[]} eventSeries={[]} />)

        expect(screen.getByText('Summer Series')).toBeInTheDocument()
        expect(screen.getByText('Contact: Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('2 posts')).toBeInTheDocument()
    })
})
