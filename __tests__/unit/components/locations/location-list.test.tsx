import { render, screen, waitFor } from '@testing-library/react'
import { LocationList } from '@/components/locations/location-list'
import { deleteLocation } from '@/app/actions/locations'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'

jest.mock('@/app/actions/locations', () => ({
    deleteLocation: jest.fn()
}))

jest.mock('@/components/locations/location-form', () => ({
    LocationForm: () => <button>Edit Location</button>
}))

jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn()
    }
}))

describe('LocationList', () => {
    const mockLocations = [
        {
            id: '1',
            name: 'Central Park',
            _count: { events: 5 }
        },
        {
            id: '2',
            name: 'Madison Square',
            _count: { events: 0 }
        }
    ]

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders empty state when there are no locations', () => {
        render(<LocationList locations={[]} />)
        expect(screen.getByText('No locations found. Create one to get started.')).toBeInTheDocument()
    })

    it('renders the list of locations correctly', () => {
        render(<LocationList locations={mockLocations} />)
        
        expect(screen.getByText('Central Park')).toBeInTheDocument()
        expect(screen.getByText('5')).toBeInTheDocument()
        
        expect(screen.getByText('Madison Square')).toBeInTheDocument()
        expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('renders the edit form and delete button for each location', () => {
        render(<LocationList locations={mockLocations} />)
        
        const editButtons = screen.getAllByRole('button', { name: 'Edit Location' })
        expect(editButtons).toHaveLength(2)

        const deleteButtons = screen.getAllByRole('button', { name: 'Delete Location' })
        expect(deleteButtons).toHaveLength(2)
    })

    it('handles successful deletion', async () => {
        ;(deleteLocation as jest.Mock).mockResolvedValue({ success: true })

        render(<LocationList locations={mockLocations} />)
        
        const deleteButtons = screen.getAllByRole('button', { name: 'Delete Location' })
        await userEvent.click(deleteButtons[0])

        await waitFor(() => {
            expect(deleteLocation).toHaveBeenCalledWith('1')
            expect(toast.success).toHaveBeenCalledWith('Location deleted')
        })
    })

    it('handles failed deletion', async () => {
        ;(deleteLocation as jest.Mock).mockResolvedValue({ success: false, message: 'In use' })

        render(<LocationList locations={mockLocations} />)
        
        const deleteButtons = screen.getAllByRole('button', { name: 'Delete Location' })
        await userEvent.click(deleteButtons[0])

        await waitFor(() => {
            expect(deleteLocation).toHaveBeenCalledWith('1')
            expect(toast.error).toHaveBeenCalledWith('In use')
        })
    })

    it('handles failed deletion without message', async () => {
        ;(deleteLocation as jest.Mock).mockResolvedValue({ success: false })

        render(<LocationList locations={mockLocations} />)
        
        const deleteButtons = screen.getAllByRole('button', { name: 'Delete Location' })
        await userEvent.click(deleteButtons[0])

        await waitFor(() => {
            expect(deleteLocation).toHaveBeenCalledWith('1')
            expect(toast.error).toHaveBeenCalledWith('Failed to delete location')
        })
    })

    it('displays unexpected error message on thrown exception', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        ;(deleteLocation as jest.Mock).mockRejectedValue(new Error('Unexpected network error'))

        render(<LocationList locations={mockLocations} />)

        const deleteButtons = screen.getAllByRole('button', { name: 'Delete Location' })
        await userEvent.click(deleteButtons[0])

        await waitFor(() => {
            expect(deleteLocation).toHaveBeenCalledWith('1')
            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))
            expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred.')
        })

        consoleSpy.mockRestore()
    })
})
