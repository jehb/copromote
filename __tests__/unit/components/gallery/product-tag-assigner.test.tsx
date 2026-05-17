import { render, screen, waitFor } from '@testing-library/react'
import { ProductTagAssigner } from '@/components/gallery/product-tag-assigner'
import { assignProductTagToPhoto } from '@/app/actions/photos'
import { toast } from 'sonner'
import userEvent from '@testing-library/user-event'

jest.mock('@/components/email-planner/product-selector', () => ({
    ProductSelector: ({ onSelect, disabled }: { onSelect: (upc: string) => void, disabled: boolean }) => (
        <button
            data-testid="mock-product-selector"
            disabled={disabled}
            onClick={() => onSelect('1234567890')}
        >
            Select Product
        </button>
    )
}))

jest.mock('@/app/actions/photos', () => ({
    assignProductTagToPhoto: jest.fn()
}))

jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn()
    }
}))

describe('ProductTagAssigner', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders correctly without existing upcs', () => {
        render(<ProductTagAssigner photoId="photo-1" existingUpcs={[]} />)
        
        expect(screen.getByText('Link a Product')).toBeInTheDocument()
        expect(screen.getByTestId('mock-product-selector')).toBeInTheDocument()
        expect(screen.queryByText(/Already linked:/)).not.toBeInTheDocument()
    })

    it('renders correctly with existing upcs', () => {
        render(<ProductTagAssigner photoId="photo-1" existingUpcs={['0987654321', '111222333']} />)
        
        expect(screen.getByText('Already linked: 0987654321, 111222333')).toBeInTheDocument()
    })

    it('handles successful assignment', async () => {
        ;(assignProductTagToPhoto as jest.Mock).mockResolvedValue({})
        
        render(<ProductTagAssigner photoId="photo-1" existingUpcs={[]} />)
        
        const selector = screen.getByTestId('mock-product-selector')
        await userEvent.click(selector)
        
        // Assert action is called with correct arguments
        expect(assignProductTagToPhoto).toHaveBeenCalledWith('photo-1', '1234567890')
        
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Successfully linked product UPC 1234567890 to this photo.')
        })
    })

    it('handles assignment error', async () => {
        ;(assignProductTagToPhoto as jest.Mock).mockRejectedValue(new Error('Tag assignment failed'))
        
        render(<ProductTagAssigner photoId="photo-1" existingUpcs={[]} />)
        
        const selector = screen.getByTestId('mock-product-selector')
        await userEvent.click(selector)
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Tag assignment failed')
        })
    })

    it('shows loading state while assigning', async () => {
        // Delay resolution to check loading state
        let resolvePromise: (value: any) => void
        ;(assignProductTagToPhoto as jest.Mock).mockImplementation(() => {
            return new Promise(resolve => {
                resolvePromise = resolve
            })
        })
        
        render(<ProductTagAssigner photoId="photo-1" existingUpcs={[]} />)
        
        const selector = screen.getByTestId('mock-product-selector')
        expect(selector).not.toBeDisabled()
        
        // Trigger assignment
        await userEvent.click(selector)
        
        // Selector should be disabled while assigning
        expect(selector).toBeDisabled()
        // Loader should be present (we can't easily query the Lucide icon but we could add a testid, 
        // however we know it is disabled so state is updated)
        
        // Resolve promise
        resolvePromise!({})
        
        await waitFor(() => {
            expect(selector).not.toBeDisabled()
        })
    })
})
