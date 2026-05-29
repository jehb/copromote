import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'

describe('DatePicker Component', () => {
    const mockSetDate = jest.fn()

    beforeAll(() => {
        jest.useFakeTimers()
        // Lock time to May 1, 2023 for predictable calendar rendering
        jest.setSystemTime(new Date(2023, 4, 1))
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should render "Pick a date" when no date is provided', () => {
        render(<DatePicker date={undefined} setDate={mockSetDate} />)
        expect(screen.getByText('Pick a date')).toBeInTheDocument()
    })

    it('should render formatted date when date is provided', () => {
        const date = new Date(2023, 0, 1) // Jan 1, 2023
        render(<DatePicker date={date} setDate={mockSetDate} />)
        const expectedFormat = format(date, 'PPP')
        expect(screen.getByText(expectedFormat)).toBeInTheDocument()
    })

    it('should apply custom className to the trigger button', () => {
        render(
            <DatePicker
                date={undefined}
                setDate={mockSetDate}
                className="custom-class-123"
            />
        )
        const button = screen.getByRole('button', { name: /pick a date/i })
        expect(button).toHaveClass('custom-class-123')
    })

    it('should open the calendar popover when clicked', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
        render(<DatePicker date={undefined} setDate={mockSetDate} />)

        const button = screen.getByRole('button', { name: /pick a date/i })
        await user.click(button)

        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()

        const calendarGrid = screen.getByRole('grid')
        expect(calendarGrid).toBeInTheDocument()
    })

    it('should call setDate when a date is selected', async () => {
        // Need to pass advanceTimers option when using userEvent with fake timers
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
        const initialDate = new Date(2023, 4, 15) // May 15, 2023
        render(<DatePicker date={initialDate} setDate={mockSetDate} />)

        const button = screen.getByRole('button', { name: /May 15th, 2023/i })
        await user.click(button)

        // The calendar should open on May 2023
        const dayButtons = screen.getAllByRole('button').filter(btn => btn.textContent === '20')
        await user.click(dayButtons[0])

        expect(mockSetDate).toHaveBeenCalledTimes(1)
        const selectedDate = mockSetDate.mock.calls[0][0]
        expect(selectedDate).toEqual(new Date(2023, 4, 20)) // May 20, 2023
    })

    it('should call setDate with undefined when the selected date is clicked again', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
        const initialDate = new Date(2023, 4, 15) // May 15, 2023
        render(<DatePicker date={initialDate} setDate={mockSetDate} />)

        const button = screen.getByRole('button', { name: /May 15th, 2023/i })
        await user.click(button)

        // Click the already selected date. Let's find it by text since aria-selected might be on the gridcell
        const selectedDayButtons = screen.getAllByRole('button').filter(btn => btn.textContent === '15')
        await user.click(selectedDayButtons[0])

        expect(mockSetDate).toHaveBeenCalledTimes(1)
        expect(mockSetDate).toHaveBeenCalledWith(undefined, expect.anything(), expect.anything(), expect.anything())
    })

    describe('Boundary Cases', () => {
        it('should correctly render a leap year date (Feb 29)', () => {
            const leapYearDate = new Date(2024, 1, 29) // Feb 29, 2024
            render(<DatePicker date={leapYearDate} setDate={mockSetDate} />)
            const expectedFormat = format(leapYearDate, 'PPP')
            expect(screen.getByText(expectedFormat)).toBeInTheDocument()
        })

        it('should correctly render an end-of-year date (Dec 31)', () => {
            const endOfYearDate = new Date(2023, 11, 31) // Dec 31, 2023
            render(<DatePicker date={endOfYearDate} setDate={mockSetDate} />)
            const expectedFormat = format(endOfYearDate, 'PPP')
            expect(screen.getByText(expectedFormat)).toBeInTheDocument()
        })

        it('should correctly render a date at the UNIX epoch (Jan 1, 1970)', () => {
            const epochDate = new Date(1970, 0, 1) // Jan 1, 1970
            render(<DatePicker date={epochDate} setDate={mockSetDate} />)
            const expectedFormat = format(epochDate, 'PPP')
            expect(screen.getByText(expectedFormat)).toBeInTheDocument()
        })
    })
})
