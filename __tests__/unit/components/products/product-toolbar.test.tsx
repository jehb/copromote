import { render, screen, waitFor, act } from '@testing-library/react'
import { ProductToolbar } from '@/components/products/product-toolbar'
import { useRouter, useSearchParams } from 'next/navigation'
import userEvent from '@testing-library/user-event'

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn()
}))

describe('ProductToolbar', () => {
    const mockRouter = { push: jest.fn() }
    
    beforeAll(() => {
        jest.useFakeTimers()
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    beforeEach(() => {
        jest.clearAllMocks()
        ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    })

    it('renders with empty initial search', () => {
        ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''))
        render(<ProductToolbar />)
        
        expect(screen.getByPlaceholderText('Search products...')).toHaveValue('')
    })

    it('renders with initial search from URL', () => {
        ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('search=apple'))
        render(<ProductToolbar />)
        
        expect(screen.getByPlaceholderText('Search products...')).toHaveValue('apple')
    })

    it('updates URL on search input with debounce', async () => {
        ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''))
        render(<ProductToolbar />)
        
        const input = screen.getByPlaceholderText('Search products...')
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

        await user.type(input, 'banana')
        
        // Before debounce, router.push should not be called with 'banana'
        expect(mockRouter.push).not.toHaveBeenCalled()
        
        act(() => {
            jest.advanceTimersByTime(500)
        })

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith('?search=banana&page=1')
        })
    })

    it('removes search param when input is cleared', async () => {
        ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('search=orange'))
        render(<ProductToolbar />)
        
        const input = screen.getByPlaceholderText('Search products...')
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

        await user.clear(input)
        
        act(() => {
            jest.advanceTimersByTime(500)
        })

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith('?page=1')
        })
    })
})
