import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { LocationForm } from '@/components/locations/location-form'
import userEvent from '@testing-library/user-event'
import { createLocation, updateLocation } from '@/app/actions/locations'
import { toast } from 'sonner'

// Mock dependencies
jest.mock('@/app/actions/locations', () => ({
    createLocation: jest.fn(),
    updateLocation: jest.fn()
}))

jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn()
    }
}))

// Mock react-dom functions used in SubmitButton
jest.mock('react-dom', () => ({
    ...jest.requireActual('react-dom'),
    useFormStatus: () => ({ pending: false })
}))

describe('LocationForm', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders Add Location button initially', () => {
        render(<LocationForm />)
        expect(screen.getByRole('button', { name: /Add Location/i })).toBeInTheDocument()
    })

    it('renders Edit button when location prop is provided', () => {
        const mockLocation = { id: 'loc1', name: 'Main Hall' }
        render(<LocationForm location={mockLocation} />)
        expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument()
    })

    it('opens add dialog and renders empty form', async () => {
        render(<LocationForm />)
        await userEvent.click(screen.getByRole('button', { name: /Add Location/i }))
        
        expect(screen.getByRole('heading', { name: 'Add Location' })).toBeInTheDocument()
        expect(screen.getByLabelText(/Name/)).toHaveValue('')
        expect(screen.getByRole('button', { name: 'Save Location' })).toBeInTheDocument()
    })

    it('opens edit dialog and populates data', async () => {
        const mockLocation = { id: 'loc1', name: 'Main Hall' }
        render(<LocationForm location={mockLocation} />)
        await userEvent.click(screen.getByRole('button', { name: /Edit/i }))
        
        expect(screen.getByRole('heading', { name: 'Edit Location' })).toBeInTheDocument()
        expect(screen.getByLabelText(/Name/)).toHaveValue('Main Hall')
        expect(screen.getByRole('button', { name: 'Update Location' })).toBeInTheDocument()
    })

    it('submits correctly for creation', async () => {
        (createLocation as jest.Mock).mockResolvedValue({ success: true })
        render(<LocationForm />)
        
        // Open dialog
        await userEvent.click(screen.getByRole('button', { name: /Add Location/i }))
        
        // Fill form
        await userEvent.type(screen.getByLabelText(/Name/), 'New Room')
        
        // Submit form
        const form = screen.getByRole('button', { name: 'Save Location' }).closest('form')
        fireEvent.submit(form!)
        
        await waitFor(() => {
            expect(createLocation).toHaveBeenCalled()
        })
        expect(toast.success).toHaveBeenCalledWith('Location created')
    })

    it('submits correctly for updating', async () => {
        (updateLocation as jest.Mock).mockResolvedValue({ success: true })
        const mockLocation = { id: 'loc1', name: 'Main Hall' }
        render(<LocationForm location={mockLocation} />)
        
        // Open dialog
        await userEvent.click(screen.getByRole('button', { name: /Edit/i }))
        
        // Fill form
        await userEvent.clear(screen.getByLabelText(/Name/))
        await userEvent.type(screen.getByLabelText(/Name/), 'Updated Hall')
        
        // Submit form
        const form = screen.getByRole('button', { name: 'Update Location' }).closest('form')
        fireEvent.submit(form!)
        
        await waitFor(() => {
            expect(updateLocation).toHaveBeenCalledWith('loc1', expect.any(FormData))
        })
        expect(toast.success).toHaveBeenCalledWith('Location updated')
    })

    it('displays error message on failed submission', async () => {
        (createLocation as jest.Mock).mockResolvedValue({ success: false, message: 'Invalid name' })
        render(<LocationForm />)
        
        await userEvent.click(screen.getByRole('button', { name: /Add Location/i }))
        await userEvent.type(screen.getByLabelText(/Name/), 'Room')
        
        const form = screen.getByRole('button', { name: 'Save Location' }).closest('form')
        fireEvent.submit(form!)
        
        await waitFor(() => {
            expect(screen.getByText('Invalid name')).toBeInTheDocument()
        })
    })
})
