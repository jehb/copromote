import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EventDetails } from '@/components/events/event-details'
import { deleteEvent } from '@/app/actions/events'

const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: mockRefresh,
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

// Mock EventForm since we don't want to test it here
jest.mock('@/components/events/event-form', () => ({
    EventForm: () => <div data-testid="event-form-mock" />
}))

describe('EventDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    const mockEvent = {
        id: '1',
        title: 'Sample Event',
        startTime: new Date('2024-01-01T12:00:00Z').toISOString(),
        endTime: new Date('2024-01-01T14:00:00Z').toISOString(),
        status: 'published',
        location: { name: 'HQ Location' },
        organizer: { name: 'John Doe' },
        description: '<p>Test Event Description</p>',
        primaryContact: {
            name: 'Jane Smith',
            email: 'jane@example.com'
        },
        contacts: [
            { id: 'c1', firstName: 'Alice', lastName: 'Johnson' }
        ],
        organizations: [
            { id: 'o1', name: 'Acme Corp' }
        ],
        products: [
            { upc: '12345' }
        ],
        socialPosts: [
            { id: 's1', platform: 'Twitter', content: 'Check this out', status: 'published' }
        ]
    }

    const availableProducts = [
        { upc: '12345', name: 'Cool Product', brand: 'BrandX' }
    ]

    it('renders the event details and linked entities correctly', () => {
        render(<EventDetails event={mockEvent} locations={[]} users={[]} contacts={[]} organizations={[]} availableProducts={availableProducts as any} eventSeries={[]} isAdmin={false} />)

        expect(screen.getByText('Sample Event')).toBeInTheDocument()
        expect(screen.getByText('Test Event Description')).toBeInTheDocument()
        expect(screen.getByText('HQ Location')).toBeInTheDocument()

        // Primary Contact
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('jane@example.com')).toBeInTheDocument()

        // Involved People
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()

        // Organizations
        expect(screen.getByText('Acme Corp')).toBeInTheDocument()

        // Products
        expect(screen.getByText('BrandX - Cool Product')).toBeInTheDocument()

        // Social Posts
        expect(screen.getByText('Twitter')).toBeInTheDocument()
        expect(screen.getByText('Check this out')).toBeInTheDocument()
    })

    it('toggles edit mode when Edit Event button is clicked and back', async () => {
        render(<EventDetails event={mockEvent} locations={[]} users={[]} contacts={[]} organizations={[]} availableProducts={availableProducts as any} eventSeries={[]} isAdmin={false} />)

        // Click Edit
        const editButton = screen.getByRole('button', { name: /Edit Event/i })
        fireEvent.click(editButton)

        expect(screen.getByText('Edit Event')).toBeInTheDocument()
        expect(screen.getByTestId('event-form-mock')).toBeInTheDocument()

        // Click Back to View
        const backButton = screen.getByRole('button', { name: /Back to View/i })
        fireEvent.click(backButton)

        expect(screen.queryByTestId('event-form-mock')).not.toBeInTheDocument()
        expect(screen.getByText('Sample Event')).toBeInTheDocument()
    })

    it('handles event deletion via AlertDialog', async () => {
        render(<EventDetails event={mockEvent} locations={[]} users={[]} contacts={[]} organizations={[]} availableProducts={availableProducts as any} eventSeries={[]} isAdmin={false} />)

        // Open delete dialog
        const deleteButton = screen.getByRole('button', { name: /Delete/i })
        fireEvent.click(deleteButton)

        expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument()

        // Confirm deletion
        const confirmButton = screen.getByRole('button', { name: 'Delete' })
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(deleteEvent).toHaveBeenCalledWith('1')
            expect(mockPush).toHaveBeenCalledWith('/events')
            expect(mockRefresh).toHaveBeenCalled()
        })
    })
})
