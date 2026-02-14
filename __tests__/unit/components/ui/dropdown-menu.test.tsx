
import { render, screen, waitFor } from '@testing-library/react'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import userEvent from '@testing-library/user-event'

describe('DropdownMenu', () => {
    it('opens and selects item', async () => {
        const handleSelect = jest.fn()
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSelect}>Settings</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )

        const trigger = screen.getByText('Open Menu')
        await userEvent.click(trigger)

        expect(await screen.findByText('My Account')).toBeInTheDocument()

        const item = screen.getByText('Settings')
        await userEvent.click(item)

        expect(handleSelect).toHaveBeenCalled()
    })
})
