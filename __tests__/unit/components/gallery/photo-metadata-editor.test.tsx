import { render, screen, waitFor } from '@testing-library/react'
import { PhotoMetadataEditor } from '@/components/gallery/photo-metadata-editor'
import userEvent from '@testing-library/user-event'
import { updatePhotoDescription, addPhotoTag, removePhotoTag, createPhotoTag } from '@/app/actions/photos'

// Mock dependencies
jest.mock('@/app/actions/photos', () => ({
    updatePhotoDescription: jest.fn(),
    addPhotoTag: jest.fn(),
    removePhotoTag: jest.fn(),
    createPhotoTag: jest.fn()
}))

describe('PhotoMetadataEditor', () => {
    const mockInitialTags = [
        { id: 't1', name: 'Nature', color: '#00ff00' }
    ]
    const mockAllTags = [
        { id: 't1', name: 'Nature', color: '#00ff00' },
        { id: 't2', name: 'City', color: '#ff0000' }
    ]

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders initial state correctly (read-only mode)', () => {
        render(
            <PhotoMetadataEditor 
                photoId="p1" 
                initialTags={mockInitialTags} 
                initialDescription="A beautiful view" 
                allTags={mockAllTags} 
            />
        )

        expect(screen.getByText('Nature')).toBeInTheDocument()
        expect(screen.getByText('A beautiful view')).toBeInTheDocument()
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('enters edit mode and allows description changes', async () => {
        render(
            <PhotoMetadataEditor 
                photoId="p1" 
                initialTags={mockInitialTags} 
                initialDescription="A beautiful view" 
                allTags={mockAllTags} 
            />
        )

        // Enter edit mode
        const editButton = screen.getByRole('button') // pencil icon
        await userEvent.click(editButton)

        const textarea = screen.getByPlaceholderText('Add a description...')
        expect(textarea).toBeInTheDocument()
        expect(textarea).toHaveValue('A beautiful view')

        await userEvent.clear(textarea)
        await userEvent.type(textarea, 'New description')

        // Save
        const saveButton = screen.getByRole('button', { name: /Save Changes/i })
        await userEvent.click(saveButton)

        await waitFor(() => {
            expect(updatePhotoDescription).toHaveBeenCalledWith('p1', 'New description')
        })
    })

    it('adds an existing tag and removes one', async () => {
        render(
            <PhotoMetadataEditor 
                photoId="p1" 
                initialTags={mockInitialTags} 
                initialDescription="" 
                allTags={mockAllTags} 
            />
        )

        // Enter edit mode
        await userEvent.click(screen.getByRole('button'))

        // Remove the 'Nature' tag
        // Since there is only one "close" button for the single tag...
        // Let's find the remove button by finding the parent badge then its button
        const natureBadge = screen.getByText('Nature').closest('div')
        const removeButton = natureBadge!.querySelector('button')
        await userEvent.click(removeButton!)

        // Add 'City' tag
        await userEvent.click(screen.getByRole('button', { name: /Add Tag/i }))
        await userEvent.click(screen.getByText('City'))

        // Save
        const saveButton = screen.getByRole('button', { name: /Save Changes/i })
        await userEvent.click(saveButton)

        await waitFor(() => {
            expect(removePhotoTag).toHaveBeenCalledWith('p1', 't1')
            expect(addPhotoTag).toHaveBeenCalledWith('p1', 't2')
        })
    })

    it('creates a new tag inline', async () => {
        ;(createPhotoTag as jest.Mock).mockResolvedValue({ id: 't3', name: 'New Tag' })
        
        render(
            <PhotoMetadataEditor 
                photoId="p1" 
                initialTags={mockInitialTags} 
                initialDescription="" 
                allTags={mockAllTags} 
            />
        )

        // Enter edit mode
        await userEvent.click(screen.getByRole('button'))

        // Open popover
        await userEvent.click(screen.getByRole('button', { name: /Add Tag/i }))

        // Type new tag
        const searchInput = screen.getByPlaceholderText('Search tags...')
        await userEvent.type(searchInput, 'New Tag')

        // Click create option
        const createOption = await screen.findByText('Create "New Tag"')
        await userEvent.click(createOption)

        await waitFor(() => {
            expect(createPhotoTag).toHaveBeenCalledWith('New Tag')
            // The tag should be in the list now
            const newTags = screen.getAllByText('New Tag')
            expect(newTags.length).toBeGreaterThan(0)
        })

        // Save
        const saveButton = screen.getByRole('button', { name: /Save Changes/i })
        await userEvent.click(saveButton)

        await waitFor(() => {
            expect(addPhotoTag).toHaveBeenCalledWith('p1', 't3')
        })
    })

    it('cancels edits properly', async () => {
        render(
            <PhotoMetadataEditor 
                photoId="p1" 
                initialTags={mockInitialTags} 
                initialDescription="Original desc" 
                allTags={mockAllTags} 
            />
        )

        // Enter edit mode
        await userEvent.click(screen.getByRole('button'))

        const textarea = screen.getByPlaceholderText('Add a description...')
        await userEvent.clear(textarea)
        await userEvent.type(textarea, 'Changed desc')

        // Cancel
        const cancelButton = screen.getByRole('button', { name: /Cancel/i })
        await userEvent.click(cancelButton)

        // Should return to read-only view with original text
        expect(screen.queryByPlaceholderText('Add a description...')).not.toBeInTheDocument()
        expect(screen.getByText('Original desc')).toBeInTheDocument()
    })
})
