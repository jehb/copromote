import { render, screen } from '@testing-library/react'
import { PageSizeSelector } from '@/components/products/page-size-selector'
import { useRouter, useSearchParams } from 'next/navigation'
import userEvent from '@testing-library/user-event'

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn()
}))

// Mock pointer events since shadcn Select uses Radix which depends on Pointer events that jsdom lacks
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

describe('PageSizeSelector', () => {
    const mockRouter = { push: jest.fn() }

    beforeEach(() => {
        jest.clearAllMocks()
        ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
        ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''))
    })

    it('renders with default value', () => {
        render(<PageSizeSelector />)
        expect(screen.getByText('Rows per page')).toBeInTheDocument()
        // Select element text should show '10' initially (from placeholder or value text inside trigger)
        // shadcn/Radix select trigger renders the text inside it
        const trigger = screen.getByRole('combobox')
        expect(trigger).toHaveTextContent('10')
    })

    it('renders with value from URL', () => {
        ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('pageSize=50'))
        render(<PageSizeSelector />)
        
        const trigger = screen.getByRole('combobox')
        expect(trigger).toHaveTextContent('50')
    })

    it('updates URL when value is changed', async () => {
        ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('search=query&page=3'))
        render(<PageSizeSelector />)
        
        // Open select
        const trigger = screen.getByRole('combobox')
        await userEvent.click(trigger)
        
        // Find options
        const option25 = screen.getByRole('option', { name: '25' })
        await userEvent.click(option25)
        
        // Should update pageSize and reset page to 1
        expect(mockRouter.push).toHaveBeenCalledWith('?search=query&page=1&pageSize=25')
    })
})
