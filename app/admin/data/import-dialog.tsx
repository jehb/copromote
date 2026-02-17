'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
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
            const reader = new FileReader()
            reader.onload = async (e) => {
                try {
                    const data = e.target?.result
                    const workbook = XLSX.read(data, { type: 'binary' })
                    const sheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[sheetName]
                    const json = XLSX.utils.sheet_to_json(worksheet)

                    const res = await importData(entity, json as any[])
                    setResult(res)
                    if (res.success) {
                        setFile(null)
                    }
                } catch (err) {
                    setResult({ success: false, message: 'Failed to parse file' })
                } finally {
                    setLoading(false)
                }
            }
            reader.readAsBinaryString(file)
        } catch (err) {
            setResult({ success: false, message: 'Failed to read file' })
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
