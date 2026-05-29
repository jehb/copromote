
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/input'
import userEvent from '@testing-library/user-event'

describe('Input', () => {
    it('renders input', () => {
        render(<Input placeholder="Enter text" />)
        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('handles change events', async () => {
        const handleChange = jest.fn()
        render(<Input onChange={handleChange} />)
        const input = screen.getByRole('textbox')
        await userEvent.type(input, 'hello')
        expect(handleChange).toHaveBeenCalled()
        expect(input).toHaveValue('hello')
    })

    it('renders with type password', () => {
        const { container } = render(<Input type="password" />)
        // role textbox might not apply to password input in some accessibility mappings, check attribute directly
        expect(container.querySelector('input')).toHaveAttribute('type', 'password')
    })

    it('is disabled when disabled prop is true', () => {
        render(<Input disabled />)
        expect(screen.getByRole('textbox')).toBeDisabled()
    })
})
