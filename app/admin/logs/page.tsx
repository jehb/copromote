import { getSecurityLogs } from '@/app/actions/admin-logs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react'
import { ExportButton } from '@/components/ui/export-button'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
    const logs = await getSecurityLogs()

    // Flatten data for export
    const exportData = logs.map(log => ({
        ID: log.id,
        Action: log.action,
        Details: log.details,
        User: log.user ? log.user.username : 'Unknown',
        Email: log.user ? log.user.email : 'Unknown',
        'IP Address': log.ipAddress,
        'User Agent': log.userAgent,
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
                        <h1 className="text-3xl font-bold">Security Logs</h1>
                        <p className="text-muted-foreground">View system access logs and security events.</p>
                    </div>
                </div>
                <ExportButton data={exportData} filename="security-logs" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        Showing the last 100 security events.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">Time</TableHead>
                                <TableHead className="w-[150px]">Action</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="text-right">IP Address</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-mono text-xs">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {log.action === 'LOGIN' ? <ShieldCheck className="h-4 w-4 text-green-600" /> :
                                                log.action === 'FAILED_LOGIN' ? <ShieldAlert className="h-4 w-4 text-red-600" /> :
                                                    <Shield className="h-4 w-4 text-slate-500" />}
                                            <span className="font-medium text-xs border rounded px-1.5 py-0.5 bg-slate-50">{log.action}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {log.user ? (
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{log.user.username}</span>
                                                <span className="text-xs text-muted-foreground">{log.user.email}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs italic">Unknown/System</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate text-sm" title={log.details || ''}>
                                        {log.details || '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                        {log.ipAddress || '-'}
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
