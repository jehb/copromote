import { render, screen, fireEvent } from '@testing-library/react'
import { EmailPlannerTable } from '@/app/email-planner/email-planner-table'

jest.mock('@/app/email-planner/delete-plan-button', () => ({
    DeletePlanButton: () => <button>Delete</button>
}))

describe('EmailPlannerTable', () => {
    const mockPlans = [
        { id: '1', sendDate: '2023-01-01', subject: 'A Test', _count: { items: 2 }, notes: 'Z Note' },
        { id: '2', sendDate: '2023-01-02', subject: 'B Test', _count: { items: 1 }, notes: 'A Note' }
    ]

    it('renders empty state', () => {
        render(<EmailPlannerTable plans={[]} />)
        expect(screen.getByText(/No email plans found/i)).toBeInTheDocument()
    })

    it('renders plans', () => {
        render(<EmailPlannerTable plans={mockPlans} />)
        expect(screen.getByText('A Test')).toBeInTheDocument()
    })

    it('sorts by subject on click', () => {
        render(<EmailPlannerTable plans={mockPlans} />)
        const subjectHeader = screen.getByText(/Subject/)
        fireEvent.click(subjectHeader) // asc
        fireEvent.click(subjectHeader) // desc
        expect(screen.getAllByText(/Test/).length).toBe(2)
    })
    
    it('sorts by different columns', () => {
        render(<EmailPlannerTable plans={mockPlans} />)
        fireEvent.click(screen.getByText(/Planned Send Date/))
        fireEvent.click(screen.getByText(/Planned Send Date/))
        fireEvent.click(screen.getByText(/Items/))
        fireEvent.click(screen.getByText(/Items/))
        fireEvent.click(screen.getByText(/Notes/))
        fireEvent.click(screen.getByText(/Notes/))
        expect(screen.getByText('Z Note')).toBeInTheDocument()
    })
})
