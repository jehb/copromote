import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Users, Shield } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/admin/settings">
                    <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-primary" />
                                Settings
                            </CardTitle>
                            <CardDescription>
                                Configure application preferences, AI providers, and themes.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/admin/users">
                    <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-slate-500" />
                                User Management
                            </CardTitle>
                            <CardDescription>
                                Manage users and permissions.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/admin/logs">
                    <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-slate-500" />
                                Security Logs
                            </CardTitle>
                            <CardDescription>
                                View system access logs and security events.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
