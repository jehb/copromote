import { getWhitelistedIps, addWhitelistedIp, deleteWhitelistedIp, getCurrentUserIp } from '@/app/actions/security-center'
import { getSecurityLogs } from '@/app/actions/admin-logs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProtectedRoute } from '@/components/layout/protected-route'
import Link from 'next/link'
import { ArrowLeft, Shield, Trash2, Network, Plus, ShieldCheck, ShieldAlert, Key } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SecurityCenterPage() {
    const [detectedIp, whitelistedIps, logs] = await Promise.all([
        getCurrentUserIp(),
        getWhitelistedIps(),
        getSecurityLogs(),
    ])

    // Filter recent security logs related to authentication (limit to 10)
    const recentLogs = logs
        .filter(log => ['LOGIN', 'FAILED_LOGIN', '2FA_REQUIRED', 'LOGIN_2FA_SUCCESS'].includes(log.action))
        .slice(0, 10)

    // Check if the current IP is already whitelisted
    const isCurrentIpWhitelisted = whitelistedIps.some(ip => ip.ipAddress === detectedIp)

    return (
        <ProtectedRoute pageName="admin">
            <div className="p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="outline" size="icon" aria-label="Back to admin dashboard">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Shield className="h-8 w-8 text-blue-600" />
                            Security Center
                        </h1>
                        <p className="text-muted-foreground">Manage IP address whitelisting and view recent login events.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Left Column: Detected IP & Add IP Form */}
                    <div className="space-y-6 md:col-span-1">
                        {/* Detected IP Card */}
                        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                    <Network className="h-4 w-4 text-blue-600" />
                                    Detected Connection IP
                                </CardTitle>
                                <CardDescription className="text-xs">Your current connection IP address.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-2xl font-mono font-bold text-slate-900 bg-white px-3 py-2 rounded-md border border-slate-100 shadow-sm text-center">
                                    {detectedIp}
                                </div>
                                {!isCurrentIpWhitelisted ? (
                                    <form action={addWhitelistedIp}>
                                        <input type="hidden" name="ipAddress" value={detectedIp} />
                                        <input type="hidden" name="description" value="Admin current connection (Quick Whitelist)" />
                                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm text-xs py-2">
                                            Whitelist My Current IP
                                        </Button>
                                    </form>
                                ) : (
                                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 py-2 rounded-md border border-emerald-100">
                                        <ShieldCheck className="h-4 w-4" />
                                        Your IP is Whitelisted
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Add IP Form Card */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                    <Plus className="h-4 w-4 text-slate-600" />
                                    Add Whitelisted IP
                                </CardTitle>
                                <CardDescription className="text-xs">Allow password-only logins from this IP.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form action={addWhitelistedIp} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ipAddress" className="text-xs font-medium text-slate-600">IP Address</Label>
                                        <Input
                                            id="ipAddress"
                                            name="ipAddress"
                                            placeholder="e.g. 192.168.1.1"
                                            required
                                            className="text-sm py-1"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="description" className="text-xs font-medium text-slate-600">Description</Label>
                                        <Input
                                            id="description"
                                            name="description"
                                            placeholder="e.g. Office Network"
                                            className="text-sm py-1"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-xs py-2 shadow-sm">
                                        Add to Whitelist
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Whitelist Table */}
                    <div className="md:col-span-2">
                        <Card className="shadow-sm h-full">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-slate-800">Whitelisted IP Addresses</CardTitle>
                                <CardDescription className="text-xs">
                                    Connections from these IPs bypass two-factor authentication. If this list is empty, 2FA is required for all connections.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border border-slate-100 rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="text-xs font-semibold text-slate-600">IP Address</TableHead>
                                                <TableHead className="text-xs font-semibold text-slate-600">Description</TableHead>
                                                <TableHead className="text-xs font-semibold text-slate-600">Added On</TableHead>
                                                <TableHead className="w-[80px] text-right"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {whitelistedIps.map((ip) => {
                                                const deleteAction = deleteWhitelistedIp.bind(null, ip.id)
                                                return (
                                                    <TableRow key={ip.id} className="hover:bg-slate-50/50">
                                                        <TableCell className="font-mono text-sm text-slate-800 font-medium">
                                                            {ip.ipAddress}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-slate-600">
                                                            {ip.description || <span className="text-slate-400 italic text-xs">No description</span>}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-slate-400">
                                                            {new Date(ip.createdAt).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <form action={deleteAction}>
                                                                <Button
                                                                    type="submit"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                                    title="Remove from whitelist"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </form>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                            {whitelistedIps.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-sm text-slate-400 italic">
                                                        No IP addresses whitelisted. 2FA is currently required for all logins.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Login Security Logs */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Key className="h-5 w-5 text-blue-600" />
                            Recent Login Activity
                        </CardTitle>
                        <CardDescription className="text-xs">Recent authentication attempts and 2FA status events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="text-xs font-semibold text-slate-600">Time</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600">Event</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600">User</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-600">Details</TableHead>
                                    <TableHead className="text-right text-xs font-semibold text-slate-600">IP Address</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentLogs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-mono text-xs text-slate-400">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                {log.action === 'LOGIN' || log.action === 'LOGIN_2FA_SUCCESS' ? (
                                                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                                ) : log.action === 'FAILED_LOGIN' ? (
                                                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                                                ) : (
                                                    <Shield className="h-4 w-4 text-blue-500" />
                                                )}
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-slate-50 text-slate-700">
                                                    {log.action}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-slate-700">
                                            {log.user ? log.user.username : <span className="text-slate-400 italic">Unknown</span>}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500">
                                            {log.details}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs text-slate-500">
                                            {log.ipAddress || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {recentLogs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6 text-sm text-slate-400 italic">
                                            No recent authentication logs.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </ProtectedRoute>
    )
}
