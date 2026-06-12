import { render, screen, waitFor } from '@testing-library/react'
import { PhotoSelectionModal } from '@/components/gallery/photo-selection-modal'
import userEvent from '@testing-library/user-event'
import { getPhotos, getPhotoTags } from '@/app/actions/photos'

// Mock dependencies
jest.mock('@/app/actions/photos', () => ({
    getPhotos: jest.fn(),
    getPhotoTags: jest.fn()
}))

describe('PhotoSelectionModal', () => {
    const mockPhotos = [
        { id: 'p1', name: 'Photo One', url: 'https://test.com/1.jpg', tags: [{ id: 't1', name: 'Nature' }] },
        { id: 'p2', name: 'Photo Two', url: 'https://test.com/2.jpg', tags: [{ id: 't2', name: 'City' }] },
        { id: 'p3', name: 'Another Pic', url: 'https://test.com/3.jpg', tags: [{ id: 't1', name: 'Nature' }, { id: 't3', name: 'People' }] },
        { id: 'p4', name: '', url: 'https://test.com/4.jpg', tags: [{ id: 't4', name: 'Colorless' }] }
    ]

    const mockTags = [
        { id: 't1', name: 'Nature', color: '#00ff00' },
        { id: 't2', name: 'City', color: '#ff0000' },
        { id: 't3', name: 'People', color: '#0000ff' },
        { id: 't4', name: 'Colorless', color: '' }
    ]

    const mockOnSelect = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        ;(getPhotos as jest.Mock).mockResolvedValue(mockPhotos)
        ;(getPhotoTags as jest.Mock).mockResolvedValue(mockTags)
    })

    it('renders the trigger button initially', () => {
        render(<PhotoSelectionModal selectedPhotoIds={[]} onSelect={mockOnSelect} />)
        expect(screen.getByRole('button', { name: /Add from Gallery/i })).toBeInTheDocument()
    })

    it('loads and displays photos and tags when opened', async () => {
        render(<PhotoSelectionModal selectedPhotoIds={[]} onSelect={mockOnSelect} />)
        
        await userEvent.click(screen.getByRole('button', { name: /Add from Gallery/i }))
        
        await waitFor(() => {
            expect(getPhotos).toHaveBeenCalled()
            expect(getPhotoTags).toHaveBeenCalled()
        })

        // Check tags rendered
        expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Nature' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'City' })).toBeInTheDocument()

        // Check photos rendered
        expect(screen.getByText('Photo One')).toBeInTheDocument()
        expect(screen.getByText('Photo Two')).toBeInTheDocument()
        expect(screen.getByText('Another Pic')).toBeInTheDocument()
    })

    it('filters photos by tag selection', async () => {
        render(<PhotoSelectionModal selectedPhotoIds={[]} onSelect={mockOnSelect} />)
        await userEvent.click(screen.getByRole('button', { name: /Add from Gallery/i }))
        await waitFor(() => {
            expect(screen.getByText('Photo One')).toBeInTheDocument()
        })

        // Click "City" tag
        await userEvent.click(screen.getByRole('button', { name: 'City' }))

        expect(screen.queryByText('Photo One')).not.toBeInTheDocument()
        expect(screen.getByText('Photo Two')).toBeInTheDocument()
        expect(screen.queryByText('Another Pic')).not.toBeInTheDocument()
    })

    it('filters photos by text search', async () => {
        render(<PhotoSelectionModal selectedPhotoIds={[]} onSelect={mockOnSelect} />)
        await userEvent.click(screen.getByRole('button', { name: /Add from Gallery/i }))
        await waitFor(() => {
            expect(screen.getByText('Photo One')).toBeInTheDocument()
        })

        const searchInput = screen.getByPlaceholderText('Tag or name...')
        await userEvent.type(searchInput, 'another')

        expect(screen.queryByText('Photo One')).not.toBeInTheDocument()
        expect(screen.queryByText('Photo Two')).not.toBeInTheDocument()
        expect(screen.getByText('Another Pic')).toBeInTheDocument()
    })

    it('shows no results found when filter matches nothing', async () => {
        render(<PhotoSelectionModal selectedPhotoIds={[]} onSelect={mockOnSelect} />)
        await userEvent.click(screen.getByRole('button', { name: /Add from Gallery/i }))
        await waitFor(() => {
            expect(screen.getByText('Photo One')).toBeInTheDocument()
        })

        const searchInput = screen.getByPlaceholderText('Tag or name...')
        await userEvent.type(searchInput, 'xyz123')

        expect(screen.getByText('No results found')).toBeInTheDocument()
    })

    it('toggles selection and saves', async () => {
        render(<PhotoSelectionModal selectedPhotoIds={['p1']} onSelect={mockOnSelect} />)
        await userEvent.click(screen.getByRole('button', { name: /Add from Gallery/i }))
        await waitFor(() => {
            expect(screen.getByText('Photo One')).toBeInTheDocument()
        })

        expect(screen.getByText('1 photo selected')).toBeInTheDocument()

        // Select second photo
        // Find the card containing "Photo Two"
        const photoTwoCard = screen.getByText('Photo Two').closest('div.border-2')
        await userEvent.click(photoTwoCard!)

        expect(screen.getByText('2 photos selected')).toBeInTheDocument()

        // Deselect first photo
        const photoOneCard = screen.getByText('Photo One').closest('div.border-2')
        await userEvent.click(photoOneCard!)

        expect(screen.getByText('1 photo selected')).toBeInTheDocument()

        // Save
        await userEvent.click(screen.getByRole('button', { name: 'Confirm Selection' }))

        expect(mockOnSelect).toHaveBeenCalledWith(['p2'])
    })



    it('filters photos by tag search', async () => {
        render(<PhotoSelectionModal selectedPhotoIds={[]} onSelect={mockOnSelect} />)
        await userEvent.click(screen.getByRole('button', { name: /Add from Gallery/i }))
        await waitFor(() => {
            expect(screen.getByText('Photo One')).toBeInTheDocument()
        })

        const searchInput = screen.getByPlaceholderText('Tag or name...')
        await userEvent.type(searchInput, 'City')

        expect(screen.queryByText('Photo One')).not.toBeInTheDocument()
        expect(screen.getByText('Photo Two')).toBeInTheDocument()
        expect(screen.queryByText('Another Pic')).not.toBeInTheDocument()
    })

    it('cancels selection and closes modal', async () => {
        render(<PhotoSelectionModal selectedPhotoIds={['p1']} onSelect={mockOnSelect} />)
        await userEvent.click(screen.getByRole('button', { name: /Add from Gallery/i }))
        await waitFor(() => {
            expect(screen.getByText('Photo One')).toBeInTheDocument()
        })

        const photoTwoCard = screen.getByText('Photo Two').closest('div.border-2')
        await userEvent.click(photoTwoCard!)
        expect(screen.getByText('2 photos selected')).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
        expect(mockOnSelect).not.toHaveBeenCalled()

        await userEvent.click(screen.getByRole('button', { name: /Add from Gallery/i }))
        await waitFor(() => {
            expect(screen.getByText('1 photo selected')).toBeInTheDocument()
        })
    })

    it('handles photos without a name and tags without a color', async () => {
        render(<PhotoSelectionModal selectedPhotoIds={[]} onSelect={mockOnSelect} />)
        await userEvent.click(screen.getByRole('button', { name: /Add from Gallery/i }))
        await waitFor(() => {
            expect(screen.getByText('Untitled')).toBeInTheDocument()
            expect(screen.getByAltText('Photo')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Colorless' })).toBeInTheDocument()
        })
    })

    it('handles api failure gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        ;(getPhotos as jest.Mock).mockRejectedValue(new Error('API Error'))
        
        render(<PhotoSelectionModal selectedPhotoIds={[]} onSelect={mockOnSelect} />)
        await userEvent.click(screen.getByRole('button', { name: /Add from Gallery/i }))
        
        await waitFor(() => {
            // It just sets empty array and finishes loading
            expect(screen.getByText('No results found')).toBeInTheDocument()
        })
        
        consoleSpy.mockRestore()
    })
})
