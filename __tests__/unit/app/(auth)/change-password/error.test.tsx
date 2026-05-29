import { render, screen } from '@testing-library/react'
import ErrorComponent from '@/app/(auth)/change-password/error'
import userEvent from '@testing-library/user-event'

describe('ChangePassword Error Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('renders the error message', () => {
        const mockError = new Error('Test error message')
        const mockReset = jest.fn()

        render(<ErrorComponent error={mockError} reset={mockReset} />)

        expect(screen.getByText('Something went wrong!')).toBeInTheDocument()
        expect(screen.getByText('Test error message')).toBeInTheDocument()
        expect(console.error).toHaveBeenCalledWith('Change Password Page Error:', mockError)
    })

    it('renders fallback error message if no message provided', () => {
        const mockError = new Error()
        mockError.message = ''
        const mockReset = jest.fn()

        render(<ErrorComponent error={mockError} reset={mockReset} />)

        expect(screen.getByText('Unknown error occcured')).toBeInTheDocument()
    })

    it('calls reset when Try again button is clicked', async () => {
        const mockError = new Error('Test error message')
        const mockReset = jest.fn()
        const user = userEvent.setup()

        render(<ErrorComponent error={mockError} reset={mockReset} />)

        const btn = screen.getByRole('button', { name: /Try again/i })
        await user.click(btn)

        expect(mockReset).toHaveBeenCalled()
    })
})
