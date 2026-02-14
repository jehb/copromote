
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
    it('renders badge content', () => {
        render(<Badge>Status</Badge>)
        expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('applies variant classes', () => {
        const { container } = render(<Badge variant="destructive">Error</Badge>)
        expect(container.firstChild).toHaveClass('bg-destructive')
    })

    it('applies custom class names', () => {
        const { container } = render(<Badge className="custom">Custom</Badge>)
        expect(container.firstChild).toHaveClass('custom')
    })
})
