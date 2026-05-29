
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import userEvent from '@testing-library/user-event'

describe('AlertDialog', () => {
    it('opens and closes', async () => {
        render(
            <AlertDialog>
                <AlertDialogTrigger>Open</AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Title</AlertDialogTitle>
                        <AlertDialogDescription>Description</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )

        const trigger = screen.getByText('Open')
        await userEvent.click(trigger)

        expect(await screen.findByText('Title')).toBeInTheDocument()
        expect(screen.getByText('Description')).toBeInTheDocument()

        const cancel = screen.getByText('Cancel')
        await userEvent.click(cancel)

        await waitFor(() => {
            expect(screen.queryByText('Title')).not.toBeInTheDocument()
        })
    })
})
