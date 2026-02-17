'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Download, FileSpreadsheet, Loader2, CheckSquare, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { getExportData } from '@/app/actions/data-export'

const ENTITIES = [
    { id: 'contacts', label: 'Contacts', description: 'Names, emails, and phone numbers' },
    { id: 'organizations', label: 'Organizations', description: 'Business entities and categories' },
    { id: 'projects', label: 'Projects', description: 'Marketing campaigns and status' },
    { id: 'events', label: 'Events', description: 'Calendar items and locations' },
    { id: 'tasks', label: 'Tasks', description: 'To-do items and assignments' },
    { id: 'hyperlinks', label: 'Hyperlinks', description: 'Quick access external links' },
    { id: 'social-posts', label: 'Social Posts', description: 'Social media content and schedule' },
    { id: 'promotions', label: 'Promotions', description: 'Marketing campaigns timelines' },
]

export function ExportHub() {
    const [selectedEntities, setSelectedEntities] = useState<string[]>([])
    const [format, setFormat] = useState<'csv' | 'xlsx'>('xlsx')
    const [loading, setLoading] = useState(false)

    const toggleEntity = (id: string) => {
        setSelectedEntities(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        )
    }

    const handleExport = async () => {
        if (selectedEntities.length === 0) return

        setLoading(true)
        try {
            const dataMap = await getExportData(selectedEntities)
            const wb = XLSX.utils.book_new()

            Object.entries(dataMap).forEach(([entity, records]) => {
                const ws = XLSX.utils.json_to_sheet(records)
                XLSX.utils.book_append_sheet(wb, ws, entity.charAt(0).toUpperCase() + entity.slice(1))
            })

            const timestamp = new Date().toISOString().split('T')[0]
            const filename = `promoty-data-export-${timestamp}.${format}`

            XLSX.writeFile(wb, filename, { bookType: format })
        } catch (error) {
            console.error('Export failed:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-indigo-100 bg-white/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-indigo-900">
                    <Download className="h-5 w-5" />
                    Export System Data
                </CardTitle>
                <CardDescription>
                    Select the types of data you want to export. Multi-entity exports will be saved as separate sheets in Excel.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    {ENTITIES.map((entity) => (
                        <div
                            key={entity.id}
                            className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${selectedEntities.includes(entity.id)
                                ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                                : 'bg-white border-slate-200 hover:border-indigo-100'
                                }`}
                            onClick={() => toggleEntity(entity.id)}
                        >
                            <div className="mt-1">
                                {selectedEntities.includes(entity.id)
                                    ? <CheckSquare className="h-4 w-4 text-indigo-600" />
                                    : <Square className="h-4 w-4 text-slate-300" />
                                }
                            </div>
                            <div className="grid gap-0.5 pointer-events-none">
                                <Label className="font-semibold text-slate-900 cursor-pointer">
                                    {entity.label}
                                </Label>
                                <span className="text-xs text-slate-500">
                                    {entity.description}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <Label className="text-sm font-medium text-slate-700 mb-3 block">Export Format</Label>
                    <Select value={format} onValueChange={(val: any) => setFormat(val)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                            <SelectItem value="csv">CSV (.csv)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 flex justify-between items-center py-4 rounded-b-xl border-t border-slate-100">
                <p className="text-xs text-slate-500 italic">
                    {selectedEntities.length} entities selected for export
                </p>
                <Button
                    onClick={handleExport}
                    disabled={selectedEntities.length === 0 || loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Download Data
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
