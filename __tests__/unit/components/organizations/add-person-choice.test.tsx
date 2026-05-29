import { render, screen, waitFor } from '@testing-library/react'
import { AddPersonChoice } from '@/components/organizations/add-person-choice'
import userEvent from '@testing-library/user-event'
import { linkContactToOrganization } from '@/app/actions/contacts'

jest.mock('@/app/actions/contacts', () => ({
    linkContactToOrganization: jest.fn()
}))

describe('AddPersonChoice', () => {
    beforeEach(() => {
        jest.clearAllMocks()
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
        }
    })

    const availableContacts = [
        { id: '1', firstName: 'John', lastName: 'Doe', organizationId: null },
        { id: '2', firstName: 'Jane', lastName: 'Smith', organizationId: 'other-org' },
        { id: '3', firstName: 'Already', lastName: 'InOrg', organizationId: 'org-1' },
    ]

    it('opens dialog on button click', async () => {
        const user = userEvent.setup()
        render(<AddPersonChoice organizationId="org-1" organizationName="Test Org" availableContacts={availableContacts} />)
        
        await user.click(screen.getByRole('button', { name: /Add Person to Org/i }))
        
        expect(screen.getByText(/Choose how you want to add a contact to/)).toBeInTheDocument()
        expect(screen.getByText(/Test Org/)).toBeInTheDocument()
        expect(screen.getByText('Create New Contact')).toBeInTheDocument()
        expect(screen.getByText('Choose Existing Contact')).toBeInTheDocument()
    })

    it('switches to existing contact view and filters contacts', async () => {
        const user = userEvent.setup()
        render(<AddPersonChoice organizationId="org-1" organizationName="Test Org" availableContacts={availableContacts} />)
        
        await user.click(screen.getByRole('button', { name: /Add Person to Org/i }))
        await user.click(screen.getByText('Choose Existing Contact'))
        
        // Should show John Doe and Jane Smith, but not Already InOrg since they are in org-1
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.queryByText('Already InOrg')).not.toBeInTheDocument()
        
        // Test filtering
        const searchInput = screen.getByPlaceholderText('Search by name...')
        await user.type(searchInput, 'Jane')
        
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    it('handles linking an existing contact', async () => {
        const user = userEvent.setup()
        ;(linkContactToOrganization as jest.Mock).mockResolvedValue({ success: true })
        
        render(<AddPersonChoice organizationId="org-1" organizationName="Test Org" availableContacts={availableContacts} />)
        
        await user.click(screen.getByRole('button', { name: /Add Person to Org/i }))
        await user.click(screen.getByText('Choose Existing Contact'))
        
        // Click on John Doe
        await user.click(screen.getByText('John Doe'))
        
        expect(linkContactToOrganization).toHaveBeenCalledWith('1', 'org-1')
        
        // Dialog should close
        await waitFor(() => {
            expect(screen.queryByText(/Choose how you want to add a contact to/)).not.toBeInTheDocument()
        })
    })

    it('shows empty state when no contacts match', async () => {
        const user = userEvent.setup()
        render(<AddPersonChoice organizationId="org-1" organizationName="Test Org" availableContacts={availableContacts} />)
        
        await user.click(screen.getByRole('button', { name: /Add Person to Org/i }))
        await user.click(screen.getByText('Choose Existing Contact'))
        
        const searchInput = screen.getByPlaceholderText('Search by name...')
        await user.type(searchInput, 'Nobody')
        
        expect(screen.getByText('No available contacts found.')).toBeInTheDocument()
    })

    it('allows returning to choice view', async () => {
        const user = userEvent.setup()
        render(<AddPersonChoice organizationId="org-1" organizationName="Test Org" availableContacts={availableContacts} />)
        
        await user.click(screen.getByRole('button', { name: /Add Person to Org/i }))
        await user.click(screen.getByText('Choose Existing Contact'))
        
        expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument()
        
        await user.click(screen.getByText('Back to options'))
        
        expect(screen.getByText('Create New Contact')).toBeInTheDocument()
        expect(screen.queryByPlaceholderText('Search by name...')).not.toBeInTheDocument()
    })
})
