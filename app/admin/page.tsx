import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Users, Shield, Database, Activity, Link2, MapPin, Palette, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/layout/protected-route'

export default function AdminPage() {
    return (
        <ProtectedRoute pageName="admin">
            <div className="p-8 space-y-8">
                <PageHeader
                    title={
                        <span className="flex items-center gap-2">
                            <Shield className="h-6 w-6" />
                            Admin Dashboard
                        </span>
                    }
                />

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
                                    <Users className="h-5 w-5 text-indigo-600" />
                                    User Management
                                </CardTitle>
                                <CardDescription>
                                    Manage users and roles.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/admin/permissions">
                        <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-purple-600" />
                                    Role Permissions
                                </CardTitle>
                                <CardDescription>
                                    Enable or disable application pages by user role.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/admin/data">
                        <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"> {/* Database icon needs import if not globally available, but likely is or will use Lucide */}
                                    <Database className="h-5 w-5 text-emerald-600" />
                                    Data Hub
                                </CardTitle>
                                <CardDescription>
                                    Export system data and manage records.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/admin/activity">
                        <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-amber-600" />
                                    Activity Logs
                                </CardTitle>
                                <CardDescription>
                                    Track business actions and entity changes.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/admin/hyperlinks">
                        <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Link2 className="h-5 w-5 text-blue-600" />
                                    Hyperlinks
                                </CardTitle>
                                <CardDescription>
                                    Manage external resources and shortcuts.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/admin/security">
                        <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full border-blue-100 hover:border-blue-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-blue-600 animate-pulse" style={{ animationDuration: '3s' }} />
                                    Security Center
                                </CardTitle>
                                <CardDescription>
                                    Manage IP whitelisting and two-factor authentication (2FA) rules.
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

                    <Link href="/admin/locations">
                        <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-red-600" />
                                    Locations
                                </CardTitle>
                                <CardDescription>
                                    Manage venues and event locations.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/admin/color-palettes">
                        <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Palette className="h-5 w-5 text-pink-500" />
                                    Color Palettes
                                </CardTitle>
                                <CardDescription>
                                    Manage predefined color palettes used in the Asset Editor.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/admin/deleted-items">
                        <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trash2 className="h-5 w-5 text-rose-600" />
                                    Deleted Items Hub
                                </CardTitle>
                                <CardDescription>
                                    Review, restore, or permanently delete soft-deleted records.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                </div>
            </div>
        </ProtectedRoute>
    )
}
