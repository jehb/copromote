import { render, screen } from '@testing-library/react'
import { ProjectsClientPage } from '@/components/projects/projects-client-page'
import { useQuery } from '@tanstack/react-query'

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn()
}))

// Mock actions
jest.mock('@/app/actions/projects', () => ({
    getProjects: jest.fn(),
    deleteProject: jest.fn()
}))

// Mock ProjectDeleteDialog to simplify
jest.mock('@/components/projects/project-delete-dialog', () => ({
    ProjectDeleteDialog: () => <button>Delete Project</button>
}))

describe('ProjectsClientPage', () => {
    const mockInitialProjects = [
        {
            id: 'p1',
            name: 'Project Alpha',
            status: 'active',
            description: 'A test project',
            startDate: new Date('2026-01-02T12:00:00Z').toISOString(),
            endDate: new Date('2026-12-30T12:00:00Z').toISOString(),
            _count: { tasks: 10, assets: 5 },
            tasks: [
                { id: 't1', status: 'done' },
                { id: 't2', status: 'done' },
                { id: 't3', status: 'todo' }
            ]
        },
        {
            id: 'p2',
            name: 'Project Beta',
            status: 'archived',
            description: null,
            startDate: new Date('2026-05-02T12:00:00Z').toISOString(),
            endDate: null,
            _count: { tasks: 0, assets: 0 },
            tasks: []
        }
    ]

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders the projects and calculates progress correctly', () => {
        ;(useQuery as jest.Mock).mockReturnValue({
            data: mockInitialProjects,
            isLoading: false
        })

        render(<ProjectsClientPage initialProjects={mockInitialProjects} />)

        expect(screen.getByText('Project Alpha')).toBeInTheDocument()
        expect(screen.getByText('Project Beta')).toBeInTheDocument()
        
        // Progress for Project Alpha: 2 done out of 10 = 20%
        expect(screen.getByText('20%')).toBeInTheDocument()
        
        // Progress for Project Beta: 0 out of 0 = 0%
        expect(screen.getByText('0%')).toBeInTheDocument()
        
        // Check date formatting
        expect(screen.getByText(/Jan 2 - Dec 30, 2026/)).toBeInTheDocument()
        expect(screen.getByText(/May 2 - Ongoing/)).toBeInTheDocument()
    })

    it('renders empty state when no projects exist', () => {
        ;(useQuery as jest.Mock).mockReturnValue({
            data: [],
            isLoading: false
        })

        render(<ProjectsClientPage initialProjects={[]} />)

        expect(screen.getByText('No active projects')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Start First Project' })).toBeInTheDocument()
    })

    it('renders loading state', () => {
        ;(useQuery as jest.Mock).mockReturnValue({
            data: [],
            isLoading: true
        })

        const { container } = render(<ProjectsClientPage initialProjects={[]} />)
        expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('hides delete button for non-admins', () => {
        ;(useQuery as jest.Mock).mockReturnValue({
            data: mockInitialProjects,
            isLoading: false
        })

        render(<ProjectsClientPage initialProjects={mockInitialProjects} userRole="USER" />)

        expect(screen.queryByRole('button', { name: 'Delete Project' })).not.toBeInTheDocument()
    })

    it('shows delete button for admins', () => {
        ;(useQuery as jest.Mock).mockReturnValue({
            data: mockInitialProjects,
            isLoading: false
        })

        render(<ProjectsClientPage initialProjects={mockInitialProjects} userRole="ADMIN" />)

        // There are two projects, so there should be two delete buttons
        expect(screen.getAllByRole('button', { name: 'Delete Project' })).toHaveLength(2)
    })
})
