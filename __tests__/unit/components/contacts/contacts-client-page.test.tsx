import { render, screen, fireEvent } from '@testing-library/react'
import { ContactsClientPage } from '@/components/contacts/contacts-client-page'
import { useQuery } from '@tanstack/react-query'
import { useOfflineMutation } from '@/hooks/use-offline-mutation'

jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(),
}))

jest.mock('@/hooks/use-offline-mutation', () => ({
    useOfflineMutation: jest.fn(),
}))

// Mock Radix UI Dropdown to render inline for easy testing
jest.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children, asChild }: any) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
    DropdownMenuItem: ({ children, onClick, className }: any) => <div onClick={onClick} className={className} data-testid="dropdown-item">{children}</div>,
}))

// Mock user-avatar to be simpler and not include text that conflicts
jest.mock('@/components/ui/user-avatar', () => ({
    UserAvatar: () => <div data-testid="user-avatar">Avatar</div>
}))

const mockInitialContacts = [
    {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        type: 'Client',
        email: 'john@example.com',
        phone: '123-456-7890',
        company: 'Acme Corp',
        jobTitle: 'Developer'
    },
    {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        type: 'Vendor',
        organization: { id: 'org-1', name: 'Tech Solutions' }
    }
]

describe('ContactsClientPage', () => {
    let mockMutate: jest.Mock

    beforeEach(() => {
        mockMutate = jest.fn()
        ;(useOfflineMutation as jest.Mock).mockReturnValue({
            mutate: mockMutate
        })
        ;(useQuery as jest.Mock).mockReturnValue({
            data: mockInitialContacts,
            isLoading: false
        })

        window.confirm = jest.fn(() => true)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders the page header and empty search input initially', () => {
        render(<ContactsClientPage initialContacts={mockInitialContacts} />)
        expect(screen.getByText('Contacts')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Search contacts...')).toHaveValue('')
    })

    it('displays contacts with appropriate badges and information', () => {
        render(<ContactsClientPage initialContacts={mockInitialContacts} />)

        // Check for contact names (which are rendered as "{firstName} {lastName}")
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()

        // Check for types (badges)
        expect(screen.getByText('Client')).toBeInTheDocument()
        expect(screen.getByText('Vendor')).toBeInTheDocument()

        // Check for organization/company
        expect(screen.getByText('Acme Corp')).toBeInTheDocument()
        expect(screen.getByText('Tech Solutions')).toBeInTheDocument()
    })

    it('filters contacts when typing in the search input', () => {
        render(<ContactsClientPage initialContacts={mockInitialContacts} />)

        const searchInput = screen.getByPlaceholderText('Search contacts...')
        fireEvent.change(searchInput, { target: { value: 'john' } })

        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })

    it('filters contacts by organization name', () => {
        render(<ContactsClientPage initialContacts={mockInitialContacts} />)

        const searchInput = screen.getByPlaceholderText('Search contacts...')
        fireEvent.change(searchInput, { target: { value: 'Tech Solutions' } })

        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })

    it('displays empty state when no contacts match search', () => {
        render(<ContactsClientPage initialContacts={mockInitialContacts} />)

        const searchInput = screen.getByPlaceholderText('Search contacts...')
        fireEvent.change(searchInput, { target: { value: 'NonexistentContact' } })

        expect(screen.getByText('No contacts found.')).toBeInTheDocument()
    })

    it('displays empty state when initialContacts is empty', () => {
        ;(useQuery as jest.Mock).mockReturnValue({
            data: [],
            isLoading: false
        })

        render(<ContactsClientPage initialContacts={[]} />)
        expect(screen.getByText('No contacts found.')).toBeInTheDocument()
    })

    it('displays loading state when fetching and no contacts', () => {
        ;(useQuery as jest.Mock).mockReturnValue({
            data: [],
            isLoading: true
        })

        const { container } = render(<ContactsClientPage initialContacts={[]} />)
        expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('calls delete mutation when deleting a contact', () => {
        render(<ContactsClientPage initialContacts={mockInitialContacts} />)

        // Find all Delete Contact options and click the first one (for John Doe)
        const deleteOptions = screen.getAllByText('Delete Contact')

        // We have to find the parent node that has the onClick handler (the DropdownMenuItem mock)
        const clickableParent = deleteOptions[0].closest('[data-testid="dropdown-item"]')

        if (clickableParent) {
            fireEvent.click(clickableParent)
        }

        // Verify confirm was called
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this contact?')

        // Verify mutate was called with the correct ID
        expect(mockMutate).toHaveBeenCalledWith('1')
    })

    it('does not call delete mutation when cancelling confirmation', () => {
        // Override confirm to return false
        window.confirm = jest.fn(() => false)

        render(<ContactsClientPage initialContacts={mockInitialContacts} />)

        const deleteOptions = screen.getAllByText('Delete Contact')
        const clickableParent = deleteOptions[0].closest('[data-testid="dropdown-item"]')

        if (clickableParent) {
            fireEvent.click(clickableParent)
        }

        expect(window.confirm).toHaveBeenCalled()
        expect(mockMutate).not.toHaveBeenCalled()
    })
})
