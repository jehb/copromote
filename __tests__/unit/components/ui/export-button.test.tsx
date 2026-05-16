import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportButton } from '@/components/ui/export-button'
import ExcelJS from 'exceljs'

// Mock exceljs
jest.mock('exceljs', () => {
    const mockWriteBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(8))
    return {
        Workbook: jest.fn().mockImplementation(() => ({
            addWorksheet: jest.fn().mockReturnValue({
                columns: [],
                addRows: jest.fn(),
            }),
            csv: { writeBuffer: mockWriteBuffer },
            xlsx: { writeBuffer: mockWriteBuffer },
        }))
    }
})

describe('ExportButton', () => {
    let originalCreateObjectURL: typeof window.URL.createObjectURL
    let originalRevokeObjectURL: typeof window.URL.revokeObjectURL
    let mockClick: jest.Mock

    beforeAll(() => {
        originalCreateObjectURL = window.URL.createObjectURL
        originalRevokeObjectURL = window.URL.revokeObjectURL
        window.URL.createObjectURL = jest.fn().mockReturnValue('mock-url')
        window.URL.revokeObjectURL = jest.fn()

        mockClick = jest.fn()
        HTMLAnchorElement.prototype.click = mockClick
    })

    afterAll(() => {
        window.URL.createObjectURL = originalCreateObjectURL
        window.URL.revokeObjectURL = originalRevokeObjectURL
        delete (HTMLAnchorElement.prototype as any).click
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    const sampleData = [
        { id: 1, name: 'Alice', role_name: 'Admin' },
        { id: 2, name: 'Bob', role_name: 'User' }
    ]

    it('renders with default label', () => {
        render(<ExportButton data={sampleData} />)
        expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
    })

    it('renders with custom label', () => {
        render(<ExportButton data={sampleData} label="Download Data" />)
        expect(screen.getByRole('button', { name: /download data/i })).toBeInTheDocument()
    })

    it('does not export if data is empty', async () => {
        const user = userEvent.setup()
        render(<ExportButton data={[]} />)

        // Open dropdown
        await user.click(screen.getByRole('button', { name: /export/i }))

        // Click export as CSV
        await user.click(screen.getByText(/export as csv/i))

        expect(ExcelJS.Workbook).not.toHaveBeenCalled()
        expect(window.URL.createObjectURL).not.toHaveBeenCalled()
    })

    it('exports as CSV successfully', async () => {
        const user = userEvent.setup()
        render(<ExportButton data={sampleData} filename="test-users" />)

        // Open dropdown
        await user.click(screen.getByRole('button', { name: /export/i }))

        // Click export as CSV
        await user.click(screen.getByText(/export as csv/i))

        await waitFor(() => {
            expect(ExcelJS.Workbook).toHaveBeenCalled()
            expect(window.URL.createObjectURL).toHaveBeenCalled()
            expect(mockClick).toHaveBeenCalled()
            expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url')
        })
    })

    it('exports as XLSX successfully', async () => {
        const user = userEvent.setup()
        render(<ExportButton data={sampleData} filename="test-users" />)

        // Open dropdown
        await user.click(screen.getByRole('button', { name: /export/i }))

        // Click export as Excel
        await user.click(screen.getByText(/export as excel/i))

        await waitFor(() => {
            expect(ExcelJS.Workbook).toHaveBeenCalled()
            expect(window.URL.createObjectURL).toHaveBeenCalled()
            expect(mockClick).toHaveBeenCalled()
            expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url')
        })
    })
})
