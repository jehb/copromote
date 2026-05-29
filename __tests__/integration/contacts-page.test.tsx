
import { render, screen } from '@testing-library/react'
import ContactsPage from '@/app/contacts/page'
import { getContacts } from '@/app/actions/contacts'

// Mock server actions
jest.mock('@/app/actions/contacts', () => ({
    getContacts: jest.fn(),
}))

jest.mock('@/components/layout/protected-route', () => ({
    ProtectedRoute: ({ children }: any) => <>{children}</>
}))

// Mock Client Component
jest.mock('@/components/contacts/contacts-client-page', () => ({
    ContactsClientPage: (props: any) => (
        <div data-testid="contacts-client-page">
            Mock ContactsClientPage
            <span data-testid="contact-count">{props.initialContacts?.length}</span>
        </div>
    )
}))

const mockContacts = [
    { id: 'c1', firstName: 'John', lastName: 'Doe' },
    { id: 'c2', firstName: 'Jane', lastName: 'Smith' },
]

describe('ContactsPage', () => {
    it('renders client page with fetched data', async () => {
        (getContacts as jest.Mock).mockResolvedValue(mockContacts)

        const ui = await ContactsPage()
        render(ui)

        expect(screen.getByTestId('contacts-client-page')).toBeInTheDocument()
        expect(screen.getByTestId('contact-count')).toHaveTextContent('2')
    })
})
