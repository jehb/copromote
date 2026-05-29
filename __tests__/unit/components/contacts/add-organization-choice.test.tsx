import { render, screen, waitFor } from '@testing-library/react'
import { AddOrganizationChoice } from '@/components/contacts/add-organization-choice'
import { linkContactToOrganization } from '@/app/actions/contacts'
import userEvent from '@testing-library/user-event'

jest.mock('@/app/actions/contacts', () => ({
    linkContactToOrganization: jest.fn()
}))

// Mock pointer events since shadcn Dialog uses Radix which depends on Pointer events
class MockPointerEvent extends Event {
    button: number;
    ctrlKey: boolean;
    pointerType: string;

    constructor(type: string, props: PointerEventInit) {
        super(type, props);
        this.button = props.button || 0;
        this.ctrlKey = props.ctrlKey || false;
        this.pointerType = props.pointerType || 'mouse';
    }
}
window.PointerEvent = MockPointerEvent as any;
window.HTMLElement.prototype.scrollIntoView = jest.fn();
window.HTMLElement.prototype.hasPointerCapture = jest.fn();
window.HTMLElement.prototype.releasePointerCapture = jest.fn();

describe('AddOrganizationChoice', () => {
    const mockOrgs = [
        { id: 'org-1', name: 'Acme Corp', category: 'technology', website: 'https://acme.com' },
        { id: 'org-2', name: 'Globex', category: 'manufacturing' },
        { id: 'org-3', name: 'Stark Industries', category: 'defense', website: 'stark.com' }
    ]

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders the dialog trigger button', () => {
        render(<AddOrganizationChoice contactId="1" contactName="John Doe" availableOrganizations={mockOrgs} />)
        expect(screen.getByRole('button', { name: /Link to Organization/i })).toBeInTheDocument()
    })

    it('opens dialog and shows choice view initially', async () => {
        render(<AddOrganizationChoice contactId="1" contactName="John Doe" availableOrganizations={mockOrgs} />)
        
        await userEvent.click(screen.getByRole('button', { name: /Link to Organization/i }))
        
        expect(screen.getByRole('heading', { name: 'Link Organization' })).toBeInTheDocument()
        expect(screen.getByText(/Connect/)).toHaveTextContent('Connect **John Doe** to an organization in your database')
        expect(screen.getByText('Register New Organization')).toBeInTheDocument()
        expect(screen.getByText('Select Existing Organization')).toBeInTheDocument()
    })

    it('navigates to existing organization view and shows all orgs', async () => {
        render(<AddOrganizationChoice contactId="1" contactName="John Doe" availableOrganizations={mockOrgs} />)
        
        await userEvent.click(screen.getByRole('button', { name: /Link to Organization/i }))
        await userEvent.click(screen.getByText('Select Existing Organization'))
        
        expect(screen.getByPlaceholderText('Search organizations...')).toBeInTheDocument()
        expect(screen.getByText('Acme Corp')).toBeInTheDocument()
        expect(screen.getByText('Globex')).toBeInTheDocument()
        expect(screen.getByText('Stark Industries')).toBeInTheDocument()
        // Check website host parsing
        expect(screen.getByText('acme.com')).toBeInTheDocument()
        expect(screen.getByText('stark.com')).toBeInTheDocument()
    })

    it('filters organizations based on search input', async () => {
        render(<AddOrganizationChoice contactId="1" contactName="John Doe" availableOrganizations={mockOrgs} />)
        
        await userEvent.click(screen.getByRole('button', { name: /Link to Organization/i }))
        await userEvent.click(screen.getByText('Select Existing Organization'))
        
        const input = screen.getByPlaceholderText('Search organizations...')
        await userEvent.type(input, 'acme')
        
        expect(screen.getByText('Acme Corp')).toBeInTheDocument()
        expect(screen.queryByText('Globex')).not.toBeInTheDocument()
        expect(screen.queryByText('Stark Industries')).not.toBeInTheDocument()
    })

    it('shows "No organizations found" when search yields no results', async () => {
        render(<AddOrganizationChoice contactId="1" contactName="John Doe" availableOrganizations={mockOrgs} />)
        
        await userEvent.click(screen.getByRole('button', { name: /Link to Organization/i }))
        await userEvent.click(screen.getByText('Select Existing Organization'))
        
        const input = screen.getByPlaceholderText('Search organizations...')
        await userEvent.type(input, 'nonexistent')
        
        expect(screen.getByText('No organizations found.')).toBeInTheDocument()
    })

    it('calls linkContactToOrganization when an org is clicked', async () => {
        ;(linkContactToOrganization as jest.Mock).mockResolvedValue({})
        render(<AddOrganizationChoice contactId="contact-1" contactName="John Doe" availableOrganizations={mockOrgs} />)
        
        await userEvent.click(screen.getByRole('button', { name: /Link to Organization/i }))
        await userEvent.click(screen.getByText('Select Existing Organization'))
        
        const orgBtn = screen.getByText('Acme Corp').closest('button')!
        await userEvent.click(orgBtn)
        
        expect(linkContactToOrganization).toHaveBeenCalledWith('contact-1', 'org-1')
        
        // Wait for dialog to close (trigger button is visible but dialog content should be gone)
        await waitFor(() => {
            expect(screen.queryByRole('heading', { name: 'Link Organization' })).not.toBeInTheDocument()
        })
    })

    it('allows navigating back to choice view', async () => {
        render(<AddOrganizationChoice contactId="1" contactName="John Doe" availableOrganizations={mockOrgs} />)
        
        await userEvent.click(screen.getByRole('button', { name: /Link to Organization/i }))
        await userEvent.click(screen.getByText('Select Existing Organization'))
        
        const backBtn = screen.getByRole('button', { name: 'Back to options' })
        await userEvent.click(backBtn)
        
        expect(screen.getByText('Register New Organization')).toBeInTheDocument()
        expect(screen.queryByPlaceholderText('Search organizations...')).not.toBeInTheDocument()
    })
})
