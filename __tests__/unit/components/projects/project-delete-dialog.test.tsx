import { render, screen, act, waitFor } from '@testing-library/react'
import { ProjectDeleteDialog } from '@/components/projects/project-delete-dialog'
import userEvent from '@testing-library/user-event'
import { deleteProject } from '@/app/actions/projects'
import { useRouter } from 'next/navigation'

jest.mock('@/app/actions/projects', () => ({
    deleteProject: jest.fn()
}))

jest.mock('next/navigation', () => ({
    useRouter: jest.fn()
}))

describe('ProjectDeleteDialog', () => {
    const mockRouter = { push: jest.fn() }

    beforeEach(() => {
        jest.clearAllMocks()
        ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
        
        // Mock pointer event for Radix UI dialog
        if (typeof window !== 'undefined') {
            window.PointerEvent = class PointerEvent extends Event {
                button: number;
                ctrlKey: boolean;
                pointerType: string;
                constructor(type: string, props: PointerEventInit = {}) {
                    super(type, props);
                    this.button = props.button ?? 0;
                    this.ctrlKey = props.ctrlKey ?? false;
                    this.pointerType = props.pointerType ?? 'mouse';
                }
            } as any;
        }
    })

    it('renders icon variant by default', () => {
        render(<ProjectDeleteDialog projectId="p-1" projectName="Test Project" />)
        // Since variant="icon" is default, the button has ghost variant. The SVG child is present.
        const button = screen.getByRole('button')
        expect(button).toHaveClass('h-8', 'w-8') // typical icon size classes in variant
    })

    it('renders default variant when specified', () => {
        render(<ProjectDeleteDialog projectId="p-1" projectName="Test Project" variant="default" />)
        expect(screen.getByRole('button', { name: /delete project/i })).toBeInTheDocument()
    })

    it('opens dialog on trigger click', async () => {
        const user = userEvent.setup()
        render(<ProjectDeleteDialog projectId="p-1" projectName="Test Project" />)
        
        await user.click(screen.getByRole('button'))
        
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
        expect(screen.getByText(/Are you absolutely sure/i)).toBeInTheDocument()
        expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    it('calls deleteProject and router.push on confirmation', async () => {
        const user = userEvent.setup()
        ;(deleteProject as jest.Mock).mockResolvedValue(undefined)
        
        render(<ProjectDeleteDialog projectId="p-1" projectName="Test Project" />)
        await user.click(screen.getByRole('button'))
        
        const confirmBtn = screen.getByRole('button', { name: /delete project/i })
        
        await user.click(confirmBtn)
        
        await waitFor(() => {
            expect(deleteProject).toHaveBeenCalledWith('p-1')
            expect(mockRouter.push).toHaveBeenCalledWith('/projects')
        })
    })

    it('handles delete failure with alert', async () => {
        const user = userEvent.setup()
        ;(deleteProject as jest.Mock).mockRejectedValue(new Error('Delete failed'))
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        
        render(<ProjectDeleteDialog projectId="p-1" projectName="Test Project" />)
        await user.click(screen.getByRole('button'))
        
        const confirmBtn = screen.getByRole('button', { name: /delete project/i })
        
        await user.click(confirmBtn)
        
        await waitFor(() => {
            expect(deleteProject).toHaveBeenCalledWith('p-1')
            expect(mockRouter.push).not.toHaveBeenCalled()
            expect(consoleSpy).toHaveBeenCalled()
            expect(alertSpy).toHaveBeenCalledWith('Failed to delete project. Please check permissions.')
        })
        
        alertSpy.mockRestore()
        consoleSpy.mockRestore()
    })
})
