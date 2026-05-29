
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
    it('renders button with text', () => {
        render(<Button>Click me</Button>)
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('handles click events', () => {
        const handleClick = jest.fn()
        render(<Button onClick={handleClick}>Click me</Button>)
        fireEvent.click(screen.getByRole('button', { name: /click me/i }))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('applies variant classes', () => {
        const { container } = render(<Button variant="destructive">Delete</Button>)
        expect(container.firstChild).toHaveClass('bg-destructive')
    })

    it('applies size classes', () => {
        const { container } = render(<Button size="sm">Small</Button>)
        expect(container.firstChild).toHaveClass('h-8')
    })

    it('renders as child with Slot', () => {
        render(
            <Button asChild>
                <a href="/link">Link Button</a>
            </Button>
        )
        const link = screen.getByRole('link', { name: /link button/i })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '/link')
    })

    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>)
        expect(screen.getByRole('button')).toBeDisabled()
    })
})
