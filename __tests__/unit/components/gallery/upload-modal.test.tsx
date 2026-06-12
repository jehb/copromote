import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { UploadModal } from '@/components/gallery/upload-modal'
import userEvent from '@testing-library/user-event'
import { uploadPhoto, createPhotoTag } from '@/app/actions/photos'

// Mock dependencies
jest.mock('@/app/actions/photos', () => ({
    uploadPhoto: jest.fn(),
    createPhotoTag: jest.fn()
}))

describe('UploadModal', () => {
    const mockTags = [
        { id: 't1', name: 'Tag 1', color: '#ff0000' },
        { id: 't2', name: 'Tag 2', color: '#00ff00' },
        { id: 't3', name: 'Tag 3' }
    ]

    beforeEach(() => {
        jest.clearAllMocks()
        // Mock global alert
        window.alert = jest.fn()
    })

    it('renders the upload button initially', () => {
        render(<UploadModal tags={mockTags} />)
        expect(screen.getByRole('button', { name: /Upload Photo/i })).toBeInTheDocument()
    })

    it('opens the dialog and shows the form', async () => {
        render(<UploadModal tags={mockTags} />)
        await userEvent.click(screen.getByRole('button', { name: /Upload Photo/i }))
        
        expect(screen.getByRole('heading', { name: 'Upload New Photo' })).toBeInTheDocument()
        expect(screen.getByLabelText(/Select Photo/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Upload Photo' })).toBeInTheDocument()
    })

    it('submits a photo successfully', async () => {
        (uploadPhoto as jest.Mock).mockResolvedValue(undefined)
        render(<UploadModal tags={mockTags} />)
        
        await userEvent.click(screen.getByRole('button', { name: /Upload Photo/i }))
        
        const file = new File(['hello'], 'hello.png', { type: 'image/png' })
        const input = screen.getByLabelText(/Select Photo/i)
        await userEvent.upload(input, file)

        const form = screen.getByRole('button', { name: 'Upload Photo' }).closest('form')
        fireEvent.submit(form!)

        await waitFor(() => {
            expect(uploadPhoto).toHaveBeenCalled()
        })
    })

    it('handles photo upload failure', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        ;(uploadPhoto as jest.Mock).mockRejectedValue(new Error('Upload failed'))
        render(<UploadModal tags={mockTags} />)
        
        await userEvent.click(screen.getByRole('button', { name: /Upload Photo/i }))
        
        const file = new File(['hello'], 'hello.png', { type: 'image/png' })
        const input = screen.getByLabelText(/Select Photo/i)
        await userEvent.upload(input, file)

        const form = screen.getByRole('button', { name: 'Upload Photo' }).closest('form')
        fireEvent.submit(form!)

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Upload failed')
        })
        
        consoleSpy.mockRestore()
    })

    it('handles photo upload failure with fallback message', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        // Reject with an error that doesn't have a specific message, or a non-Error object
        ;(uploadPhoto as jest.Mock).mockRejectedValue({})
        render(<UploadModal tags={mockTags} />)

        await userEvent.click(screen.getByRole('button', { name: /Upload Photo/i }))

        const file = new File(['hello'], 'hello.png', { type: 'image/png' })
        const input = screen.getByLabelText(/Select Photo/i)
        await userEvent.upload(input, file)

        const form = screen.getByRole('button', { name: 'Upload Photo' }).closest('form')
        fireEvent.submit(form!)

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Failed to upload photo')
        })

        consoleSpy.mockRestore()
    })

    it('toggles new tag input and creates a tag', async () => {
        (createPhotoTag as jest.Mock).mockResolvedValue(undefined)
        render(<UploadModal tags={mockTags} />)
        
        await userEvent.click(screen.getByRole('button', { name: /Upload Photo/i }))
        
        // Click New Tag
        await userEvent.click(screen.getByRole('button', { name: 'New Tag' }))
        
        // Input should appear
        const tagInput = screen.getByPlaceholderText('Enter tag name')
        expect(tagInput).toBeInTheDocument()
        
        await userEvent.type(tagInput, 'New Tag Name')
        await userEvent.click(screen.getByRole('button', { name: 'Add' }))

        await waitFor(() => {
            expect(createPhotoTag).toHaveBeenCalledWith('New Tag Name')
        })
        
        // Input should disappear after creation
        expect(screen.queryByPlaceholderText('Enter tag name')).not.toBeInTheDocument()
    })

    it('does not create an empty tag', async () => {
        render(<UploadModal tags={mockTags} />)

        await userEvent.click(screen.getByRole('button', { name: /Upload Photo/i }))
        await userEvent.click(screen.getByRole('button', { name: 'New Tag' }))

        const tagInput = screen.getByPlaceholderText('Enter tag name')
        await userEvent.type(tagInput, '   ')
        await userEvent.click(screen.getByRole('button', { name: 'Add' }))

        expect(createPhotoTag).not.toHaveBeenCalled()
    })

    it('handles tag creation failure', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        ;(createPhotoTag as jest.Mock).mockRejectedValue(new Error('Tag failed'))
        render(<UploadModal tags={mockTags} />)
        
        await userEvent.click(screen.getByRole('button', { name: /Upload Photo/i }))
        
        await userEvent.click(screen.getByRole('button', { name: 'New Tag' }))
        await userEvent.type(screen.getByPlaceholderText('Enter tag name'), 'Bad Tag')
        await userEvent.click(screen.getByRole('button', { name: 'Add' }))

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Failed to create tag')
        })
        
        consoleSpy.mockRestore()
    })
})
