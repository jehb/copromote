import { render, screen } from '@testing-library/react'
import { Calendar } from '@/components/ui/calendar'
import userEvent from '@testing-library/user-event'

describe('Calendar', () => {
    it('renders correctly', () => {
        render(
            <Calendar
                mode="single"
                selected={new Date(2023, 0, 1)}
                defaultMonth={new Date(2023, 0, 1)}
            />
        )
        expect(screen.getByText('January 2023')).toBeInTheDocument()
        expect(screen.getAllByText('1')[0]).toBeInTheDocument()
    })

    it('can select a date', async () => {
        const user = userEvent.setup()
        const onSelect = jest.fn()
        render(
            <Calendar
                mode="single"
                onSelect={onSelect}
                defaultMonth={new Date(2023, 0, 1)}
            />
        )
        
        await user.click(screen.getAllByText('15')[0])
        expect(onSelect).toHaveBeenCalled()
    })
})
