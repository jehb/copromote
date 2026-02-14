
import { render, screen, waitFor } from '@testing-library/react'
import { ContactForm } from '@/components/contacts/contact-form'
import userEvent from '@testing-library/user-event'

const mockOrganizations = [
    { id: 'org1', name: 'Org 1' },
    { id: 'org2', name: 'Org 2' },
]

const mockContact = {
    id: 'c1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    company: 'Acme',
    jobTitle: 'Manager',
    organizationId: 'org1',
    type: 'Client',
    notes: 'Some notes',
}

describe('ContactForm', () => {
    // Mock window.history.back
    const backMock = jest.fn()

    beforeAll(() => {
        Object.defineProperty(window, 'history', {
            value: { back: backMock },
            writable: true
        })
    })

    beforeEach(() => {
        backMock.mockClear()
    })

    it('renders empty form for creation', () => {
        const actionMock = jest.fn()
        render(<ContactForm organizations={mockOrganizations} action={actionMock} />)

        expect(screen.getByText('Personal Information')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /create contact/i })).toBeInTheDocument()

        // Inputs should be empty
        expect(screen.getByLabelText('First Name')).toHaveValue('')
    })

    it('renders populated form for editing', () => {
        const actionMock = jest.fn()
        render(<ContactForm organizations={mockOrganizations} contact={mockContact} action={actionMock} />)

        expect(screen.getByRole('button', { name: /update contact/i })).toBeInTheDocument()

        expect(screen.getByLabelText('First Name')).toHaveValue('John')
        expect(screen.getByLabelText('Last Name')).toHaveValue('Doe')
        expect(screen.getByLabelText('Primary Email')).toHaveValue('john@example.com')
        // Radix Select renders a hidden select with options for form submission. 
        // getByText finds both visible span and hidden option.
        // We target the visible span (SelectValue)
        expect(screen.getByText('Org 1', { selector: 'span' })).toBeInTheDocument()
    })

    it('calls action prop on submission', async () => {
        const actionMock = jest.fn()
        render(<ContactForm organizations={mockOrganizations} action={actionMock} />)

        await userEvent.type(screen.getByLabelText('First Name'), 'Jane')
        await userEvent.type(screen.getByLabelText('Last Name'), 'Smith')

        await userEvent.click(screen.getByRole('button', { name: /create contact/i }))

        // Since action is passed to <form action={...}>, it's called with FormData
        expect(actionMock).toHaveBeenCalled()
        const formData = actionMock.mock.calls[0][0]
        expect(formData.get('firstName')).toBe('Jane')
        expect(formData.get('lastName')).toBe('Smith')
    })

    it('calls history.back on cancel', async () => {
        const actionMock = jest.fn()
        render(<ContactForm organizations={mockOrganizations} action={actionMock} />)

        await userEvent.click(screen.getByText('Cancel'))

        expect(backMock).toHaveBeenCalled()
    })
})
