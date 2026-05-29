import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { HyperlinkForm } from '@/components/hyperlinks/hyperlink-form'
import userEvent from '@testing-library/user-event'
import { createHyperlink, updateHyperlink } from '@/app/actions/hyperlinks'

// Mock dependencies
jest.mock('@/app/actions/hyperlinks', () => ({
    createHyperlink: jest.fn(),
    updateHyperlink: jest.fn()
}))

// Mock react-dom functions used in SubmitButton
jest.mock('react-dom', () => ({
    ...jest.requireActual('react-dom'),
    useFormStatus: () => ({ pending: false })
}))

describe('HyperlinkForm', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders Add Hyperlink button initially', () => {
        render(<HyperlinkForm />)
        expect(screen.getByRole('button', { name: /Add Hyperlink/i })).toBeInTheDocument()
    })

    it('renders Edit button when hyperlink prop is provided', () => {
        const mockLink = { id: 'link1', title: 'Test Link', url: 'https://test.com', description: '', icon: '' }
        render(<HyperlinkForm hyperlink={mockLink} />)
        expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument()
    })

    it('opens add dialog and renders empty form', async () => {
        render(<HyperlinkForm />)
        await userEvent.click(screen.getByRole('button', { name: /Add Hyperlink/i }))
        
        expect(screen.getByRole('heading', { name: 'Add Hyperlink' })).toBeInTheDocument()
        expect(screen.getByLabelText(/Title/)).toHaveValue('')
        expect(screen.getByLabelText(/URL/)).toHaveValue('')
        expect(screen.getByRole('button', { name: 'Save Hyperlink' })).toBeInTheDocument()
    })

    it('opens edit dialog and populates data', async () => {
        const mockLink = { 
            id: 'link1', 
            title: 'Test Link', 
            url: 'https://test.com', 
            description: 'A test link', 
            icon: 'LinkIcon' 
        }
        render(<HyperlinkForm hyperlink={mockLink} />)
        await userEvent.click(screen.getByRole('button', { name: /Edit/i }))
        
        expect(screen.getByRole('heading', { name: 'Edit Hyperlink' })).toBeInTheDocument()
        expect(screen.getByLabelText(/Title/)).toHaveValue('Test Link')
        expect(screen.getByLabelText(/URL/)).toHaveValue('https://test.com')
        expect(screen.getByLabelText(/Description/)).toHaveValue('A test link')
        expect(screen.getByLabelText(/Icon/)).toHaveValue('LinkIcon')
        expect(screen.getByRole('button', { name: 'Update Hyperlink' })).toBeInTheDocument()
    })

    it('submits correctly for creation', async () => {
        (createHyperlink as jest.Mock).mockResolvedValue(undefined)
        render(<HyperlinkForm />)
        
        // Open dialog
        await userEvent.click(screen.getByRole('button', { name: /Add Hyperlink/i }))
        
        // Fill form
        await userEvent.type(screen.getByLabelText(/Title/), 'New Link')
        await userEvent.type(screen.getByLabelText(/URL/), 'https://new.com')
        
        // Submit form
        const form = screen.getByRole('button', { name: 'Save Hyperlink' }).closest('form')
        fireEvent.submit(form!)
        
        await waitFor(() => {
            expect(createHyperlink).toHaveBeenCalled()
        })
    })

    it('submits correctly for updating', async () => {
        (updateHyperlink as jest.Mock).mockResolvedValue(undefined)
        const mockLink = { id: 'link1', title: 'Old Link', url: 'https://old.com', description: '', icon: '' }
        render(<HyperlinkForm hyperlink={mockLink} />)
        
        // Open dialog
        await userEvent.click(screen.getByRole('button', { name: /Edit/i }))
        
        // Fill form
        await userEvent.clear(screen.getByLabelText(/Title/))
        await userEvent.type(screen.getByLabelText(/Title/), 'Updated Link')
        
        // Submit form
        const form = screen.getByRole('button', { name: 'Update Hyperlink' }).closest('form')
        fireEvent.submit(form!)
        
        await waitFor(() => {
            expect(updateHyperlink).toHaveBeenCalledWith('link1', expect.any(FormData))
        })
    })

    it('displays error message on failed submission', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        ;(createHyperlink as jest.Mock).mockRejectedValue(new Error('Failed'))
        render(<HyperlinkForm />)
        
        await userEvent.click(screen.getByRole('button', { name: /Add Hyperlink/i }))
        await userEvent.type(screen.getByLabelText(/Title/), 'Bad Link')
        
        const form = screen.getByRole('button', { name: 'Save Hyperlink' }).closest('form')
        fireEvent.submit(form!)
        
        await waitFor(() => {
            expect(screen.getByText(/Failed to save hyperlink/)).toBeInTheDocument()
        })
        
        consoleSpy.mockRestore()
    })
})
