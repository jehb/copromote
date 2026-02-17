'use client'

import { useState } from 'react'
import ExcelJS from 'exceljs'
import Papa from 'papaparse'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { importData } from '@/app/actions/data-import'

const ENTITIES = [
    { value: 'contacts', label: 'Contacts' },
    { value: 'organizations', label: 'Organizations' },
    { value: 'projects', label: 'Projects' },
    { value: 'tasks', label: 'Tasks' },
    { value: 'events', label: 'Events' },
    { value: 'social-posts', label: 'Social Media Posts' },
    { value: 'hyperlinks', label: 'Hyperlinks' },
    { value: 'promotions', label: 'Promotions' },
]

export function ImportDialog() {
    const [open, setOpen] = useState(false)
    const [entity, setEntity] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResult(null)
        }
    }

    const handleImport = async () => {
        if (!file || !entity) return

        setLoading(true)
        setResult(null)

        try {
            const fileExtension = file.name.split('.').pop()?.toLowerCase()
            let jsonData: any[] = []

            if (fileExtension === 'csv') {
                const text = await file.text()
                const parseResult = Papa.parse(text, { header: true, skipEmptyLines: true })
                jsonData = parseResult.data
            } else if (fileExtension === 'xlsx') {
                const buffer = await file.arrayBuffer()
                const workbook = new ExcelJS.Workbook()
                await (workbook.xlsx as any).load(buffer)
                const worksheet = workbook.worksheets[0]

                const rows: any[] = []
                const headerRow = worksheet.getRow(1)
                const headers: string[] = []
                headerRow.eachCell((cell) => {
                    headers.push(cell.toString())
                })

                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return // Skip header
                    const rowData: any = {}
                    row.eachCell((cell, colNumber) => {
                        const header = headers[colNumber - 1]
                        if (header) {
                            rowData[header.toLowerCase().replace(/\s+/g, '_')] = cell.value
                        }
                    })
                    rows.push(rowData)
                })
                jsonData = rows
            } else {
                setResult({ success: false, message: 'Unsupported file format' })
                setLoading(false)
                return
            }

            const res = await importData(entity, jsonData)
            setResult(res)
            if (res.success) {
                setFile(null)
            }
        } catch (err) {
            console.error('Import error:', err)
            setResult({ success: false, message: 'Failed to process file' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Upload className="h-4 w-4" />
                    Import Data
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import Data</DialogTitle>
                    <DialogDescription>
                        Upload a CSV or Excel file to bulk import records. Records with matching IDs will be updated.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="entity">Data Type</Label>
                        <Select value={entity} onValueChange={setEntity}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type to import" />
                            </SelectTrigger>
                            <SelectContent>
                                {ENTITIES.map((e) => (
                                    <SelectItem key={e.value} value={e.value}>
                                        {e.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="file">File (CSV or XLSX)</Label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 border-slate-200">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {file ? (
                                        <>
                                            <FileSpreadsheet className="w-8 h-8 mb-3 text-indigo-500" />
                                            <p className="text-sm text-slate-600 font-medium">{file.name}</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 mb-3 text-slate-400" />
                                            <p className="text-sm text-slate-500">Click to upload</p>
                                        </>
                                    )}
                                </div>
                                <input
                                    id="file"
                                    type="file"
                                    className="hidden"
                                    accept=".csv,.xlsx"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>
                    </div>

                    {result && (
                        <div className={`p-4 rounded-lg flex gap-3 text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {result.success ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                            <p>{result.message}</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleImport}
                        disabled={!file || !entity || loading}
                        className="w-full"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Processing...' : 'Start Import'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
