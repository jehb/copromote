import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskBoard } from '@/components/tasks/task-board'
import { deleteTask, updateTaskStatus } from '@/app/actions/tasks'
import userEvent from '@testing-library/user-event'

// Mock server actions
jest.mock('@/app/actions/tasks', () => ({
    deleteTask: jest.fn(),
    updateTaskStatus: jest.fn(),
}))

// Mock TaskDialog to avoid complex interaction
jest.mock('@/components/tasks/task-dialog', () => ({
    TaskDialog: ({ trigger, onOpenChange }: any) => (
        <div data-testid="task-dialog-trigger">
            {trigger}
            <button data-testid="close-dialog" onClick={() => onOpenChange?.(false)}>Close</button>
        </div>
    )
}))

// Mock UserAvatar to avoid image issues
jest.mock('@/components/ui/user-avatar', () => ({
    UserAvatar: ({ name }: any) => <div data-testid="user-avatar">{name}</div>
}))

const mockTasks = [
    {
        id: '1',
        title: 'Task 1',
        status: 'todo',
        assignee: { name: 'User 1', email: 'u1@example.com' },
        project: { id: 'p1', name: 'Project 1' },
        dueDate: new Date(Date.now() - 100000).toISOString(), // Past due
        description: 'Check this [link](https://example.com)'
    },
    {
        id: '2',
        title: 'Task 2',
        status: 'in-progress',
        assignee: null,
        project: null,
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Overdue
    },
    {
        id: '3',
        title: 'Task 3',
        status: 'done',
        assignee: null,
        project: null,
    },
]

const mockUsers = [{ id: 'u1', name: 'User 1' }]
const mockProjects = [{ id: 'p1', name: 'Project 1' }]

describe('TaskBoard', () => {
    beforeAll(() => {
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

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders tasks in correct columns and parts', () => {
        render(<TaskBoard tasks={mockTasks} users={mockUsers} projects={mockProjects} />)

        expect(screen.getByText('Task 1')).toBeInTheDocument()
        expect(screen.getByText('Task 2')).toBeInTheDocument()
        expect(screen.getByText('Task 3')).toBeInTheDocument()

        // Description link
        const link = screen.getByRole('link', { name: 'link' })
        expect(link).toHaveAttribute('href', 'https://example.com')
    })

    it('calls updateTaskStatus when moving status', async () => {
        render(<TaskBoard tasks={mockTasks} users={mockUsers} projects={mockProjects} />)

        // Task 1 is todo, so it has "In Prog" and "Done" buttons
        const inProgBtns = screen.getAllByRole('button', { name: /^in prog$/i })
        fireEvent.click(inProgBtns[0])
        expect(updateTaskStatus).toHaveBeenCalledWith('1', 'in-progress')

        const doneBtns = screen.getAllByRole('button', { name: /^done$/i })
        fireEvent.click(doneBtns[0])
        expect(updateTaskStatus).toHaveBeenCalledWith('1', 'done')

        const todoBtns = screen.getAllByRole('button', { name: /^to do$/i })
        // todoBtns[0] should be Task 2 (in-progress)
        fireEvent.click(todoBtns[0])
        expect(updateTaskStatus).toHaveBeenCalledWith('2', 'todo')
    })

    it('handles dropdown edit and delete', async () => {
        render(<TaskBoard tasks={mockTasks} users={mockUsers} projects={mockProjects} />)

        const triggers = screen.getAllByRole('button', { name: 'Task options' })
        fireEvent.pointerDown(triggers[0], { button: 0, ctrlKey: false, pointerType: 'mouse' })

        // Wait for dropdown
        const editMenuItem = await screen.findByRole('menuitem', { name: /edit/i })
        const deleteMenuItem = screen.getByRole('menuitem', { name: /delete/i })

        // Delete
        fireEvent.click(deleteMenuItem)
        expect(deleteTask).toHaveBeenCalledWith('1')

        // Edit
        fireEvent.pointerDown(triggers[1], { button: 0, ctrlKey: false, pointerType: 'mouse' })
        const editMenuItem2 = await screen.findByRole('menuitem', { name: /edit/i })
        
        // Simulating selection on Radix UI is tricky, pointerDown and click
        fireEvent.click(editMenuItem2)
        
        // Wait to see if TaskDialog triggered by checking if editingTask changed
        // We mocked TaskDialog to have a close button
        const closeBtns = screen.getAllByTestId('close-dialog')
        // The last one is the Central Edit Dialog
        fireEvent.click(closeBtns[closeBtns.length - 1])
    })
})
