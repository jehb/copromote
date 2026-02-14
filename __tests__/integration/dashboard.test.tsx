
import { render, screen } from '@testing-library/react'
import DashboardPage from '@/app/page'
import { getProjects } from '@/app/actions/projects'

// Mock server actions
jest.mock('@/app/actions/projects', () => ({
    getProjects: jest.fn(),
}))

// Mock components to simplify test
jest.mock('@/components/ui/card', () => ({
    Card: ({ children, className }: any) => <div className={`mock-card ${className}`}>{children}</div>,
    CardHeader: ({ children }: any) => <div className="mock-card-header">{children}</div>,
    CardTitle: ({ children }: any) => <div className="mock-card-title">{children}</div>,
    CardContent: ({ children }: any) => <div className="mock-card-content">{children}</div>,
}))

// Mock Link
jest.mock('next/link', () => {
    return ({ children, href }: any) => <a href={href}>{children}</a>
})

const mockProjects = [
    {
        id: 'p1',
        name: 'Project Alpha',
        description: 'Desc Alpha',
        status: 'active',
        _count: { assets: 5 },
    },
    {
        id: 'p2',
        name: 'Project Beta',
        description: 'Desc Beta',
        status: 'completed',
        _count: { assets: 10 },
    },
]

describe('DashboardPage', () => {
    it('renders dashboard stats and recent projects', async () => {
        (getProjects as jest.Mock).mockResolvedValue(mockProjects)

        // Async Server Component: call it directly
        const ui = await DashboardPage()

        render(ui)

        expect(screen.getByText('Dashboard')).toBeInTheDocument()

        // Active Projects count (1 active)
        expect(screen.getByText('1')).toBeInTheDocument()
        // We might need more specific query if '1' appears elsewhere.
        // It's in a card content.

        // Total Assets (5 + 10 = 15)
        expect(screen.getByText('15')).toBeInTheDocument()

        // Recent Projects list
        expect(screen.getByText('Project Alpha')).toBeInTheDocument()
        expect(screen.getByText('Desc Alpha')).toBeInTheDocument()
        expect(screen.getByText('Project Beta')).toBeInTheDocument()
    })

    it('renders empty state correctly', async () => {
        (getProjects as jest.Mock).mockResolvedValue([])

        const ui = await DashboardPage()
        render(ui)

        // Active projects (first '0' or specific container)
        // Let's use getAllByText and check legnth or specific text
        const zeros = screen.getAllByText('0')
        expect(zeros.length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('No projects yet.')).toBeInTheDocument()
    })
})
