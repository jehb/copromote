import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { CommandMenu } from '@/components/search/command-menu'
import { useRouter } from 'next/navigation'
import { search } from '@/app/actions/search'

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: jest.fn()
}))

// Mock the search action
jest.mock('@/app/actions/search', () => ({
    search: jest.fn()
}))

// Mock Lucide icons to prevent errors if they exist
jest.mock('lucide-react', () => {
    const actual = jest.requireActual('lucide-react');
    return {
        ...actual,
        Search: () => <div data-testid="search-icon" />,
        Calendar: () => <div data-testid="calendar-icon" />,
        Briefcase: () => <div data-testid="briefcase-icon" />,
        UserIcon: () => <div data-testid="user-icon" />,
        CheckSquare: () => <div data-testid="check-square-icon" />,
        Building2: () => <div data-testid="building-icon" />,
        MessageSquare: () => <div data-testid="message-icon" />,
        Link2: () => <div data-testid="link-icon" />,
    };
});

describe('CommandMenu Component', () => {
    let mockRouterPush: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRouterPush = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
        (search as jest.Mock).mockResolvedValue({
            projects: [],
            tasks: [],
            contacts: [],
            organizations: [],
            events: [],
            posts: [],
            hyperlinks: [],
        });

        // Add a mock for window.open
        window.open = jest.fn();
    });

    it('renders the search button', () => {
        render(<CommandMenu />);
        expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('opens the command dialog on button click', async () => {
        render(<CommandMenu />);

        const button = screen.getByRole('button', { name: /search/i });
        fireEvent.click(button);

        // Wait for the dialog to open
        await waitFor(() => {
            expect(screen.getByPlaceholderText(/type a command or search/i)).toBeInTheDocument();
        });

        // Shows suggestions by default
        expect(screen.getByText('Go to Tasks')).toBeInTheDocument();
        expect(screen.getByText('Go to Projects')).toBeInTheDocument();
    });

    it('opens on keyboard shortcut (cmd+k)', async () => {
        render(<CommandMenu />);

        act(() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
            document.dispatchEvent(event);
        });

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/type a command or search/i)).toBeInTheDocument();
        });
    });

    it('calls search action when typing and debounces', async () => {
        jest.useFakeTimers();

        render(<CommandMenu />);

        // Open dialog
        fireEvent.click(screen.getByRole('button', { name: /search/i }));

        const input = screen.getByPlaceholderText(/type a command or search/i);

        fireEvent.change(input, { target: { value: 'test query' } });

        // Fast forward time to trigger debounce (300ms)
        act(() => {
            jest.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(search).toHaveBeenCalledWith('test query');
        });

        jest.useRealTimers();
    });

    it('displays search results and navigates on click', async () => {
        jest.useFakeTimers();

        (search as jest.Mock).mockResolvedValue({
            projects: [{ id: '1', title: 'Test Project', url: '/projects/1' }],
            tasks: [],
            contacts: [],
            organizations: [],
            events: [],
            posts: [],
            hyperlinks: [],
        });

        render(<CommandMenu />);

        fireEvent.click(screen.getByRole('button', { name: /search/i }));

        const input = screen.getByPlaceholderText(/type a command or search/i);
        fireEvent.change(input, { target: { value: 'proj' } });

        act(() => {
            jest.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(screen.getByText('Test Project')).toBeInTheDocument();
        });

        // Click on the result
        fireEvent.click(screen.getByText('Test Project'));

        expect(mockRouterPush).toHaveBeenCalledWith('/projects/1');

        jest.useRealTimers();
    });

    it('navigates to the first result on enter key', async () => {
        jest.useFakeTimers();

        (search as jest.Mock).mockResolvedValue({
            projects: [],
            tasks: [{ id: '1', title: 'Test Task', url: '/tasks/1' }],
            contacts: [],
            organizations: [],
            events: [],
            posts: [],
            hyperlinks: [],
        });

        render(<CommandMenu />);

        fireEvent.click(screen.getByRole('button', { name: /search/i }));

        const input = screen.getByPlaceholderText(/type a command or search/i);
        fireEvent.change(input, { target: { value: 'task' } });

        act(() => {
            jest.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(screen.getByText('Test Task')).toBeInTheDocument();
        });

        // Press Enter
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        expect(mockRouterPush).toHaveBeenCalledWith('/tasks/1');

        jest.useRealTimers();
    });

    it('opens a hyperlink in a new tab when enter key is pressed', async () => {
        jest.useFakeTimers();

        (search as jest.Mock).mockResolvedValue({
            projects: [],
            tasks: [],
            contacts: [],
            organizations: [],
            events: [],
            posts: [],
            hyperlinks: [{ id: '1', title: 'Example', url: 'https://example.com', type: 'hyperlink' }],
        });

        render(<CommandMenu />);

        fireEvent.click(screen.getByRole('button', { name: /search/i }));

        const input = screen.getByPlaceholderText(/type a command or search/i);
        fireEvent.change(input, { target: { value: 'example' } });

        act(() => {
            jest.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(screen.getByText('Example')).toBeInTheDocument();
        });

        // Press Enter
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank');

        jest.useRealTimers();
    });

    it('clears results when query is empty', async () => {
        jest.useFakeTimers();

        (search as jest.Mock).mockResolvedValue({
            projects: [{ id: '1', title: 'Test Project', url: '/projects/1' }],
            tasks: [],
            contacts: [],
            organizations: [],
            events: [],
            posts: [],
            hyperlinks: [],
        });

        render(<CommandMenu />);

        fireEvent.click(screen.getByRole('button', { name: /search/i }));

        const input = screen.getByPlaceholderText(/type a command or search/i);

        // Type something to get results
        fireEvent.change(input, { target: { value: 'test' } });
        act(() => {
            jest.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(screen.getByText('Test Project')).toBeInTheDocument();
        });

        // Clear input
        fireEvent.change(input, { target: { value: '' } });
        act(() => {
            jest.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(screen.queryByText('Test Project')).not.toBeInTheDocument();
            // Should show default suggestions again
            expect(screen.getByText('Go to Tasks')).toBeInTheDocument();
        });

        jest.useRealTimers();
    });

    it('handles search failure gracefully', async () => {
        jest.useFakeTimers();
        const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

        (search as jest.Mock).mockRejectedValue(new Error('Search failed'));

        render(<CommandMenu />);

        fireEvent.click(screen.getByRole('button', { name: /search/i }));

        const input = screen.getByPlaceholderText(/type a command or search/i);
        fireEvent.change(input, { target: { value: 'error' } });

        act(() => {
            jest.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(consoleErrorMock).toHaveBeenCalledWith("Search failed:", expect.any(Error));
        });

        consoleErrorMock.mockRestore();
        jest.useRealTimers();
    });

    it('navigates to contacts, organizations, events, and posts', async () => {
        jest.useFakeTimers();

        (search as jest.Mock).mockResolvedValue({
            projects: [],
            tasks: [],
            contacts: [{ id: '1', title: 'Test Contact', url: '/contacts/1', subtitle: 'Developer' }],
            organizations: [{ id: '1', title: 'Test Org', url: '/organizations/1', subtitle: 'Tech' }],
            events: [{ id: '1', title: 'Test Event', url: '/events/1', subtitle: 'Today' }],
            posts: [{ id: '1', title: 'Test Post', url: '/social/1', subtitle: 'Draft' }],
            hyperlinks: [],
        });

        render(<CommandMenu />);

        fireEvent.click(screen.getByRole('button', { name: /search/i }));

        const input = screen.getByPlaceholderText(/type a command or search/i);
        fireEvent.change(input, { target: { value: 'test' } });

        act(() => {
            jest.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(screen.getByText('Test Contact')).toBeInTheDocument();
            expect(screen.getByText('Test Org')).toBeInTheDocument();
            expect(screen.getByText('Test Event')).toBeInTheDocument();
            expect(screen.getByText('Test Post')).toBeInTheDocument();
        });

        // Click on a post result
        fireEvent.click(screen.getByText('Test Post'));

        expect(mockRouterPush).toHaveBeenCalledWith('/social/1');

        jest.useRealTimers();
    });
});
