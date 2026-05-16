import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportButton } from '@/components/ui/export-button'
import ExcelJS from 'exceljs'

// Mock URL methods
global.window.URL.createObjectURL = jest.fn()
global.window.URL.revokeObjectURL = jest.fn()

// Mock anchor element click to prevent 'Not implemented: navigation' errors in JSDOM
const originalCreateElement = document.createElement.bind(document)
document.createElement = (tagName: string, options?: ElementCreationOptions) => {
    const el = originalCreateElement(tagName, options)
    if (tagName.toLowerCase() === 'a') {
        el.click = jest.fn()
    }
    return el
}

// Mock exceljs
jest.mock('exceljs', () => {
    return {
        Workbook: jest.fn().mockImplementation(() => {
            return {
                addWorksheet: jest.fn().mockReturnValue({
                    columns: [],
                    addRows: jest.fn()
                }),
                csv: {
                    writeBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
                },
                xlsx: {
                    writeBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
                }
            }
        })
    }
})

describe('ExportButton Component', () => {
    const mockData = [
        { id: 1, name: 'John Doe', age: 30 },
        { id: 2, name: 'Jane Smith', age: 25 }
    ]

    beforeEach(() => {
        jest.clearAllMocks()
    })

    afterAll(() => {
        // Restore original createElement
        document.createElement = originalCreateElement
    })

    it('renders the export button with default label', () => {
        render(<ExportButton data={mockData} />)
        expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
    })

    it('renders the export button with custom label', () => {
        render(<ExportButton data={mockData} label="Download Data" />)
        expect(screen.getByRole('button', { name: /download data/i })).toBeInTheDocument()
    })

    it('does not trigger export if data is empty', async () => {
        const user = userEvent.setup()
        render(<ExportButton data={[]} />)

        const button = screen.getByRole('button', { name: /export/i })
        await user.click(button)

        // Open dropdown and click CSV
        const csvMenuItem = screen.getByText('Export as CSV')
        await user.click(csvMenuItem)

        expect(ExcelJS.Workbook).not.toHaveBeenCalled()
    })

    it('exports data to CSV correctly', async () => {
        const user = userEvent.setup()
        render(<ExportButton data={mockData} filename="test-export" />)

        // Open dropdown
        const button = screen.getByRole('button', { name: /export/i })
        await user.click(button)

        // Click CSV
        const csvMenuItem = screen.getByText('Export as CSV')
        await user.click(csvMenuItem)

        await waitFor(() => {
            expect(ExcelJS.Workbook).toHaveBeenCalled()
            expect(global.window.URL.createObjectURL).toHaveBeenCalled()
        })
    })

    it('exports data to XLSX correctly', async () => {
        const user = userEvent.setup()
        render(<ExportButton data={mockData} filename="test-export" />)

        // Open dropdown
        const button = screen.getByRole('button', { name: /export/i })
        await user.click(button)

        // Click XLSX
        const xlsxMenuItem = screen.getByText('Export as Excel (XLSX)')
        await user.click(xlsxMenuItem)

        await waitFor(() => {
            expect(ExcelJS.Workbook).toHaveBeenCalled()
            expect(global.window.URL.createObjectURL).toHaveBeenCalled()
        })
    })
})
