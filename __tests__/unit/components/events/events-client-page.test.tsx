import { render, screen, waitFor } from '@testing-library/react'
import { EventsClientPage } from '@/components/events/events-client-page'
import userEvent from '@testing-library/user-event'
import { useQuery } from '@tanstack/react-query'

// Mock the query hook
jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn()
}))

// Mock actions (though they are not directly called because useQuery handles it)
jest.mock('@/app/actions/events', () => ({
    getEvents: jest.fn(),
    getLocations: jest.fn(),
    getUsers: jest.fn()
}))
jest.mock('@/app/actions/contacts', () => ({
    getContacts: jest.fn()
}))
jest.mock('@/app/actions/organizations', () => ({
    getOrganizations: jest.fn()
}))
jest.mock('@/app/actions/event-series', () => ({
    getEventSeries: jest.fn()
}))

// Mock sub-components so we just assert they render
jest.mock('@/components/events/event-card', () => ({
    EventCard: () => <div data-testid="event-card">Event Card</div>
}))
jest.mock('@/components/events/event-list-view', () => ({
    EventListView: () => <div data-testid="event-list-view">Event List View</div>
}))
jest.mock('@/components/events/event-calendar-view', () => ({
    EventCalendarView: () => <div data-testid="event-calendar-view">Event Calendar View</div>
}))

describe('EventsClientPage', () => {
    const mockInitialData = {
        events: [
            { id: '1', title: 'Test Event 1', status: 'SCHEDULED' },
            { id: '2', title: 'Test Event 2', status: 'CANCELED' }
        ],
        locations: [],
        users: [],
        contacts: [],
        organizations: [],
        eventSeries: []
    }

    beforeEach(() => {
        jest.clearAllMocks()
        // Default mock implementation to return initial data
        ;(useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
            if (queryKey[0] === 'events') return { data: mockInitialData.events, isLoading: false }
            return { data: [], isLoading: false }
        })
    })

    it('renders the page header and empty state when no events exist', () => {
        ;(useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
            if (queryKey[0] === 'events') return { data: [], isLoading: false }
            return { data: [], isLoading: false }
        })

        render(<EventsClientPage initialData={{...mockInitialData, events: []}} />)
        
        expect(screen.getByText('Events')).toBeInTheDocument()
        expect(screen.getByText('No events scheduled')).toBeInTheDocument()
    })

    it('renders the loading state', () => {
        ;(useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
            if (queryKey[0] === 'events') return { data: [], isLoading: true }
            return { data: [], isLoading: false }
        })

        const { container } = render(<EventsClientPage initialData={{...mockInitialData, events: []}} />)
        expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('defaults to list view and renders EventListView', () => {
        render(<EventsClientPage initialData={mockInitialData} />)
        
        expect(screen.getByTestId('event-list-view')).toBeInTheDocument()
        expect(screen.queryByTestId('event-card')).not.toBeInTheDocument()
        expect(screen.queryByTestId('event-calendar-view')).not.toBeInTheDocument()
    })

    it('switches between views', async () => {
        render(<EventsClientPage initialData={mockInitialData} />)
        
        // Switch to Cards
        await userEvent.click(screen.getByRole('button', { name: /Cards/i }))
        expect(screen.getAllByTestId('event-card').length).toBe(1)
        
        // Switch to Calendar
        await userEvent.click(screen.getByRole('button', { name: /Calendar/i }))
        expect(screen.getByTestId('event-calendar-view')).toBeInTheDocument()
        
        // Switch back to List
        await userEvent.click(screen.getByRole('button', { name: /List/i }))
        expect(screen.getByTestId('event-list-view')).toBeInTheDocument()
    })

    it('filters events by status', async () => {
        render(<EventsClientPage initialData={mockInitialData} />)
        
        // By default, showing 1 event (SCHEDULED)
        expect(screen.getByText('Showing 1 event')).toBeInTheDocument()
        
        // Open filter dropdown
        await userEvent.click(screen.getByRole('button', { name: /Status/i }))
        
        // Uncheck "Scheduled"
        await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Scheduled' }))
        
        await waitFor(() => {
            // Filter is now just ['TENTATIVE'], so no events found
            expect(screen.getByText('No events found')).toBeInTheDocument()
        })

        // Re-open filter dropdown because it closed on select (or use Clear Filters)
        await userEvent.click(screen.getByRole('button', { name: 'Clear Filters' }))

        await waitFor(() => {
            // Empty filter means all events shown
            expect(screen.getByText('Showing 2 events')).toBeInTheDocument()
        })
    })

    it('shows no events found when filter matches nothing', async () => {
        render(<EventsClientPage initialData={mockInitialData} />)
        
        // Open filter dropdown
        await userEvent.click(screen.getByRole('button', { name: /Status/i }))
        
        // Check "Past"
        await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Past' }))
        
        // Re-open filter dropdown and uncheck "Scheduled"
        await userEvent.click(screen.getByRole('button', { name: /Status/i }))
        await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Scheduled' }))

        await waitFor(() => {
            expect(screen.getByText('No events found')).toBeInTheDocument()
        })

        // Clear filters button should appear
        await userEvent.click(screen.getByRole('button', { name: 'Clear Filters' }))

        await waitFor(() => {
            expect(screen.getByText('Showing 2 events')).toBeInTheDocument()
        })
    })

    it('calls the appropriate server actions in query functions', async () => {
        render(<EventsClientPage initialData={mockInitialData} />)

        const useQueryCalls = (useQuery as jest.Mock).mock.calls;
        for (const call of useQueryCalls) {
            if (call[0]?.queryFn) {
                await call[0].queryFn();
            }
        }

        const { getEvents, getLocations, getUsers } = require('@/app/actions/events');
        const { getContacts } = require('@/app/actions/contacts');
        const { getOrganizations } = require('@/app/actions/organizations');
        const { getEventSeries } = require('@/app/actions/event-series');

        expect(getEvents).toHaveBeenCalled();
        expect(getLocations).toHaveBeenCalled();
        expect(getUsers).toHaveBeenCalled();
        expect(getContacts).toHaveBeenCalled();
        expect(getOrganizations).toHaveBeenCalled();
        expect(getEventSeries).toHaveBeenCalled();
    })
})
