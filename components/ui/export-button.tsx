'use client'

import React from 'react'
import ExcelJS from 'exceljs'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ExportButtonProps {
    data: any[]
    filename?: string
    label?: string
    className?: string
}

export function ExportButton({
    data,
    filename = 'export',
    label = 'Export',
    className
}: ExportButtonProps) {
    const [loading, setLoading] = React.useState(false)

    const handleExport = async (type: 'csv' | 'xlsx') => {
        if (!data || data.length === 0) return

        setLoading(true)
        try {
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('Sheet1')

            // Get columns from the first object
            if (data.length > 0) {
                const columns = Object.keys(data[0]).map(key => ({
                    header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                    key: key,
                    width: 20
                }))
                worksheet.columns = columns

                // Add rows
                worksheet.addRows(data)
            }

            // Generate file name
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const fullFilename = `${filename}-${timestamp}.${type}`

            // Write and download
            let buffer: ArrayBuffer;
            let mimeType: string;

            if (type === 'csv') {
                buffer = await workbook.csv.writeBuffer()
                mimeType = 'text/csv'
            } else {
                buffer = await workbook.xlsx.writeBuffer()
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }

            const blob = new Blob([buffer], { type: mimeType })
            const url = window.URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = fullFilename
            anchor.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Export failed:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={`gap-2 ${className}`} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {label}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                    Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                    Export as Excel (XLSX)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
