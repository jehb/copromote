import { render, screen, fireEvent } from '@testing-library/react'
import { SocialFilterBar } from '@/components/social/social-filter-bar'
import { useRouter, useSearchParams } from 'next/navigation'

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn()
}))

describe('SocialFilterBar', () => {
    const mockRouterPush = jest.fn()
    const mockPromotions = [{ id: 'p1', name: 'Promo 1' }]
    const mockEvents = [{ id: 'e1', title: 'Event 1' }]

    beforeAll(() => {
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

    beforeEach(() => {
        jest.clearAllMocks()
        ;(useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush })
        ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())
    })

    it('renders and toggles expand/collapse', () => {
        render(<SocialFilterBar promotions={mockPromotions} events={mockEvents} />)
        
        expect(screen.getByText('Advanced Filters')).toBeInTheDocument()
        expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument()

        fireEvent.click(screen.getByText('Advanced Filters'))
        expect(screen.getByText('Status')).toBeInTheDocument()
        
        fireEvent.click(screen.getByText('Advanced Filters'))
        expect(screen.queryByText('Status')).not.toBeInTheDocument()
    })

    it('updates filters when selections change', () => {
        render(<SocialFilterBar promotions={mockPromotions} events={mockEvents} />)
        fireEvent.click(screen.getByText('Advanced Filters'))

        const startDateInput = screen.getByLabelText(/from date/i)
        fireEvent.change(startDateInput, { target: { value: '2023-10-10' } })
        expect(mockRouterPush).toHaveBeenCalledWith('/social?startDate=2023-10-10')
    })

    it('clears filter when value is empty', () => {
        ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('startDate=2023-10-10'))
        render(<SocialFilterBar promotions={mockPromotions} events={mockEvents} />)
        fireEvent.click(screen.getByText('Advanced Filters'))

        const startDateInput = screen.getByLabelText(/from date/i)
        fireEvent.change(startDateInput, { target: { value: '' } })
        expect(mockRouterPush).toHaveBeenCalledWith('/social?')
    })

    it('shows clear filters button when filters are active and handles clearing', () => {
        ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('status=draft&view=calendar'))
        
        render(<SocialFilterBar promotions={mockPromotions} events={mockEvents} />)
        
        const clearBtn = screen.getByRole('button', { name: /clear all/i })
        expect(clearBtn).toBeInTheDocument()

        fireEvent.click(clearBtn)
        // Should clear everything except view
        expect(mockRouterPush).toHaveBeenCalledWith('/social?view=calendar')
    })
    
    it('handles clear filters when view is missing', () => {
        ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('status=draft'))
        
        render(<SocialFilterBar promotions={mockPromotions} events={mockEvents} />)
        
        const clearBtn = screen.getByRole('button', { name: /clear all/i })
        fireEvent.click(clearBtn)
        // Should default to view=table
        expect(mockRouterPush).toHaveBeenCalledWith('/social?view=table')
    })

    it('updates filters when select options change', async () => {
        render(<SocialFilterBar promotions={mockPromotions} events={mockEvents} />)
        fireEvent.click(screen.getByText('Advanced Filters'))

        const triggers = screen.getAllByRole('combobox')
        // [0] -> Status, [1] -> Promotion, [2] -> Event
        
        // Change Status
        fireEvent.pointerDown(triggers[0], { button: 0, ctrlKey: false, pointerType: 'mouse' })
        const draftOption = await screen.findByText('Draft')
        fireEvent.click(draftOption)
        expect(mockRouterPush).toHaveBeenCalledWith('/social?status=draft')

        // Change Promotion
        fireEvent.pointerDown(triggers[1], { button: 0, ctrlKey: false, pointerType: 'mouse' })
        const promoOption = await screen.findByText('Promo 1')
        fireEvent.click(promoOption)
        expect(mockRouterPush).toHaveBeenCalledWith('/social?promotionPeriodId=p1')

        // Change Event
        fireEvent.pointerDown(triggers[2], { button: 0, ctrlKey: false, pointerType: 'mouse' })
        const eventOption = await screen.findByText('Event 1')
        fireEvent.click(eventOption)
        expect(mockRouterPush).toHaveBeenCalledWith('/social?eventId=e1')
    })
})
