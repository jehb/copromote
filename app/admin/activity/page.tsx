import { getActivityLogs } from '@/app/actions/activity-logs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Activity, Clock, User, Fingerprint } from 'lucide-react'
import { ExportButton } from '@/components/ui/export-button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function ActivityLogsPage() {
    const logs = await getActivityLogs()

    // Flatten data for export
    const exportData = logs.map(log => ({
        ID: log.id,
        Action: log.action,
        EntityType: log.entityType,
        EntityID: log.entityId || '-',
        Details: log.details || '-',
        User: log.user ? log.user.username : 'Unknown',
        Email: log.user ? log.user.email : 'Unknown',
        Time: new Date(log.createdAt).toLocaleString()
    }))

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Activity Logs</h1>
                        <p className="text-muted-foreground">Track business actions and entity changes.</p>
                    </div>
                </div>
                <ExportButton data={exportData} filename="activity-logs" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        Showing the last 100 activity events.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Time</TableHead>
                                <TableHead className="w-[120px]">Action</TableHead>
                                <TableHead className="w-[120px]">Entity</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-mono text-xs">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                            {new Date(log.createdAt).toLocaleString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`font-medium text-xs border rounded px-1.5 py-0.5 ${log.action === 'CREATE' ? 'bg-green-50 text-green-700 border-green-200' :
                                            log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                log.action === 'DELETE' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-slate-50 text-slate-700 border-slate-200'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{log.entityType}</span>
                                            {log.entityId && (
                                                <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px]" title={log.entityId}>
                                                    {log.entityId.substring(0, 8)}...
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {log.user ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                                                    {log.user.avatar ? (
                                                        <img src={log.user.avatar} alt={log.user.username} className="h-6 w-6 rounded-full object-cover" />
                                                    ) : (
                                                        log.user.username.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{log.user.username}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs italic">System / Unknown</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600">
                                        <div className="space-y-1">
                                            <div className="text-sm text-slate-600 font-medium">{log.details || '-'}</div>
                                            {/* @ts-ignore */}
                                            {log.metadata && (
                                                <div className="text-xs space-y-1 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                                                    {/* @ts-ignore */}
                                                    {Object.entries(JSON.parse(log.metadata)).map(([field, change]: [string, any]) => (
                                                        <div key={field} className="flex flex-col sm:flex-row sm:gap-2">
                                                            <span className="font-semibold text-slate-700 capitalize w-24 shrink-0">{field}:</span>
                                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                                <span className="text-red-600 line-through truncate max-w-[120px]" title={String(change.from ?? 'null')}>
                                                                    {change.from === null ? 'null' : String(change.from)}
                                                                </span>
                                                                <span className="text-slate-400">→</span>
                                                                <span className="text-green-600 truncate max-w-[120px]" title={String(change.to ?? 'null')}>
                                                                    {change.to === null ? 'null' : String(change.to)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
