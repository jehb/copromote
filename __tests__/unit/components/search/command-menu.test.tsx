import { render, screen, act, waitFor } from '@testing-library/react'
import { CommandMenu } from '@/components/search/command-menu'
import userEvent from '@testing-library/user-event'
import { search } from '@/app/actions/search'
import { useRouter } from 'next/navigation'

jest.mock('@/app/actions/search', () => ({
    search: jest.fn()
}))

jest.mock('next/navigation', () => ({
    useRouter: jest.fn()
}))

describe('CommandMenu', () => {
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
            
            // Mock scrollIntoView for command items
            window.HTMLElement.prototype.scrollIntoView = jest.fn()
        }
    })

    it('renders the trigger button', () => {
        render(<CommandMenu />)
        expect(screen.getByRole('button', { name: /Search.../i })).toBeInTheDocument()
    })

    it('renders collapsed state correctly', () => {
        render(<CommandMenu isCollapsed={true} />)
        const btn = screen.getByRole('button')
        expect(btn).toHaveAttribute('title', 'Search...')
    })

    it('opens dialog on button click and shows default suggestions', async () => {
        const user = userEvent.setup()
        render(<CommandMenu />)
        
        await user.click(screen.getByRole('button', { name: /Search.../i }))
        
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument()
        
        // Check default suggestions
        expect(screen.getByText('Go to Tasks')).toBeInTheDocument()
        expect(screen.getByText('Go to Projects')).toBeInTheDocument()
    })

    it('navigates on suggestion selection', async () => {
        const user = userEvent.setup()
        render(<CommandMenu />)
        
        await user.click(screen.getByRole('button', { name: /Search.../i }))
        
        // Click "Go to Tasks"
        const taskSuggestion = screen.getByText('Go to Tasks')
        await user.click(taskSuggestion)
        
        expect(mockRouter.push).toHaveBeenCalledWith('/tasks')
    })

    it('fetches and displays search results when query is entered', async () => {
        const user = userEvent.setup()
        
        const mockResults = {
            projects: [{ id: 'p1', title: 'Test Project', url: '/projects/p1', type: 'project' }],
            tasks: [{ id: 't1', title: 'Test Task', url: '/tasks/t1', type: 'task' }],
            contacts: [{ id: 'c1', title: 'Test Contact', url: '/contacts/c1', type: 'contact' }],
            organizations: [{ id: 'o1', title: 'Test Org', url: '/organizations/o1', type: 'organization' }],
            events: [{ id: 'e1', title: 'Test Event', url: '/events/e1', type: 'event' }],
            posts: [{ id: 'po1', title: 'Test Post', url: '/social/po1', type: 'post' }],
            hyperlinks: []
        }
        
        ;(search as jest.Mock).mockResolvedValue(mockResults)
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        
        render(<CommandMenu />)
        
        await user.click(screen.getByRole('button', { name: /Search.../i }))
        
        const input = screen.getByPlaceholderText('Type a command or search...')
        await user.type(input, 'test')
        
        await waitFor(() => {
            expect(search).toHaveBeenCalledWith('test')
            expect(screen.getByText('Test Project')).toBeInTheDocument()
            expect(screen.getByText('Test Task')).toBeInTheDocument()
            expect(screen.getByText('Test Contact')).toBeInTheDocument()
            expect(screen.getByText('Test Org')).toBeInTheDocument()
            expect(screen.getByText('Test Event')).toBeInTheDocument()
            expect(screen.getByText('Test Post')).toBeInTheDocument()
        })
        logSpy.mockRestore()
    })

    it('handles search errors gracefully', async () => {
        const user = userEvent.setup()
        ;(search as jest.Mock).mockRejectedValue(new Error('Search failed'))
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        
        render(<CommandMenu />)
        
        await user.click(screen.getByRole('button', { name: /Search.../i }))
        
        const input = screen.getByPlaceholderText('Type a command or search...')
        await user.type(input, 'error')
        
        await waitFor(() => {
            expect(search).toHaveBeenCalledWith('error')
            expect(consoleSpy).toHaveBeenCalled()
            expect(screen.getByText('No results found.')).toBeInTheDocument()
        })
        
        consoleSpy.mockRestore()
        logSpy.mockRestore()
    })

    it('navigates to first result on enter', async () => {
        const user = userEvent.setup()
        
        const mockResults = {
            projects: [],
            tasks: [],
            contacts: [],
            organizations: [],
            events: [],
            posts: [],
            hyperlinks: [{ id: 'h1', title: 'Test Link', url: 'https://example.com', type: 'hyperlink' }]
        }
        
        ;(search as jest.Mock).mockResolvedValue(mockResults)
        const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        
        render(<CommandMenu />)
        
        await user.click(screen.getByRole('button', { name: /Search.../i }))
        
        const input = screen.getByPlaceholderText('Type a command or search...')
        await user.type(input, 'link')
        
        await waitFor(() => {
            expect(screen.getByText('Test Link')).toBeInTheDocument()
        })
        
        await user.keyboard('{Enter}')
        
        expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank')
        
        openSpy.mockRestore()
        logSpy.mockRestore()
    })

    it('navigates to regular result on enter', async () => {
        const user = userEvent.setup()
        
        const mockResults = {
            projects: [{ id: 'p1', title: 'Test Project', url: '/projects/p1', type: 'project' }],
            tasks: [],
            contacts: [],
            organizations: [],
            events: [],
            posts: [],
            hyperlinks: []
        }
        
        ;(search as jest.Mock).mockResolvedValue(mockResults)
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        
        render(<CommandMenu />)
        
        await user.click(screen.getByRole('button', { name: /Search.../i }))
        
        const input = screen.getByPlaceholderText('Type a command or search...')
        await user.type(input, 'project')
        
        await waitFor(() => {
            expect(screen.getByText('Test Project')).toBeInTheDocument()
        })
        
        await user.keyboard('{Enter}')
        
        expect(mockRouter.push).toHaveBeenCalledWith('/projects/p1')
        logSpy.mockRestore()
    })
    
    it('opens on keyboard shortcut', () => {
        render(<CommandMenu />)
        
        act(() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
        })
        
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
})
