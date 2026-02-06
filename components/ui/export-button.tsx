'use client'

import React from 'react'
import * as XLSX from 'xlsx'
import { Download } from 'lucide-react'
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

    const handleExport = (type: 'csv' | 'xlsx') => {
        // Create a worksheet from the data
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

        // Generate file name
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const fullFilename = `${filename}-${timestamp}.${type}`

        // Write and download
        if (type === 'csv') {
            XLSX.writeFile(wb, fullFilename, { bookType: 'csv' })
        } else {
            XLSX.writeFile(wb, fullFilename, { bookType: 'xlsx' })
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={`gap-2 ${className}`}>
                    <Download className="h-4 w-4" />
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
