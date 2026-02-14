
import { render, screen } from '@testing-library/react'
import TasksPage from '@/app/tasks/page'
import { getTasks } from '@/app/actions/tasks'
import { getUsers } from '@/app/actions/events' // Imported from events? Check import in page
import { getProjects } from '@/app/actions/projects'

// Mock server actions
jest.mock('@/app/actions/tasks', () => ({
    getTasks: jest.fn(),
}))
jest.mock('@/app/actions/events', () => ({
    getUsers: jest.fn(),
}))
jest.mock('@/app/actions/projects', () => ({
    getProjects: jest.fn(),
}))

// Mock Subcomponents
jest.mock('@/components/tasks/task-board', () => ({
    TaskBoard: (props: any) => (
        <div data-testid="task-board">
            Mock TaskBoard
            <span data-testid="task-count">{props.tasks?.length}</span>
            <span data-testid="user-count">{props.users?.length}</span>
            <span data-testid="project-count">{props.projects?.length}</span>
        </div>
    )
}))

jest.mock('@/components/tasks/task-dialog', () => ({
    TaskDialog: (props: any) => (
        <div data-testid="task-dialog">Create Task Trigger</div>
    )
}))

const mockTasks = [{ id: 't1', title: 'Task 1' }]
const mockUsers = [{ id: 'u1', name: 'User 1' }]
const mockProjects = [{ id: 'p1', name: 'Project 1' }]

describe('TasksPage', () => {
    it('renders task board with fetched data', async () => {
        (getTasks as jest.Mock).mockResolvedValue(mockTasks);
        (getUsers as jest.Mock).mockResolvedValue(mockUsers);
        (getProjects as jest.Mock).mockResolvedValue(mockProjects);

        const ui = await TasksPage()
        render(ui)

        expect(screen.getByText('Tasks')).toBeInTheDocument()
        expect(screen.getByText('Mock TaskBoard')).toBeInTheDocument()

        // Verify data passing
        expect(screen.getByTestId('task-count')).toHaveTextContent('1')
        expect(screen.getByTestId('user-count')).toHaveTextContent('1')
        expect(screen.getByTestId('project-count')).toHaveTextContent('1')

        // Dialog trigger
        expect(screen.getByText('Create Task Trigger')).toBeInTheDocument()
    })
})
