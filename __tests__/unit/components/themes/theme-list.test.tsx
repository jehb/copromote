import { render, screen, waitFor } from '@testing-library/react'
import { ThemeList } from '@/components/themes/theme-list'
import { deleteTheme } from '@/app/actions/theme'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

jest.mock('@/app/actions/theme', () => ({
    deleteTheme: jest.fn()
}))

jest.mock('@/components/themes/theme-form', () => ({
    ThemeForm: ({ onSuccess }: { onSuccess: () => void }) => (
        <button onClick={onSuccess}>Submit Theme</button>
    )
}))

jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn()
    }
}))

jest.mock('next/navigation', () => ({
    useRouter: jest.fn()
}))

describe('ThemeList', () => {
    const mockRouter = { refresh: jest.fn() }
    const mockThemes = [
        {
            id: '1',
            name: 'Summer Campaign',
            description: 'A test theme for summer',
            startDate: new Date('2026-06-01T12:00:00Z').toISOString(),
            endDate: new Date('2026-08-31T12:00:00Z').toISOString(),
            isRecurring: false
        },
        {
            id: '2',
            name: 'Weekly Promo',
            description: null,
            startDate: new Date('2026-01-01T12:00:00Z').toISOString(),
            endDate: new Date('2026-12-31T12:00:00Z').toISOString(),
            isRecurring: true
        }
    ]

    beforeEach(() => {
        jest.clearAllMocks()
        window.confirm = jest.fn(() => true)
        ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    })

    it('renders empty state when there are no themes', () => {
        render(<ThemeList initialThemes={[]} />)
        expect(screen.getByText('No themes found.')).toBeInTheDocument()
    })

    it('renders the list of themes correctly', () => {
        render(<ThemeList initialThemes={mockThemes} />)
        
        expect(screen.getByText('Summer Campaign')).toBeInTheDocument()
        expect(screen.getByText('A test theme for summer')).toBeInTheDocument()
        expect(screen.getByText('One-time')).toBeInTheDocument()
        
        expect(screen.getByText('Weekly Promo')).toBeInTheDocument()
        expect(screen.getByText('Recurring')).toBeInTheDocument()
    })

    it('opens dialog to create new theme', async () => {
        render(<ThemeList initialThemes={mockThemes} />)
        
        await userEvent.click(screen.getByRole('button', { name: /New Theme/i }))
        
        expect(screen.getByRole('heading', { name: 'New Theme' })).toBeInTheDocument()
        
        // Complete form
        await userEvent.click(screen.getByRole('button', { name: 'Submit Theme' }))
        
        await waitFor(() => {
            expect(mockRouter.refresh).toHaveBeenCalled()
            // Dialog closes implicitly because onSuccess sets isOpen to false
            expect(screen.queryByRole('heading', { name: 'New Theme' })).not.toBeInTheDocument()
        })
    })

    it('opens dialog to edit theme', async () => {
        render(<ThemeList initialThemes={mockThemes} />)
        
        // Find edit buttons (two themes, two edit buttons + 1 new theme button)
        // Edit button has lucide-edit icon, but we can query by clicking the first ghost button
        const buttons = screen.getAllByRole('button')
        // buttons[0] = New Theme
        // buttons[1] = Edit Theme 1
        // buttons[2] = Delete Theme 1
        
        await userEvent.click(buttons[1])
        
        expect(screen.getByRole('heading', { name: 'Edit Theme' })).toBeInTheDocument()
    })

    it('handles successful deletion', async () => {
        ;(deleteTheme as jest.Mock).mockResolvedValue(true)

        render(<ThemeList initialThemes={mockThemes} />)
        
        const buttons = screen.getAllByRole('button')
        // buttons[2] = Delete Theme 1
        await userEvent.click(buttons[2])

        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this theme?')
            expect(deleteTheme).toHaveBeenCalledWith('1')
            expect(toast.success).toHaveBeenCalledWith('Theme deleted')
            expect(mockRouter.refresh).toHaveBeenCalled()
        })
    })

    it('handles failed deletion', async () => {
        ;(deleteTheme as jest.Mock).mockRejectedValue(new Error('API error'))

        render(<ThemeList initialThemes={mockThemes} />)
        
        const buttons = screen.getAllByRole('button')
        await userEvent.click(buttons[2])

        await waitFor(() => {
            expect(deleteTheme).toHaveBeenCalledWith('1')
            expect(toast.error).toHaveBeenCalledWith('Failed to delete theme')
            expect(mockRouter.refresh).not.toHaveBeenCalled()
        })
    })

    it('cancels deletion if confirm is rejected', async () => {
        ;(window.confirm as jest.Mock).mockReturnValue(false)

        render(<ThemeList initialThemes={mockThemes} />)
        
        const buttons = screen.getAllByRole('button')
        await userEvent.click(buttons[2])

        expect(deleteTheme).not.toHaveBeenCalled()
    })
})
