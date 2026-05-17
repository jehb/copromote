import { render, screen } from '@testing-library/react'
import {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
} from '@/components/ui/table'

describe('Table', () => {
    it('renders full table hierarchy', () => {
        render(
            <Table>
                <TableCaption>A list of your recent invoices.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>INV001</TableCell>
                        <TableCell>Paid</TableCell>
                        <TableCell>Credit Card</TableCell>
                        <TableCell>$250.00</TableCell>
                    </TableRow>
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={3}>Total</TableCell>
                        <TableCell>$250.00</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        )

        expect(screen.getByText('A list of your recent invoices.')).toBeInTheDocument()
        expect(screen.getByText('Invoice')).toBeInTheDocument()
        expect(screen.getByText('Status')).toBeInTheDocument()
        expect(screen.getByText('Method')).toBeInTheDocument()
        expect(screen.getByText('Amount')).toBeInTheDocument()
        expect(screen.getByText('INV001')).toBeInTheDocument()
        expect(screen.getByText('Paid')).toBeInTheDocument()
        expect(screen.getByText('Credit Card')).toBeInTheDocument()
        expect(screen.getAllByText('$250.00')).toHaveLength(2)
        expect(screen.getByText('Total')).toBeInTheDocument()
    })
})
