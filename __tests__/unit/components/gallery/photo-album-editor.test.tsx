import { render, screen, waitFor } from '@testing-library/react'
import { PhotoAlbumEditor } from '@/components/gallery/photo-album-editor'
import userEvent from '@testing-library/user-event'
import { createAlbum, addPhotoToAlbum, removePhotoFromAlbum, deleteAlbum } from '@/app/actions/photos'

// Mock dependencies
jest.mock('@/app/actions/photos', () => ({
    createAlbum: jest.fn(),
    addPhotoToAlbum: jest.fn(),
    removePhotoFromAlbum: jest.fn(),
    deleteAlbum: jest.fn()
}))

describe('PhotoAlbumEditor', () => {
    const mockInitialAlbums = [
        { id: 'a1', name: 'Summer Trip', assetCount: 5 }
    ]
    const mockAllAlbums = [
        { id: 'a1', name: 'Summer Trip', assetCount: 5 },
        { id: 'a2', name: 'Winter Holidays', assetCount: 10 }
    ]

    beforeEach(() => {
        jest.clearAllMocks()
        // Mock window.confirm
        window.confirm = jest.fn()
    })

    it('renders currently assigned albums', () => {
        render(<PhotoAlbumEditor photoId="p1" initialAlbums={mockInitialAlbums} allAlbums={mockAllAlbums} />)
        expect(screen.getByText('Summer Trip')).toBeInTheDocument()
    })

    it('removes a photo from an album', async () => {
        (removePhotoFromAlbum as jest.Mock).mockResolvedValue(undefined)
        render(<PhotoAlbumEditor photoId="p1" initialAlbums={mockInitialAlbums} allAlbums={mockAllAlbums} />)
        
        const removeButton = screen.getByRole('button', { name: /Remove photo from album/i })
        await userEvent.click(removeButton)

        await waitFor(() => {
            expect(removePhotoFromAlbum).toHaveBeenCalledWith('p1', 'a1')
            expect(screen.queryByText('Summer Trip')).not.toBeInTheDocument()
            expect(screen.getByText('Not in any albums.')).toBeInTheDocument()
        })
    })

    it('adds a photo to an existing album via combobox', async () => {
        (addPhotoToAlbum as jest.Mock).mockResolvedValue(undefined)
        render(<PhotoAlbumEditor photoId="p1" initialAlbums={mockInitialAlbums} allAlbums={mockAllAlbums} />)
        
        // Open popover
        await userEvent.click(screen.getByRole('button', { name: /Add to Album/i }))

        // Should see unassigned albums in the list
        await waitFor(() => {
            expect(screen.getByText('Winter Holidays')).toBeInTheDocument()
        })

        // Click the unassigned album
        await userEvent.click(screen.getByText('Winter Holidays'))

        await waitFor(() => {
            expect(addPhotoToAlbum).toHaveBeenCalledWith('p1', 'a2')
            // It should now be in the list of assigned albums
            const badges = screen.getAllByText('Winter Holidays')
            expect(badges.length).toBeGreaterThan(0)
        })
    })

    it('creates a new album and assigns it', async () => {
        ;(createAlbum as jest.Mock).mockResolvedValue({ id: 'a3', name: 'New Album' })
        ;(addPhotoToAlbum as jest.Mock).mockResolvedValue(undefined)
        
        render(<PhotoAlbumEditor photoId="p1" initialAlbums={mockInitialAlbums} allAlbums={mockAllAlbums} />)
        
        // Open popover
        await userEvent.click(screen.getByRole('button', { name: /Add to Album/i }))

        // Type new album name
        const searchInput = screen.getByPlaceholderText('Search albums...')
        await userEvent.type(searchInput, 'New Album')

        // Click create option
        const createOption = await screen.findByText('Create "New Album"')
        await userEvent.click(createOption)

        await waitFor(() => {
            expect(createAlbum).toHaveBeenCalledWith('New Album')
            expect(addPhotoToAlbum).toHaveBeenCalledWith('p1', 'a3')
            // Verify it renders in the assigned list
            expect(screen.getByText('New Album')).toBeInTheDocument()
        })
    })

    it('deletes an album permanently', async () => {
        ;(window.confirm as jest.Mock).mockReturnValue(true)
        ;(deleteAlbum as jest.Mock).mockResolvedValue(undefined)
        
        render(<PhotoAlbumEditor photoId="p1" initialAlbums={mockInitialAlbums} allAlbums={mockAllAlbums} />)
        
        // Open popover
        await userEvent.click(screen.getByRole('button', { name: /Add to Album/i }))

        // Find the trash button next to Winter Holidays
        const deleteButton = screen.getByRole('button', { name: /Delete album permanently/i })
        await userEvent.click(deleteButton)

        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalled()
            expect(deleteAlbum).toHaveBeenCalledWith('a2')
            expect(screen.queryByText('Winter Holidays')).not.toBeInTheDocument()
        })
    })
})
