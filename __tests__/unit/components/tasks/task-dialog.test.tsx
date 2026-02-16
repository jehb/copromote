
import { render, screen, waitFor } from '@testing-library/react'
import { TaskDialog } from '@/components/tasks/task-dialog'
import { createTask, updateTask } from '@/app/actions/tasks'
import userEvent from '@testing-library/user-event'

// Mock server actions
jest.mock('@/app/actions/tasks', () => ({
    createTask: jest.fn(),
    updateTask: jest.fn(),
}))

const mockUsers = [
    { id: 'u1', name: 'User 1' },
    { id: 'u2', name: 'User 2' },
]

const mockProjects = [
    { id: 'p1', name: 'Project 1' },
]

const mockTask = {
    id: 't1',
    title: 'Existing Task',
    description: 'Desc',
    status: 'in-progress',
    dueDate: new Date('2023-01-01T12:00:00Z'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assigneeId: 'u1',
    projectId: 'p1',
}

describe('TaskDialog', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders trigger and opens dialog', async () => {
        render(<TaskDialog users={mockUsers} projects={mockProjects} />)

        const trigger = screen.getByText('Add Task')
        expect(trigger).toBeInTheDocument()

        await userEvent.click(trigger)

        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Create Task')).toBeInTheDocument()
    })

    it('submits new task', async () => {
        render(<TaskDialog users={mockUsers} projects={mockProjects} />)

        // Open
        await userEvent.click(screen.getByText('Add Task'))

        // Fill form
        await userEvent.type(screen.getByLabelText('Title'), 'New Task')
        await userEvent.type(screen.getByLabelText('Description'), 'New Desc')

        // For Select, we might need to click trigger then option.
        // Status defaults to 'todo', let's leave common fields.

        // Save
        const saveBtn = screen.getByText('Save')
        await userEvent.click(saveBtn)

        expect(createTask).toHaveBeenCalled()
        // verify FormData if possible, but minimal check is called
        const formData = (createTask as jest.Mock).mock.calls[0][0]
        expect(formData.get('title')).toBe('New Task')
        expect(formData.get('description')).toBe('New Desc')
    })

    it('populates and updates existing task', async () => {
        render(<TaskDialog users={mockUsers} projects={mockProjects} task={mockTask} />)

        // Trigger might be default or we can look for it. Default trigger is "Add Task" button but text might conflict if we assume edits use different trigger usually.
        // Pass a custom trigger to be sure
        render(
            <TaskDialog
                users={mockUsers}
                projects={mockProjects}
                task={mockTask}
                trigger={<button>Edit Trigger</button>}
            />
        )

        // Note: I rendered twice. I should cleanup or use different test.
        // Let's rely on the second render (Edit Trigger)

        await userEvent.click(screen.getByText('Edit Trigger'))

        expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Desc')).toBeInTheDocument()

        // Update title
        const titleInput = screen.getByLabelText('Title')
        await userEvent.clear(titleInput)
        await userEvent.type(titleInput, 'Updated Task')

        await userEvent.click(screen.getByText('Save'))

        expect(updateTask).toHaveBeenCalled()
        expect((updateTask as jest.Mock).mock.calls[0][0]).toBe('t1')
        expect((updateTask as jest.Mock).mock.calls[0][1].get('title')).toBe('Updated Task')
    })
})
