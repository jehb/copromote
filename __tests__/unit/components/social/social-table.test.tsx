import { render, screen } from '@testing-library/react'
import { SocialTable } from '@/components/social/social-table'
import { deleteSocialPost } from '@/app/actions/social'
import { useRouter } from 'next/navigation'
import userEvent from '@testing-library/user-event'

jest.mock('@/app/actions/social', () => ({
    deleteSocialPost: jest.fn()
}))

jest.mock('next/navigation', () => ({
    useRouter: jest.fn()
}))

describe('SocialTable', () => {
    const mockRouter = { push: jest.fn() }
    
    const mockPosts = [
        {
            id: '1',
            platform: 'Instagram',
            content: 'Test content 1',
            scheduledDate: new Date('2026-06-01T15:30:00Z').toISOString(),
            promotionPeriod: { id: 'promo1', name: 'Summer Sale' },
            status: 'scheduled'
        },
        {
            id: '2',
            platform: 'Twitter',
            content: 'Test content 2',
            scheduledDate: null,
            promotionPeriod: null,
            status: 'draft'
        }
    ]

    beforeEach(() => {
        jest.clearAllMocks()
        ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    })

    it('renders empty state when there are no posts', () => {
        render(<SocialTable posts={[]} />)
        expect(screen.getByText('No posts yet')).toBeInTheDocument()
    })

    it('renders the list of posts correctly', () => {
        render(<SocialTable posts={mockPosts} />)
        
        expect(screen.getByText('Instagram')).toBeInTheDocument()
        expect(screen.getByText('Test content 1')).toBeInTheDocument()
        expect(screen.getByText(/Jun 1, 2026/)).toBeInTheDocument()
        expect(screen.getByText('Summer Sale')).toBeInTheDocument()
        expect(screen.getByText('scheduled')).toBeInTheDocument()
        
        expect(screen.getByText('Twitter')).toBeInTheDocument()
        expect(screen.getByText('Test content 2')).toBeInTheDocument()
        expect(screen.getByText('Unscheduled')).toBeInTheDocument()
        expect(screen.getByText('-')).toBeInTheDocument()
        expect(screen.getByText('draft')).toBeInTheDocument()
    })

    it('navigates to post on row click', async () => {
        render(<SocialTable posts={mockPosts} />)
        
        // Find row for post 1
        const row1 = screen.getByText('Test content 1').closest('tr')
        await userEvent.click(row1!)
        
        expect(mockRouter.push).toHaveBeenCalledWith('/social/1')
    })

    it('does not navigate when clicking on promotion link', async () => {
        render(<SocialTable posts={mockPosts} />)
        
        const promoLink = screen.getByRole('link', { name: 'Summer Sale' })
        await userEvent.click(promoLink)
        
        expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('does not navigate when clicking on action buttons', async () => {
        render(<SocialTable posts={mockPosts} />)
        
        const deleteButtons = screen.getAllByRole('button') // Includes Eye and Trash buttons
        // Index 0: Eye button for post 1, Index 1: Trash button for post 1
        await userEvent.click(deleteButtons[1]) // Trash
        
        expect(mockRouter.push).not.toHaveBeenCalled()
    })
})
