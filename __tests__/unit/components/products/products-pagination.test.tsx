import { render, screen } from '@testing-library/react'
import { ProductsPagination } from '@/components/products/products-pagination'
import { useRouter, useSearchParams } from 'next/navigation'
import userEvent from '@testing-library/user-event'

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn()
}))

describe('ProductsPagination', () => {
    const mockRouter = { push: jest.fn() }

    beforeEach(() => {
        jest.clearAllMocks()
        ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
        ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''))
    })

    it('returns null if totalPages <= 1', () => {
        const { container } = render(
            <ProductsPagination currentPage={1} totalPages={1} totalCount={10} pageSize={10} />
        )
        expect(container).toBeEmptyDOMElement()
    })

    it('renders pagination details correctly', () => {
        render(
            <ProductsPagination currentPage={2} totalPages={5} totalCount={45} pageSize={10} />
        )
        
        expect(screen.getByText('Showing 11 to 20 of 45 products')).toBeInTheDocument()
        expect(screen.getByText('Page 2 of 5')).toBeInTheDocument()
    })

    it('disables Previous button on first page', () => {
        render(
            <ProductsPagination currentPage={1} totalPages={5} totalCount={45} pageSize={10} />
        )
        
        const prevBtn = screen.getByRole('button', { name: /Previous/i })
        expect(prevBtn).toBeDisabled()
    })

    it('disables Next button on last page', () => {
        render(
            <ProductsPagination currentPage={5} totalPages={5} totalCount={45} pageSize={10} />
        )
        
        const nextBtn = screen.getByRole('button', { name: /Next/i })
        expect(nextBtn).toBeDisabled()
    })

    it('navigates to next page', async () => {
        ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('search=test'))
        render(
            <ProductsPagination currentPage={2} totalPages={5} totalCount={45} pageSize={10} />
        )
        
        const nextBtn = screen.getByRole('button', { name: /Next/i })
        await userEvent.click(nextBtn)
        
        expect(mockRouter.push).toHaveBeenCalledWith('?search=test&page=3')
    })

    it('navigates to previous page', async () => {
        ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('pageSize=20'))
        render(
            <ProductsPagination currentPage={2} totalPages={5} totalCount={45} pageSize={10} />
        )
        
        const prevBtn = screen.getByRole('button', { name: /Previous/i })
        await userEvent.click(prevBtn)
        
        expect(mockRouter.push).toHaveBeenCalledWith('?pageSize=20&page=1')
    })
})
