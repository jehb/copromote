import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { EventForm } from '@/components/events/event-form'
import userEvent from '@testing-library/user-event'

// Mock the ProductSelector since it might have complex internal rendering
jest.mock('@/components/email-planner/product-selector', () => ({
    ProductSelector: ({ onSelect }: any) => (
        <button data-testid="mock-product-selector" onClick={() => onSelect('123456789')}>
            Mock Product Selector
        </button>
    )
}))

// Mock RichTextEditor
jest.mock('@/components/ui/rich-text-editor', () => ({
    RichTextEditor: ({ value, onChange, placeholder }: any) => (
        <textarea
            data-testid="mock-rich-text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}))

// Mock Server Actions
jest.mock('@/app/actions/event-series', () => ({
    createEventSeries: jest.fn().mockResolvedValue({ success: true, series: { id: 's1', title: 'New Series' } })
}))

const mockLocations = [{ id: 'loc1', name: 'Location 1' }]
const mockUsers = [{ id: 'u1', name: 'User 1' }]
const mockContacts = [{ id: 'c1', firstName: 'John', lastName: 'Doe', company: 'Acme', type: 'Client' }]
const mockOrganizations = [{ id: 'org1', name: 'Org 1', category: 'Tech' }]
const mockEventSeries = [{ id: 's1', title: 'Series 1' }]
const mockAvailableProducts = [{ upc: '123456789', name: 'Product 1', brand: 'Brand 1', category: 'Category 1', subCategory: 'Sub 1', image: '', price: '10' }]

const mockEvent = {
    id: 'e1',
    title: 'Test Event',
    status: 'SCHEDULED',
    startTime: '2023-10-10T10:00:00.000Z',
    endTime: '2023-10-10T12:00:00.000Z',
    locationId: 'loc1',
    primaryContactId: 'u1',
    seriesId: 's1',
    description: 'Test description',
    internalNotes: 'Internal notes',
    contacts: [mockContacts[0]],
    organizations: [mockOrganizations[0]],
    products: [{ upc: '123456789' }]
}

describe('EventForm', () => {
    const backMock = jest.fn()

    beforeAll(() => {
        Object.defineProperty(window, 'history', {
            value: { back: backMock },
            writable: true
        })
    })

    beforeEach(() => {
        backMock.mockClear()
        jest.clearAllMocks()
    })

    it('renders empty form for creation', () => {
        const actionMock = jest.fn()
        render(
            <EventForm
                locations={mockLocations}
                users={mockUsers}
                contacts={mockContacts}
                organizations={mockOrganizations}
                eventSeries={mockEventSeries}
                availableProducts={mockAvailableProducts}
                action={actionMock}
            />
        )

        expect(screen.getByText('Basic Information')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument()
        expect(screen.getByLabelText('Event Title')).toHaveValue('')
    })

    it('renders populated form for editing', () => {
        const actionMock = jest.fn()
        render(
            <EventForm
                event={mockEvent}
                locations={mockLocations}
                users={mockUsers}
                contacts={mockContacts}
                organizations={mockOrganizations}
                eventSeries={mockEventSeries}
                availableProducts={mockAvailableProducts}
                action={actionMock}
            />
        )

        expect(screen.getByRole('button', { name: /update event/i })).toBeInTheDocument()
        expect(screen.getByLabelText('Event Title')).toHaveValue('Test Event')

    })

    it('calls action prop on submission', async () => {
        const actionMock = jest.fn()
        render(
            <EventForm
                locations={mockLocations}
                users={mockUsers}
                contacts={mockContacts}
                organizations={mockOrganizations}
                action={actionMock}
            />
        )

        await userEvent.type(screen.getByLabelText('Event Title'), 'New Event')
        
        const startTimeInput = screen.getByLabelText('Start Time')
        fireEvent.change(startTimeInput, { target: { value: '2023-10-10T10:00' } })
        
        const endTimeInput = screen.getByLabelText('End Time')
        fireEvent.change(endTimeInput, { target: { value: '2023-10-10T12:00' } })

        // Bypass HTML5 validation for Select since it's hard to interact with Radix Select required
        const form = screen.getByRole('button', { name: /create event/i }).closest('form')
        fireEvent.submit(form!)



        expect(actionMock).toHaveBeenCalled()
        const formData = actionMock.mock.calls[0][0]
        expect(formData.get('title')).toBe('New Event')
    })

    it('calls history.back on cancel', async () => {
        const actionMock = jest.fn()
        render(
            <EventForm
                locations={mockLocations}
                users={mockUsers}
                contacts={mockContacts}
                organizations={mockOrganizations}
                action={actionMock}
            />
        )

        await userEvent.click(screen.getByText('Cancel'))

        expect(backMock).toHaveBeenCalled()
    })
})
