import { render, screen } from '@testing-library/react'
import { PromotionListView } from '@/components/promotions/PromotionListView'

jest.mock('@/app/actions/promotions', () => ({
    deletePromotion: jest.fn()
}))

describe('PromotionListView', () => {
    beforeAll(() => {
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2026-06-15T12:00:00Z'))
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    const mockPromotions = [
        {
            id: '1',
            name: 'Active Promo',
            startDate: new Date('2026-06-01T12:00:00Z'),
            endDate: new Date('2026-06-30T12:00:00Z'),
            _count: { posts: 5, assets: 2 }
        },
        {
            id: '2',
            name: 'Upcoming Promo',
            startDate: new Date('2026-07-01T12:00:00Z'),
            endDate: new Date('2026-07-31T12:00:00Z'),
            _count: { posts: 0, assets: 0 }
        },
        {
            id: '3',
            name: 'Past Promo',
            startDate: new Date('2026-05-01T12:00:00Z'),
            endDate: new Date('2026-05-31T12:00:00Z'),
            _count: { posts: 10, assets: 5 }
        }
    ]

    it('renders empty state when there are no promotions', () => {
        render(<PromotionListView promotions={[]} />)
        expect(screen.getByText('No promotions yet')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Create Promotion' })).toBeInTheDocument()
    })

    it('renders the list of promotions and their correct status badges', () => {
        render(<PromotionListView promotions={mockPromotions} />)
        
        expect(screen.getByText('Active Promo')).toBeInTheDocument()
        expect(screen.getByText('Active Now')).toBeInTheDocument()
        expect(screen.getByText('5 posts, 2 assets')).toBeInTheDocument()
        
        expect(screen.getByText('Upcoming Promo')).toBeInTheDocument()
        expect(screen.getByText('Upcoming')).toBeInTheDocument()
        
        expect(screen.getByText('Past Promo')).toBeInTheDocument()
        expect(screen.getByText('Past')).toBeInTheDocument()
    })

    it('renders delete forms for promotions', () => {
        render(<PromotionListView promotions={mockPromotions} />)
        const buttons = screen.getAllByRole('button')
        const deleteButtons = buttons.filter(b => b.querySelector('.lucide-trash-2'))
        expect(deleteButtons).toHaveLength(3)
    })
})
