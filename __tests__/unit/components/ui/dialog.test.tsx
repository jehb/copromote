
import { render, screen, waitFor } from '@testing-library/react'
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import userEvent from '@testing-library/user-event'

describe('Dialog', () => {
    it('opens and closes', async () => {
        render(
            <Dialog>
                <DialogTrigger>Open Dialog</DialogTrigger>
                <DialogContent>
                    <DialogTitle>Dialog Title</DialogTitle>
                    <DialogDescription>Dialog Desc</DialogDescription>
                    <button>Action</button>
                </DialogContent>
            </Dialog>
        )

        const trigger = screen.getByText('Open Dialog')
        await userEvent.click(trigger)

        expect(await screen.findByText('Dialog Title')).toBeInTheDocument()

        // Close via close button (rendered by default)
        const closeBtn = screen.getByText('Close')
        await userEvent.click(closeBtn)

        await waitFor(() => {
            expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
        })
    })
})
