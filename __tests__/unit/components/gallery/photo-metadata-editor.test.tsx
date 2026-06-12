import { render, screen, waitFor } from '@testing-library/react'
import { PhotoMetadataEditor } from '@/components/gallery/photo-metadata-editor'
import userEvent from '@testing-library/user-event'
import { updatePhotoDescription, updatePhotoTags, createPhotoTag } from '@/app/actions/photos'

// Mock dependencies
jest.mock('@/app/actions/photos', () => ({
    updatePhotoDescription: jest.fn(),
    updatePhotoTags: jest.fn(),
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
            expect(updatePhotoTags).toHaveBeenCalledWith('p1', ['t2'], ['t1'])
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
            expect(updatePhotoTags).toHaveBeenCalledWith('p1', ['t3'], [])
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

    it('handles errors when saving changes', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        ;(updatePhotoDescription as jest.Mock).mockRejectedValue(new Error('Save failed'))

        render(
            <PhotoMetadataEditor
                photoId="p1"
                initialTags={mockInitialTags}
                initialDescription="Original desc"
                allTags={mockAllTags}
            />
        )

        await userEvent.click(screen.getByRole('button'))

        const textarea = screen.getByPlaceholderText('Add a description...')
        await userEvent.clear(textarea)
        await userEvent.type(textarea, 'Changed desc')

        const saveButton = screen.getByRole('button', { name: /Save Changes/i })
        await userEvent.click(saveButton)

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to save changes', expect.any(Error))
        })

        consoleSpy.mockRestore()
    })

    it('handles errors when creating a tag', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        ;(createPhotoTag as jest.Mock).mockRejectedValue(new Error('Create tag failed'))

        render(
            <PhotoMetadataEditor
                photoId="p1"
                initialTags={mockInitialTags}
                initialDescription=""
                allTags={mockAllTags}
            />
        )

        await userEvent.click(screen.getByRole('button'))
        await userEvent.click(screen.getByRole('button', { name: /Add Tag/i }))

        const searchInput = screen.getByPlaceholderText('Search tags...')
        await userEvent.type(searchInput, 'Failing Tag')

        const createOption = await screen.findByText('Create "Failing Tag"')
        await userEvent.click(createOption)

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to create tag', expect.any(Error))
        })

        consoleSpy.mockRestore()
    })

    it('resets search query when popover closes', async () => {
        render(
            <PhotoMetadataEditor
                photoId="p1"
                initialTags={mockInitialTags}
                initialDescription=""
                allTags={mockAllTags}
            />
        )

        await userEvent.click(screen.getByRole('button'))
        const addTagBtn = screen.getByRole('button', { name: /Add Tag/i })

        // Open popover
        await userEvent.click(addTagBtn)

        const searchInput = screen.getByPlaceholderText('Search tags...')
        await userEvent.type(searchInput, 'Some query')
        expect(searchInput).toHaveValue('Some query')

        // Close popover by clicking outside or pressing Escape
        await userEvent.keyboard('{Escape}')

        // Open again to check if it was reset
        await userEvent.click(addTagBtn)
        const newSearchInput = screen.getByPlaceholderText('Search tags...')
        expect(newSearchInput).toHaveValue('')
    })
})
