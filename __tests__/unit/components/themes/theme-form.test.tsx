import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ThemeForm } from '@/components/themes/theme-form'
import userEvent from '@testing-library/user-event'
import { createTheme, updateTheme } from '@/app/actions/theme'
import { toast } from 'sonner'

// Mock dependencies
jest.mock('@/app/actions/theme', () => ({
    createTheme: jest.fn(),
    updateTheme: jest.fn()
}))

jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn()
    }
}))

// Mock DatePicker to simplify interaction
jest.mock('@/components/ui/date-picker', () => ({
    DatePicker: ({ date, setDate }: any) => (
        <input
            type="date"
            data-testid="mock-date-picker"
            value={date ? date.toISOString().split('T')[0] : ''}
            onChange={(e) => setDate(new Date(e.target.value))}
        />
    )
}))

describe('ThemeForm', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders empty form for creation', () => {
        const onSuccess = jest.fn()
        render(<ThemeForm onSuccess={onSuccess} />)

        expect(screen.getByLabelText(/Name/)).toHaveValue('')
        expect(screen.getByLabelText(/Description/)).toHaveValue('')
        expect(screen.getByLabelText(/Recurring yearly/)).toBeChecked()
        expect(screen.getByRole('button', { name: /Save Theme/i })).toBeInTheDocument()
    })

    it('renders populated form for editing', () => {
        const onSuccess = jest.fn()
        const mockTheme = {
            id: 't1',
            name: 'Holiday',
            description: 'Holiday theme',
            startDate: '2023-12-01T00:00:00.000Z',
            endDate: '2023-12-31T00:00:00.000Z',
            isRecurring: false
        }
        render(<ThemeForm theme={mockTheme} onSuccess={onSuccess} />)

        expect(screen.getByLabelText(/Name/)).toHaveValue('Holiday')
        expect(screen.getByLabelText(/Description/)).toHaveValue('Holiday theme')
        expect(screen.getByLabelText(/Recurring yearly/)).not.toBeChecked()
        
        const datePickers = screen.getAllByTestId('mock-date-picker')
        expect(datePickers[0]).toHaveValue('2023-12-01')
        expect(datePickers[1]).toHaveValue('2023-12-31')
    })

    it('validates required fields before submitting', async () => {
        const onSuccess = jest.fn()
        render(<ThemeForm onSuccess={onSuccess} />)

        const form = screen.getByRole('button', { name: /Save Theme/i }).closest('form')
        fireEvent.submit(form!)

        expect(toast.error).toHaveBeenCalledWith('Please fill in all required fields')
        expect(createTheme).not.toHaveBeenCalled()
        expect(onSuccess).not.toHaveBeenCalled()
    })

    it('submits correctly for creation', async () => {
        const onSuccess = jest.fn()
        render(<ThemeForm onSuccess={onSuccess} />)

        await userEvent.type(screen.getByLabelText(/Name/), 'New Theme')
        
        const datePickers = screen.getAllByTestId('mock-date-picker')
        fireEvent.change(datePickers[0], { target: { value: '2023-01-01' } })
        fireEvent.change(datePickers[1], { target: { value: '2023-01-31' } })

        await userEvent.click(screen.getByRole('button', { name: /Save Theme/i }))

        await waitFor(() => {
            expect(createTheme).toHaveBeenCalledWith(expect.objectContaining({
                name: 'New Theme',
                isRecurring: true
            }))
        })
        expect(toast.success).toHaveBeenCalledWith('Theme created')
        expect(onSuccess).toHaveBeenCalled()
    })

    it('submits correctly for updating', async () => {
        const onSuccess = jest.fn()
        const mockTheme = {
            id: 't1',
            name: 'Old Theme',
            description: '',
            startDate: '2023-01-01T00:00:00.000Z',
            endDate: '2023-01-31T00:00:00.000Z',
            isRecurring: true
        }
        render(<ThemeForm theme={mockTheme} onSuccess={onSuccess} />)

        await userEvent.clear(screen.getByLabelText(/Name/))
        await userEvent.type(screen.getByLabelText(/Name/), 'Updated Theme')

        await userEvent.click(screen.getByRole('button', { name: /Save Theme/i }))

        await waitFor(() => {
            expect(updateTheme).toHaveBeenCalledWith('t1', expect.objectContaining({
                name: 'Updated Theme'
            }))
        })
        expect(toast.success).toHaveBeenCalledWith('Theme updated')
        expect(onSuccess).toHaveBeenCalled()
    })
})
