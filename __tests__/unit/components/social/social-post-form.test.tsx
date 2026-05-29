import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { SocialPostForm } from '@/components/social/social-post-form'
import userEvent from '@testing-library/user-event'
import { generateSocialPostAlternatives } from '@/app/actions/ai'

// Mock dependencies
jest.mock('@/app/actions/ai', () => ({
    generateSocialPostAlternatives: jest.fn()
}))

jest.mock('@/components/gallery/photo-selection-modal', () => ({
    PhotoSelectionModal: () => <button data-testid="mock-photo-modal">Select Photos</button>
}))

describe('SocialPostForm', () => {
    const mockPromotions = [{ id: 'p1', name: 'Promo 1' }]
    const mockUsers = [{ id: 'u1', name: 'User 1' }]
    const mockEvents = [{ id: 'e1', title: 'Event 1' }]
    const mockPlatforms = [{ value: 'Twitter', label: 'Twitter' }, { value: 'LinkedIn', label: 'LinkedIn' }]
    const mockAction = jest.fn().mockResolvedValue(undefined)

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders empty form for creation', () => {
        render(
            <SocialPostForm 
                promotions={mockPromotions} 
                users={mockUsers} 
                events={mockEvents} 
                availablePlatforms={mockPlatforms} 
                action={mockAction} 
            />
        )

        expect(screen.getByPlaceholderText(/Write your caption/i)).toHaveValue('')
        expect(screen.getByRole('button', { name: /Create Post/i })).toBeInTheDocument()
        expect(screen.getByTestId('mock-photo-modal')).toBeInTheDocument()
    })

    it('renders populated form for editing', () => {
        const mockPost = {
            id: 'post1',
            content: 'Test content',
            platform: 'LinkedIn',
            status: 'draft',
            assets: []
        }

        render(
            <SocialPostForm 
                post={mockPost}
                promotions={mockPromotions} 
                users={mockUsers} 
                events={mockEvents} 
                availablePlatforms={mockPlatforms} 
                action={mockAction} 
            />
        )

        expect(screen.getByDisplayValue('Test content')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument()
    })

    it('conditionally renders Reviewer field when status is ready-for-review', () => {
        const mockPost = { status: 'ready-for-review' }
        render(
            <SocialPostForm 
                post={mockPost}
                promotions={mockPromotions} 
                users={mockUsers} 
                events={mockEvents} 
                availablePlatforms={mockPlatforms} 
                action={mockAction} 
            />
        )

        // It should render the reviewer Select Label
        const reviewerLabels = screen.getAllByText(/Reviewer/)
        expect(reviewerLabels.length).toBeGreaterThan(0)
    })

    it('handles AI suggestions', async () => {
        (generateSocialPostAlternatives as jest.Mock).mockResolvedValue([
            'Alt 1', 'Alt 2', 'Alt 3'
        ])
        
        render(
            <SocialPostForm 
                promotions={mockPromotions} 
                users={mockUsers} 
                events={mockEvents} 
                availablePlatforms={mockPlatforms} 
                action={mockAction} 
            />
        )

        // Type content > 10 chars
        await userEvent.type(screen.getByPlaceholderText(/Write your caption/), 'This is a long enough content to trigger AI.')
        
        // Click AI suggestions button
        await userEvent.click(screen.getByRole('button', { name: /AI Suggestions/i }))

        await waitFor(() => {
            expect(generateSocialPostAlternatives).toHaveBeenCalled()
            // Check that alternatives are rendered
            expect(screen.getByText('Alt 1')).toBeInTheDocument()
            expect(screen.getByText('Alt 2')).toBeInTheDocument()
            expect(screen.getByText('Alt 3')).toBeInTheDocument()
        })

        // Select an alternative
        await userEvent.click(screen.getByText('Alt 1').closest('button')!)
        
        // Check that content was updated
        expect(screen.getByPlaceholderText(/Write your caption/)).toHaveValue('Alt 1')
    })

    it('shows error if AI suggestion content is too short', async () => {
        render(
            <SocialPostForm 
                promotions={mockPromotions} 
                users={mockUsers} 
                events={mockEvents} 
                availablePlatforms={mockPlatforms} 
                action={mockAction} 
            />
        )

        await userEvent.type(screen.getByPlaceholderText(/Write your caption/), 'Short')
        await userEvent.click(screen.getByRole('button', { name: /AI Suggestions/i }))

        expect(screen.getByText('Please enter at least 10 characters to get meaningful suggestions.')).toBeInTheDocument()
        expect(generateSocialPostAlternatives).not.toHaveBeenCalled()
    })

    it('submits form with correct action', async () => {
        render(
            <SocialPostForm 
                promotions={mockPromotions} 
                users={mockUsers} 
                events={mockEvents} 
                availablePlatforms={mockPlatforms} 
                action={mockAction} 
            />
        )

        await userEvent.type(screen.getByPlaceholderText(/Write your caption/), 'New post content')
        
        const form = screen.getByRole('button', { name: /Create Post/i }).closest('form')
        fireEvent.submit(form!)

        await waitFor(() => {
            expect(mockAction).toHaveBeenCalled()
        })
        
        const formData = mockAction.mock.calls[0][0]
        expect(formData.get('content')).toBe('New post content')
    })
})
