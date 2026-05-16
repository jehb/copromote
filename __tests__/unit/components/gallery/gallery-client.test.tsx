import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { GalleryClient } from '@/components/gallery/gallery-client'
import userEvent from '@testing-library/user-event'
import { deletePhoto } from '@/app/actions/photos'

// Mock dependencies
jest.mock('@/app/actions/photos', () => ({
    deletePhoto: jest.fn()
}))

jest.mock('@/components/gallery/upload-modal', () => ({
    UploadModal: () => <button data-testid="mock-upload-modal">Mock Upload</button>
}))

const mockTags = [
    { id: 'tag1', name: 'Nature', color: '#00ff00' },
    { id: 'tag2', name: 'City', color: '#0000ff' }
]

const mockPhotos = [
    {
        id: 'photo1',
        url: 'http://example.com/photo1.jpg',
        name: 'Forest',
        createdAt: '2023-10-10T10:00:00.000Z',
        updatedAt: '2023-10-10T10:00:00.000Z',
        description: 'A beautiful forest',
        tags: [mockTags[0]]
    },
    {
        id: 'photo2',
        url: 'http://example.com/photo2.jpg',
        name: 'Skyline',
        createdAt: '2023-10-11T10:00:00.000Z',
        updatedAt: '2023-10-11T10:00:00.000Z',
        description: 'City skyline',
        tags: [mockTags[1]]
    }
]

describe('GalleryClient', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Mock confirm dialog
        window.confirm = jest.fn(() => true)
        window.alert = jest.fn()
    })

    it('renders photos in grid view by default', () => {
        render(<GalleryClient initialPhotos={mockPhotos} tags={mockTags} />)
        
        expect(screen.getByText('Forest')).toBeInTheDocument()
        expect(screen.getByText('Skyline')).toBeInTheDocument()
        
        // Grid view specific element, card titles are rendered
        const images = screen.getAllByRole('img')
        expect(images.length).toBe(2)
    })

    it('can toggle to table view', async () => {
        render(<GalleryClient initialPhotos={mockPhotos} tags={mockTags} />)
        
        // Click table view button (it's the second button in the toggle group, so we can find it by its icon)
        // Let's find the button with the List icon
        const tableViewButton = screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-list'))
        if (tableViewButton) {
            await userEvent.click(tableViewButton)
        } else {
            // Fallback for RTL
            const buttons = screen.getAllByRole('button')
            await userEvent.click(buttons[2]) // Assuming 0: Upload, 1: Grid, 2: Table
        }

        expect(screen.getByRole('table')).toBeInTheDocument()
        expect(screen.getByText('A beautiful forest')).toBeInTheDocument()
    })

    it('filters photos by tag', async () => {
        render(<GalleryClient initialPhotos={mockPhotos} tags={mockTags} />)
        
        const tagButton = screen.getAllByText('Nature')[0]
        await userEvent.click(tagButton)
        
        // Should show Nature photo
        expect(screen.getByText('Forest')).toBeInTheDocument()
        // Should hide City photo
        expect(screen.queryByText('Skyline')).not.toBeInTheDocument()
    })

    it('filters photos by search query', async () => {
        render(<GalleryClient initialPhotos={mockPhotos} tags={mockTags} />)
        
        const searchInput = screen.getByPlaceholderText(/find by tag or name/i)
        await userEvent.type(searchInput, 'Sky')
        
        // Should show Skyline photo
        expect(screen.getByText('Skyline')).toBeInTheDocument()
        // Should hide Forest photo
        expect(screen.queryByText('Forest')).not.toBeInTheDocument()
    })

    it('handles photo deletion', async () => {
        render(<GalleryClient initialPhotos={mockPhotos} tags={mockTags} />)
        
        // Delete button is rendered over the image in grid view
        const deleteButtons = screen.getAllByRole('button').filter(b => b.innerHTML.includes('lucide-trash'))
        await userEvent.click(deleteButtons[0])
        
        expect(window.confirm).toHaveBeenCalled()
        expect(deletePhoto).toHaveBeenCalledWith('photo1')
    })

    it('handles delete cancellation', async () => {
        window.confirm = jest.fn(() => false)
        render(<GalleryClient initialPhotos={mockPhotos} tags={mockTags} />)
        
        const deleteButtons = screen.getAllByRole('button').filter(b => b.innerHTML.includes('lucide-trash'))
        await userEvent.click(deleteButtons[0])
        
        expect(window.confirm).toHaveBeenCalled()
        expect(deletePhoto).not.toHaveBeenCalled()
    })

    it('displays empty state when no photos match filter', async () => {
        render(<GalleryClient initialPhotos={mockPhotos} tags={mockTags} />)
        
        const searchInput = screen.getByPlaceholderText(/find by tag or name/i)
        await userEvent.type(searchInput, 'NonExistent')
        
        expect(screen.getByText('No photos found')).toBeInTheDocument()
    })
})
