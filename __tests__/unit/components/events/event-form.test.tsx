import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { EventForm } from '@/components/events/event-form'
import userEvent from '@testing-library/user-event'

// Mock the ProductSelector since it might have complex internal rendering
jest.mock('@/components/email-planner/product-selector', () => ({
    ProductSelector: ({ onSelect }: any) => (
        <button data-testid="mock-product-selector" type="button" onClick={() => onSelect('123456789')}>
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
    createEventSeries: jest.fn().mockResolvedValue({ success: true, series: { id: 's2', title: 'New Series' } })
}))

jest.mock('@/app/actions/wordpress', () => ({
    searchWordPressEvents: jest.fn().mockResolvedValue([
        { id: 999, title: 'WP Event 1', url: 'https://wp.com/event1', start_date: '2023-11-01' }
    ])
}))

const mockLocations = [{ id: 'loc1', name: 'Location 1' }]
const mockUsers = [{ id: 'u1', name: 'User 1' }]
const mockContacts = [
    { id: 'c1', firstName: 'John', lastName: 'Doe', company: 'Acme', type: 'Client' },
    { id: 'c2', firstName: 'Jane', lastName: 'Smith', company: 'Corp', type: 'Vendor' }
]
const mockOrganizations = [
    { id: 'org1', name: 'Org 1', category: 'Tech' },
    { id: 'org2', name: 'Org 2', category: 'Health' }
]
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
    products: [{ upc: '123456789' }],
    wordpressId: 123,
    wordpressUrl: 'https://wp.com/old'
}

describe('EventForm', () => {
    const backMock = jest.fn()

    beforeAll(() => {
        Object.defineProperty(window, 'history', {
            value: { back: backMock },
            writable: true
        })
        if (typeof window !== 'undefined') {
            window.PointerEvent = class PointerEvent extends Event {
                button: number;
                ctrlKey: boolean;
                pointerType: string;
                constructor(type: string, props: PointerEventInit = {}) {
                    super(type, props);
                    this.button = props.button ?? 0;
                    this.ctrlKey = props.ctrlKey ?? false;
                    this.pointerType = props.pointerType ?? 'mouse';
                }
            } as any;
            
            // Mock ResizeObserver for Radix UI
            window.ResizeObserver = class ResizeObserver {
                observe() {}
                unobserve() {}
                disconnect() {}
            } as any;
        }
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

    it('handles contact search and selection', async () => {
        const user = userEvent.setup()
        render(
            <EventForm locations={mockLocations} users={mockUsers} contacts={mockContacts} organizations={mockOrganizations} action={jest.fn()} />
        )

        // Open Dialog
        await user.click(screen.getByRole('button', { name: /add person/i }))
        
        // Search
        const searchInput = screen.getByPlaceholderText(/search contacts/i)
        await user.type(searchInput, 'Jane')
        
        // Verify filter
        expect(screen.getByText(/Jane Smith/)).toBeInTheDocument()
        expect(screen.queryByText(/John Doe/)).not.toBeInTheDocument()

        // Toggle contact
        const checkbox = screen.getByRole('checkbox', { name: /Jane Smith/i })
        await user.click(checkbox)

        // Close dialog by clicking done or pressing escape
        await user.keyboard('{Escape}')
        
        // Ensure Jane is in the selected badges
        expect(screen.getByText(/Jane Smith/)).toBeInTheDocument()

        // Remove Jane
        const removeBtns = screen.getAllByRole('button', { hidden: true })
        const removeJane = removeBtns.find(b => b.innerHTML.includes('lucide-x') && b.closest('.bg-white')?.textContent?.includes('Jane Smith'))
        if (removeJane) await user.click(removeJane)
        
        expect(screen.queryByText(/Jane Smith/)).not.toBeInTheDocument()
    })

    it('handles org search and selection', async () => {
        const user = userEvent.setup()
        render(
            <EventForm locations={mockLocations} users={mockUsers} contacts={mockContacts} organizations={mockOrganizations} action={jest.fn()} />
        )

        await user.click(screen.getByRole('button', { name: /add organization/i }))
        const searchInput = screen.getByPlaceholderText(/search organizations/i)
        await user.type(searchInput, 'Health')
        
        expect(screen.getByText(/Org 2/)).toBeInTheDocument()
        expect(screen.queryByText(/Org 1/)).not.toBeInTheDocument()

        await user.click(screen.getByRole('checkbox', { name: /Org 2/i }))
        await user.keyboard('{Escape}')
        
        expect(screen.getByText(/Org 2/)).toBeInTheDocument()

        // Remove Org
        const orgText = screen.getByText(/Org 2/)
        if (orgText && orgText.parentElement) {
            const removeOrg = orgText.parentElement.querySelector('button')
            if (removeOrg) fireEvent.click(removeOrg)
        }
        
        expect(screen.queryByText(/Org 2/)).not.toBeInTheDocument()
    })

    it('handles product selection and removal', async () => {
        const user = userEvent.setup()
        render(
            <EventForm locations={mockLocations} users={mockUsers} contacts={mockContacts} organizations={mockOrganizations} availableProducts={mockAvailableProducts} action={jest.fn()} />
        )

        // Select product
        await user.click(screen.getByTestId('mock-product-selector'))
        expect(screen.getByText(/Product 1/)).toBeInTheDocument()

        // Double add does nothing
        await user.click(screen.getByTestId('mock-product-selector'))

        // Remove product
        const productText = screen.getByText(/Product 1/)
        if (productText && productText.parentElement) {
            const removeProduct = productText.parentElement.querySelector('button')
            if (removeProduct) fireEvent.click(removeProduct)
        }
        
        expect(screen.queryByText(/Product 1/)).not.toBeInTheDocument()
    })

    it('handles event series creation', async () => {
        const user = userEvent.setup()
        render(
            <EventForm locations={mockLocations} users={mockUsers} contacts={mockContacts} organizations={mockOrganizations} action={jest.fn()} />
        )

        await user.click(screen.getByRole('button', { name: /create new series/i }))
        await user.type(screen.getByLabelText(/series title/i), 'New Series')
        await user.click(screen.getByRole('button', { name: /^create series/i }))

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })
    })

    it('handles WP search and selection', async () => {
        const user = userEvent.setup()
        render(
            <EventForm locations={mockLocations} users={mockUsers} contacts={mockContacts} organizations={mockOrganizations} action={jest.fn()} />
        )

        // Type search
        const searchInput = screen.getByPlaceholderText(/search events by title/i)
        await user.type(searchInput, 'WP Event{Enter}')
        
        await waitFor(() => {
            expect(screen.getByText('WP Event 1')).toBeInTheDocument()
        })

        // Select WP event
        await user.click(screen.getByText('WP Event 1'))
        
        expect(screen.getByText('Linked to WordPress Event #999')).toBeInTheDocument()

        // Unlink
        await user.click(screen.getByRole('button', { name: /unlink/i }))
        expect(screen.queryByText('Linked to WordPress Event #999')).not.toBeInTheDocument()
    })

    it('renders populated form and handles cancel', async () => {
        render(
            <EventForm
                event={mockEvent}
                locations={mockLocations}
                users={mockUsers}
                contacts={mockContacts}
                organizations={mockOrganizations}
                eventSeries={mockEventSeries}
                availableProducts={mockAvailableProducts}
                action={jest.fn()}
            />
        )

        expect(screen.getByRole('button', { name: /update event/i })).toBeInTheDocument()
        expect(screen.getByText('Linked to WordPress Event #123')).toBeInTheDocument()
        
        const user = userEvent.setup()
        await user.click(screen.getByText('Cancel'))
        expect(backMock).toHaveBeenCalled()
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

        const user = userEvent.setup()
        await user.type(screen.getByLabelText('Event Title'), 'New Event')
        
        const startTimeInput = screen.getByLabelText('Start Time')
        fireEvent.change(startTimeInput, { target: { value: '2023-10-10T10:00' } })
        
        const endTimeInput = screen.getByLabelText('End Time')
        fireEvent.change(endTimeInput, { target: { value: '2023-10-10T12:00' } })

        const form = screen.getByRole('button', { name: /create event/i }).closest('form')
        fireEvent.submit(form!)

        expect(actionMock).toHaveBeenCalled()
        const formData = actionMock.mock.calls[0][0]
        expect(formData.get('title')).toBe('New Event')
    })
})
