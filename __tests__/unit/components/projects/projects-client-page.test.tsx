
import { render, screen } from '@testing-library/react'
import { ProjectsClientPage } from '@/components/projects/projects-client-page'
import { useQuery } from '@tanstack/react-query'

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(),
}))

// Mock Next.js Link
jest.mock('next/link', () => {
    return ({ children, href, ...props }: any) => {
        return <a href={href} {...props}>{children}</a>
    }
})

// Mock lucide-react icons if necessary, but usually they render as SVGs which are fine.
// However, the page uses them. If needed we can mock.

const mockProjects = [
    {
        id: 'p1',
        name: 'Project Alpha',
        description: 'First project',
        status: 'active',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        _count: { tasks: 10, assets: 5 },
        tasks: [
            { status: 'done' },
            { status: 'done' }, // 20%
            { status: 'todo' },
            // ... total 10 implied by _count but filtering uses actual tasks array length for percentage logic in component
            // Component uses project.tasks.filter... length. So we need 10 tasks in array if we want 10 total?
            // Wait, component says:
            // const total = project._count.tasks;
            // const completed = project.tasks.filter((t: any) => t.status === 'done').length;
            // So total comes from count, completed comes from filtered tasks array.
        ]
    },
    {
        id: 'p2',
        name: 'Project Beta',
        status: 'archived',
        startDate: '2023-01-01',
        _count: { tasks: 0, assets: 0 },
        tasks: []
    }
]

describe('ProjectsClientPage', () => {
    beforeEach(() => {
        (useQuery as jest.Mock).mockReturnValue({
            data: mockProjects,
            isLoading: false,
        })
    })

    it('renders project list', () => {
        render(<ProjectsClientPage initialProjects={mockProjects} />)

        expect(screen.getByText('Project Alpha')).toBeInTheDocument()
        expect(screen.getByText('Project Beta')).toBeInTheDocument()

        // Status checks
        expect(screen.getByText('active')).toBeInTheDocument()
        expect(screen.getByText('archived')).toBeInTheDocument()
    })

    it('renders loading state when initial empty and loading', () => {
        (useQuery as jest.Mock).mockReturnValue({
            data: [],
            isLoading: true,
        })

        render(<ProjectsClientPage initialProjects={[]} />)

        // Loader is present (lucide-react Loader2)
        // We can check by container query or class if necessary, or role.
        // The loader has animate-spin class.
        const loader = document.querySelector('.animate-spin')
        expect(loader).toBeInTheDocument()
    })

    it('renders empty state', () => {
        (useQuery as jest.Mock).mockReturnValue({
            data: [],
            isLoading: false,
        })

        render(<ProjectsClientPage initialProjects={[]} />)

        expect(screen.getByText('No active projects')).toBeInTheDocument()
        expect(screen.getByText('Start First Project')).toBeInTheDocument()
    })
})
