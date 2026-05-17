import { render, screen } from '@testing-library/react'
import { HyperlinkList } from '@/components/hyperlinks/hyperlink-list'
import { deleteHyperlink } from '@/app/actions/hyperlinks'

jest.mock('@/app/actions/hyperlinks', () => ({
    deleteHyperlink: jest.fn()
}))

jest.mock('@/components/hyperlinks/hyperlink-form', () => ({
    HyperlinkForm: () => <button>Edit Hyperlink</button>
}))

describe('HyperlinkList', () => {
    const mockHyperlinks = [
        {
            id: '1',
            title: 'Test Link 1',
            url: 'https://example.com',
            description: 'A test description',
            icon: 'Globe',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: '2',
            title: 'Test Link 2',
            url: 'https://example.org',
            description: null,
            icon: 'NonExistentIcon',
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ]

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders empty state when there are no hyperlinks', () => {
        render(<HyperlinkList hyperlinks={[]} />)
        expect(screen.getByText('No hyperlinks found. Create one to get started.')).toBeInTheDocument()
    })

    it('renders the list of hyperlinks correctly', () => {
        render(<HyperlinkList hyperlinks={mockHyperlinks} />)
        
        expect(screen.getByText('Test Link 1')).toBeInTheDocument()
        expect(screen.getByText('https://example.com')).toBeInTheDocument()
        expect(screen.getByText('A test description')).toBeInTheDocument()

        expect(screen.getByText('Test Link 2')).toBeInTheDocument()
        expect(screen.getByText('https://example.org')).toBeInTheDocument()
        expect(screen.getByText('No description provided.')).toBeInTheDocument()
    })

    it('renders the edit form and delete button for each hyperlink', () => {
        render(<HyperlinkList hyperlinks={mockHyperlinks} />)
        
        const editButtons = screen.getAllByRole('button', { name: 'Edit Hyperlink' })
        expect(editButtons).toHaveLength(2)

        const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
        expect(deleteButtons).toHaveLength(2)
    })
})
