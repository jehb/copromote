import { render } from '@testing-library/react'
import { Toaster } from '@/components/ui/sonner'
import { useTheme } from 'next-themes'

jest.mock('next-themes', () => ({
    useTheme: jest.fn()
}))

// Mock sonner since it requires DOM environments we might not fully emulate
jest.mock('sonner', () => ({
    Toaster: ({ theme, className }: any) => <div data-testid="sonner-toaster" data-theme={theme} className={className} />
}))

describe('Toaster (Sonner)', () => {
    it('renders with system theme by default', () => {
        ;(useTheme as jest.Mock).mockReturnValue({})
        
        const { getByTestId } = render(<Toaster />)
        const toaster = getByTestId('sonner-toaster')
        
        expect(toaster).toBeInTheDocument()
        expect(toaster).toHaveAttribute('data-theme', 'system')
    })

    it('renders with provided theme from useTheme', () => {
        ;(useTheme as jest.Mock).mockReturnValue({ theme: 'dark' })
        
        const { getByTestId } = render(<Toaster />)
        const toaster = getByTestId('sonner-toaster')
        
        expect(toaster).toHaveAttribute('data-theme', 'dark')
    })
})
