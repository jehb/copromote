import { getUsers, deleteUser } from '@/app/actions/admin-users'
import { getContacts } from '@/app/actions/contacts'
import { getRoles } from '@/app/actions/admin-roles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import { Trash2, Shield, User as UserIcon, Link as LinkIcon } from 'lucide-react'
import { NewUserDialog } from './new-user-dialog'
import { DeleteUserDialog } from './delete-user-dialog'
import { EditUserDialog } from './edit-user-dialog'

// Forces dynamic rendering
export const dynamic = 'force-dynamic'

export default async function UsersPage() {
    // ⚡ Bolt: Execute independent data fetching concurrently to improve TTFB
    const [users, contacts, roles] = await Promise.all([getUsers(), getContacts(), getRoles()])

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-muted-foreground">Manage system access and user accounts.</p>
                </div>
                <NewUserDialog roles={roles} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>System Users</CardTitle>
                    <CardDescription>
                        A list of all users with access to the system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Linked Contact</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <UserAvatar
                                            name={user.name}
                                            email={user.email}
                                            avatarUrl={user.avatar}
                                            className="h-9 w-9"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.name}</span>
                                            <span className="text-sm text-muted-foreground">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            {user.role === 'ADMIN' ? <Shield className="h-3.5 w-3.5 text-indigo-600" /> : <UserIcon className="h-3.5 w-3.5 text-slate-500" />}
                                            <span className="text-sm font-medium capitalize">{user.role?.toLowerCase() || 'user'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.contact ? (
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <LinkIcon className="h-3.5 w-3.5 text-blue-500" />
                                                <span>{user.contact.firstName} {user.contact.lastName}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic">None</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <EditUserDialog user={user} contacts={contacts} roles={roles} />
                                            {user.username === 'admin' ? (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground opacity-50 cursor-not-allowed"
                                                    disabled
                                                    title="Cannot delete admin user"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <DeleteUserDialog userId={user.id} username={user.username} />
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
