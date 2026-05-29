import { render, screen } from '@testing-library/react'
import { Switch } from '@/components/ui/switch'
import userEvent from '@testing-library/user-event'

describe('Switch', () => {
    it('renders default size correctly', () => {
        render(<Switch data-testid="test-switch" />)
        const switchElement = screen.getByTestId('test-switch')
        
        expect(switchElement).toBeInTheDocument()
        expect(switchElement).toHaveAttribute('data-size', 'default')
    })

    it('renders small size correctly', () => {
        render(<Switch size="sm" data-testid="test-switch-sm" />)
        const switchElement = screen.getByTestId('test-switch-sm')
        
        expect(switchElement).toBeInTheDocument()
        expect(switchElement).toHaveAttribute('data-size', 'sm')
    })

    it('toggles state when clicked', async () => {
        const user = userEvent.setup()
        render(<Switch data-testid="test-switch" />)
        
        const switchElement = screen.getByTestId('test-switch')
        
        expect(switchElement).toHaveAttribute('data-state', 'unchecked')
        
        await user.click(switchElement)
        
        expect(switchElement).toHaveAttribute('data-state', 'checked')
    })
})
