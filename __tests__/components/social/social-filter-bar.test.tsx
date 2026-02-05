import { render, screen, fireEvent } from '@testing-library/react'
import { SocialFilterBar } from '@/components/social/social-filter-bar'
import { useRouter, useSearchParams } from 'next/navigation'

// Mock next/navigation
const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}))

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

describe('SocialFilterBar Component', () => {
    const mockPromotions = [
        { id: '1', name: 'Summer Sale' },
        { id: '2', name: 'Black Friday' },
    ]

    const mockEvents = [
        { id: '1', title: 'Product Launch' },
        { id: '2', title: 'Conference' },
    ]

    beforeEach(() => {
        mockUseRouter.mockReturnValue({
            push: mockPush,
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
        } as any)

        mockUseSearchParams.mockReturnValue(mockSearchParams as any)
        mockPush.mockClear()
    })

    it('should render collapsed by default', () => {
        render(<SocialFilterBar promotions={mockPromotions} events={mockEvents} />)

        expect(screen.getByText('Advanced Filters')).toBeInTheDocument()
        // Filters should not be visible initially
        expect(screen.queryByText('Status')).not.toBeInTheDocument()
    })

    it('should expand filters when header is clicked', () => {
        render(<SocialFilterBar promotions={mockPromotions} events={mockEvents} />)

        const header = screen.getByText('Advanced Filters')
        fireEvent.click(header)

        // Filters should now be visible
        expect(screen.getByText('Status')).toBeInTheDocument()
        expect(screen.getByText('From Date')).toBeInTheDocument()
        expect(screen.getByText('To Date')).toBeInTheDocument()
        expect(screen.getByText('Promotion')).toBeInTheDocument()
        expect(screen.getByText('Linked Event')).toBeInTheDocument()
    })

    it('should collapse filters when header is clicked again', () => {
        render(<SocialFilterBar promotions={mockPromotions} events={mockEvents} />)

        const header = screen.getByText('Advanced Filters')

        // Expand
        fireEvent.click(header)
        expect(screen.getByText('Status')).toBeInTheDocument()

        // Collapse
        fireEvent.click(header)
        expect(screen.queryByText('Status')).not.toBeInTheDocument()
    })

    it('should show active badge when filters are applied', () => {
        const searchParamsWithFilter = new URLSearchParams('status=published')
        mockUseSearchParams.mockReturnValue(searchParamsWithFilter as any)

        render(<SocialFilterBar promotions={mockPromotions} events={mockEvents} />)

        expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('should show clear all button when filters are active', () => {
        const searchParamsWithFilter = new URLSearchParams('status=published')
        mockUseSearchParams.mockReturnValue(searchParamsWithFilter as any)

        render(<SocialFilterBar promotions={mockPromotions} events={mockEvents} />)

        // Expand to see clear button
        fireEvent.click(screen.getByText('Advanced Filters'))

        expect(screen.getByText('Clear All')).toBeInTheDocument()
    })

    it('should render promotion options', () => {
        render(<SocialFilterBar promotions={mockPromotions} events={mockEvents} />)

        // Expand filters
        fireEvent.click(screen.getByText('Advanced Filters'))

        // Check that promotions are in the document (they're in a select)
        expect(screen.getByText('Promotion')).toBeInTheDocument()
    })

    it('should render event options', () => {
        render(<SocialFilterBar promotions={mockPromotions} events={mockEvents} />)

        // Expand filters
        fireEvent.click(screen.getByText('Advanced Filters'))

        // Check that events filter is present
        expect(screen.getByText('Linked Event')).toBeInTheDocument()
    })
})
