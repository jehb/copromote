'use client'

import React, { useState, useTransition } from 'react'
import { DeletedItemsResponse, restoreItem, deleteItemForever } from '@/app/actions/deleted-items'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RotateCcw, Trash2, Calendar, Folder, CheckSquare, MessageSquare, Building2, User } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
    initialData: DeletedItemsResponse
}

type EntityType = 'project' | 'task' | 'event' | 'contact' | 'organization' | 'socialPost'

export function DeletedItemsHub({ initialData }: Props) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<EntityType>('project')
    const [isPending, startTransition] = useTransition()
    const [data, setData] = useState<DeletedItemsResponse>(initialData)

    // Sync state with server action fetch results when path is revalidated
    React.useEffect(() => {
        setData(initialData)
    }, [initialData])

    const tabs: { value: EntityType; label: string; icon: React.ReactNode; count: number }[] = [
        { value: 'project', label: 'Projects', icon: <Folder className="h-4 w-4" />, count: data.projects.length },
        { value: 'task', label: 'Tasks', icon: <CheckSquare className="h-4 w-4" />, count: data.tasks.length },
        { value: 'event', label: 'Events', icon: <Calendar className="h-4 w-4" />, count: data.events.length },
        { value: 'contact', label: 'CRM Contacts', icon: <User className="h-4 w-4" />, count: data.contacts.length },
        { value: 'organization', label: 'Organizations', icon: <Building2 className="h-4 w-4" />, count: data.organizations.length },
        { value: 'socialPost', label: 'Social Posts', icon: <MessageSquare className="h-4 w-4" />, count: data.socialPosts.length },
    ]

    const handleRestore = async (type: EntityType, id: string) => {
        if (confirm("Are you sure you want to restore this item? It will immediately return to its original place.")) {
            startTransition(async () => {
                try {
                    const res = await restoreItem(type, id)
                    if (res.success) {
                        toast.success("Item successfully restored!")
                        router.refresh()
                    }
                } catch (e: any) {
                    toast.error(e.message || "Failed to restore item")
                }
            })
        }
    }

    const handleDeleteForever = async (type: EntityType, id: string) => {
        if (confirm("WARNING: This action is permanent and CANNOT be undone! Are you absolutely sure you want to delete this item forever?")) {
            startTransition(async () => {
                try {
                    const res = await deleteItemForever(type, id)
                    if (res.success) {
                        toast.success("Item permanently deleted forever!")
                        router.refresh()
                    }
                } catch (e: any) {
                    toast.error(e.message || "Failed to permanently delete item")
                }
            })
        }
    }

    const getActiveList = () => {
        switch (activeTab) {
            case 'project': return data.projects
            case 'task': return data.tasks
            case 'event': return data.events
            case 'contact': return data.contacts
            case 'organization': return data.organizations
            case 'socialPost': return data.socialPosts
            default: return []
        }
    }

    const activeList = getActiveList()

    return (
        <div className="space-y-6">
            {/* Tabs Navigation */}
            <div className="flex flex-wrap gap-2 border-b pb-4">
                {tabs.map((tab) => (
                    <Button
                        key={tab.value}
                        variant={activeTab === tab.value ? 'default' : 'ghost'}
                        onClick={() => setActiveTab(tab.value)}
                        className="flex items-center gap-2"
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                        <Badge variant={activeTab === tab.value ? 'secondary' : 'outline'} className="ml-1">
                            {tab.count}
                        </Badge>
                    </Button>
                ))}
            </div>

            {/* List Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="capitalize">{activeTab.replace('socialPost', 'Social Post')}s Trash Bin</CardTitle>
                    <CardDescription>
                        Review and restore soft-deleted {activeTab.replace('socialPost', 'social post')}s or permanently remove them from the database.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {activeList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-slate-50/50">
                            <Trash2 className="h-10 w-10 text-muted-foreground opacity-50 mb-3" />
                            <h3 className="font-semibold text-lg">Trash is empty</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                No soft-deleted {activeTab.replace('socialPost', 'social post')}s found. Deleting items normally will place them here.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title/Name</TableHead>
                                        <TableHead>Date Deleted</TableHead>
                                        <TableHead>Deleted By</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeList.map((item) => (
                                        <TableRow key={item.id} className={isPending ? 'opacity-50 pointer-events-none' : ''}>
                                            <TableCell className="font-medium max-w-md truncate">
                                                {item.title}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(item.deletedAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <Badge variant="outline" className="font-normal">
                                                        {item.deletedByName}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
                                                        onClick={() => handleRestore(activeTab, item.id)}
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                        Restore
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-rose-600 hover:text-rose-700 flex items-center gap-1.5"
                                                        onClick={() => handleDeleteForever(activeTab, item.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete Forever
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
