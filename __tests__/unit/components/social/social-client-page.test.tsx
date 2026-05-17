import { render, screen, waitFor } from '@testing-library/react'
import { SocialClientPage } from '@/components/social/social-client-page'
import { useQuery } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { deleteSocialPost } from '@/app/actions/social'

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn()
}))

// Mock actions
jest.mock('@/app/actions/social', () => ({
    getSocialPosts: jest.fn(),
    deleteSocialPost: jest.fn()
}))

// Mock components
jest.mock('@/components/social/social-table', () => ({
    SocialTable: () => <div data-testid="social-table">Social Table</div>
}))

jest.mock('@/components/social/social-filter-bar', () => ({
    SocialFilterBar: () => <div data-testid="social-filter-bar">Social Filter Bar</div>
}))

describe('SocialClientPage', () => {
    const mockInitialData = {
        posts: [
            {
                id: '1',
                content: 'Test post 1',
                platform: 'Instagram',
                status: 'published',
                scheduledDate: new Date('2026-05-02T12:00:00Z').toISOString(),
                assets: [
                    { url: 'http://example.com/img1.jpg', name: 'img1' },
                    { url: 'http://example.com/img2.jpg', name: 'img2' }
                ],
                promotionPeriod: {
                    id: 'promo1',
                    name: 'Summer Promo'
                }
            },
            {
                id: '2',
                content: 'Test post 2',
                platform: 'Twitter',
                status: 'draft',
                scheduledDate: null,
                assets: [],
                promotionPeriod: null
            }
        ],
        promotions: [],
        events: []
    }

    const mockInitialFilters = {
        view: 'grid' as 'grid' | 'table'
    }

    beforeEach(() => {
        jest.clearAllMocks()
        // Mock window.confirm
        window.confirm = jest.fn(() => true)
    })

    it('renders the grid view with posts correctly', () => {
        ;(useQuery as jest.Mock).mockReturnValue({
            data: mockInitialData.posts,
            isLoading: false
        })

        render(<SocialClientPage initialData={mockInitialData} initialFilters={mockInitialFilters} />)

        expect(screen.getByText('Test post 1')).toBeInTheDocument()
        expect(screen.getByText('Test post 2')).toBeInTheDocument()
        
        // Checks specific platform and status badges
        expect(screen.getAllByText('Instagram').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Twitter').length).toBeGreaterThan(0)
        expect(screen.getByText('published')).toBeInTheDocument()
        expect(screen.getByText('draft')).toBeInTheDocument()
        
        // Checks asset preview for first post
        expect(screen.getByRole('img', { name: 'img1' })).toBeInTheDocument()
        expect(screen.getByText('+1 more')).toBeInTheDocument()
        
        // Checks promotion link
        expect(screen.getByText('Promo: Summer Promo')).toBeInTheDocument()
        
        // Checks scheduled date vs queue
        expect(screen.getByText(/May 2, 2026/)).toBeInTheDocument()
        expect(screen.getByText('Queue')).toBeInTheDocument()
    })

    it('renders empty state when no posts exist', () => {
        ;(useQuery as jest.Mock).mockReturnValue({
            data: [],
            isLoading: false
        })

        render(<SocialClientPage initialData={{...mockInitialData, posts: []}} initialFilters={mockInitialFilters} />)

        expect(screen.getByText('No posts in target pipeline')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Create First Post' })).toBeInTheDocument()
    })

    it('renders loading state', () => {
        ;(useQuery as jest.Mock).mockReturnValue({
            data: [],
            isLoading: true
        })

        const { container } = render(<SocialClientPage initialData={{...mockInitialData, posts: []}} initialFilters={mockInitialFilters} />)
        expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('switches between grid and table view', async () => {
        ;(useQuery as jest.Mock).mockReturnValue({
            data: mockInitialData.posts,
            isLoading: false
        })

        // Initial view is grid
        render(<SocialClientPage initialData={mockInitialData} initialFilters={mockInitialFilters} />)
        expect(screen.getByText('Test post 1')).toBeInTheDocument()
        expect(screen.queryByTestId('social-table')).not.toBeInTheDocument()

        // Switch to table view
        // The icons don't have good text, but we can query by role/class or SVG if needed. Let's find the button by container or just test id if we can't.
        // Wait, the buttons are list and grid icons. We can just use getAllByRole and click the first one (List view)
        const buttons = screen.getAllByRole('button')
        // List button is the first view switcher (after a possible other button, let's find it by class or just index)
        // Actually, we can just click the button with the List icon.
        // We'll just grab it by class or index.
        const listBtn = buttons[0] // or search for variant?
        await userEvent.click(listBtn)
        
        // Now wait for table to appear
        await waitFor(() => {
            expect(screen.getByTestId('social-table')).toBeInTheDocument()
        })
    })

    it('filters by platform', async () => {
        ;(useQuery as jest.Mock).mockReturnValue({
            data: mockInitialData.posts,
            isLoading: false
        })

        render(<SocialClientPage initialData={mockInitialData} initialFilters={mockInitialFilters} />)

        // Click on Twitter platform badge
        await userEvent.click(screen.getByText('Twitter', { selector: '.cursor-pointer' }))
        
        // useQuery should be called with platform: 'Twitter'
        await waitFor(() => {
            expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({
                queryKey: expect.arrayContaining([{ view: 'grid', platform: 'Twitter' }])
            }))
        })
    })

    it('handles deleting a post', async () => {
        ;(useQuery as jest.Mock).mockReturnValue({
            data: mockInitialData.posts,
            isLoading: false
        })

        render(<SocialClientPage initialData={mockInitialData} initialFilters={mockInitialFilters} />)

        // Find delete buttons (trash icons)
        // There are 2 cards, so 2 trash buttons
        const trashIcons = screen.getAllByRole('button').filter(b => b.querySelector('svg.lucide-trash-2'))
        expect(trashIcons.length).toBe(2)

        await userEvent.click(trashIcons[0])

        expect(window.confirm).toHaveBeenCalledWith('Delete this post?')
        expect(deleteSocialPost).toHaveBeenCalledWith('1')
    })

    it('does not delete post if confirm is cancelled', async () => {
        ;(useQuery as jest.Mock).mockReturnValue({
            data: mockInitialData.posts,
            isLoading: false
        })

        ;(window.confirm as jest.Mock).mockReturnValueOnce(false)

        render(<SocialClientPage initialData={mockInitialData} initialFilters={mockInitialFilters} />)

        const trashIcons = screen.getAllByRole('button').filter(b => b.querySelector('svg.lucide-trash-2'))
        await userEvent.click(trashIcons[0])

        expect(window.confirm).toHaveBeenCalledWith('Delete this post?')
        expect(deleteSocialPost).not.toHaveBeenCalled()
    })
})
