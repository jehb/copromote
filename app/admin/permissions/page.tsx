'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Shield, Loader2 } from 'lucide-react'
import { getRolePermissions, updateRolePermission } from '@/app/actions/admin-permissions'
import { getRoles } from '@/app/actions/admin-roles'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from "@/components/ui/card"
import { CreateRoleDialog } from './create-role-dialog'
import { DeleteRoleDialog } from './delete-role-dialog'

const SYSTEM_PAGES = [
    'admin',
    'calendar',
    'chat',
    'contacts',
    'email-planner',
    'events',
    'gallery',
    'organizations',
    'products',
    'projects',
    'promotions',
    'social',
    'tasks'
]

type PermissionMap = {
    [role: string]: {
        [page: string]: boolean
    }
}

type Role = {
    id: string
    name: string
    description: string | null
    isSystem: boolean
}

export default function AdminPermissionsPage() {
    const [roles, setRoles] = useState<Role[]>([])
    const [permissions, setPermissions] = useState<PermissionMap>({})
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [rolesData, permissionsData] = await Promise.all([
                getRoles(),
                getRolePermissions()
            ])

            setRoles(rolesData)

            // Reconstruct the map with default true for missing records
            const map: PermissionMap = {}
            rolesData.forEach((role: Role) => {
                map[role.name] = {}
                SYSTEM_PAGES.forEach(page => {
                    const record = permissionsData.find((p: { role: string; page: string; isEnabled: boolean }) => p.role === role.name && p.page === page)
                    // Admins always defaults to true in logic, but UI should reflect that or disable toggle
                    map[role.name][page] = record ? record.isEnabled : true
                })
            })
            setPermissions(map)
        } catch (error) {
            console.error('Failed to load permissions:', error)
            toast.error('Failed to load role permissions')
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggle = async (role: string, page: string, currentVal: boolean) => {
        if (role === 'ADMIN') {
            toast.info("Admin permissions cannot be disabled.")
            return
        }

        const newVal = !currentVal

        // Optimistic UI update
        setPermissions(prev => ({
            ...prev,
            [role]: {
                ...prev[role],
                [page]: newVal
            }
        }))

        try {
            const result = await updateRolePermission(role, page, newVal)
            if (result.success) {
                toast.success(`Permission updated for ${role} on ${page}`)
            } else {
                throw new Error(result.error || 'Failed to update')
            }
        } catch (error) {
            // Revert on error
            setPermissions(prev => ({
                ...prev,
                [role]: {
                    ...prev[role],
                    [page]: currentVal
                }
            }))
            toast.error('Failed to update permission')
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title={
                    <span className="flex items-center gap-2">
                        <Shield className="h-6 w-6" />
                        Role Permissions
                    </span>
                }
                description="Manage roles and their access to specific application pages."
                actions={<CreateRoleDialog />}
            />

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px] align-bottom">Page</TableHead>
                                {roles.map(role => (
                                    <TableHead key={role.name} className="text-center align-bottom pb-4">
                                        <div className="flex flex-col items-center justify-end h-full gap-2">
                                            <div className="flex items-center whitespace-nowrap gap-1">
                                                <span>{role.name}</span>
                                                {!role.isSystem && (
                                                    <DeleteRoleDialog roleName={role.name} />
                                                )}
                                            </div>
                                            {role.isSystem && (
                                                <span className="text-[10px] text-muted-foreground font-normal tracking-wide uppercase">System</span>
                                            )}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {SYSTEM_PAGES.map(page => (
                                <TableRow key={page}>
                                    <TableCell className="font-medium capitalize">{page.replace('-', ' ')}</TableCell>
                                    {roles.map(role => (
                                        <TableCell key={`${role.name}-${page}`} className="text-center">
                                            <Switch
                                                checked={permissions[role.name]?.[page] ?? true}
                                                onCheckedChange={() => handleToggle(role.name, page, permissions[role.name]?.[page] ?? true)}
                                                disabled={role.name === 'ADMIN'}
                                                aria-label={`Toggle ${page} access for ${role.name}`}
                                            />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
