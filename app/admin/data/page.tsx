import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExportHub } from './export-hub'
import { ImportDialog } from './import-dialog'
import { Database, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DataHubPage() {
    return (
        <div className="p-8 space-y-8 bg-slate-50/30 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Data Hub</h1>
                    <p className="text-muted-foreground mt-1">Manage bulk data operations and system portability.</p>
                </div>
                <div className="flex gap-3">
                    <ImportDialog />
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <ExportHub />

                    <Card className="border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Database className="h-5 w-5 text-slate-500" />
                                Data Integrity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ArrowUpRight className="h-4 w-4 text-blue-600" />
                                        <h4 className="font-semibold text-blue-900 text-sm">Export Safety</h4>
                                    </div>
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        All exports are generated in real-time from the database. Personaly identifiable information is preserved for system portability.
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ArrowDownLeft className="h-4 w-4 text-amber-600" />
                                        <h4 className="font-semibold text-amber-900 text-sm">Import Logic</h4>
                                    </div>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        Importing records with an existing ID will update the record in the database. Omitting IDs will create new records.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-indigo-900 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Database className="h-24 w-24" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg">Portability Guide</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-4 text-indigo-100 relative z-10">
                            <p>
                                Use the Data Hub to move your information between different environments or to perform bulk updates using external tools.
                            </p>
                            <ul className="space-y-2 list-disc pl-4">
                                <li>Export to Excel for batch editing</li>
                                <li>Use IDs for reliable upserts</li>
                                <li>Back up your database before large imports</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">Supported Formats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Excel</span>
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">XLSX</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Comma Separated</span>
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">CSV</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
