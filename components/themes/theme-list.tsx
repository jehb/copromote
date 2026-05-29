'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { ThemeForm } from './theme-form'
import { deleteTheme } from '@/app/actions/theme'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export function ThemeList({ initialThemes }: { initialThemes: any[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [editingTheme, setEditingTheme] = useState<any>(null)
    const router = useRouter()

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this theme?')) return
        try {
            await deleteTheme(id)
            toast.success('Theme deleted')
            router.refresh()
        } catch (error) {
            toast.error('Failed to delete theme')
        }
    }

    const openEdit = (theme: any) => {
        setEditingTheme(theme)
        setIsOpen(true)
    }

    const onOpenChange = (open: boolean) => {
        setIsOpen(open)
        /* istanbul ignore if */
        if (!open) setEditingTheme(null)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => {
                    setEditingTheme(null)
                    setIsOpen(true)
                }}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Theme
                </Button>
            </div>

            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingTheme ? 'Edit Theme' : 'New Theme'}</DialogTitle>
                    </DialogHeader>
                    <ThemeForm 
                        theme={editingTheme} 
                        onSuccess={() => {
                            setIsOpen(false)
                            router.refresh()
                        }} 
                    />
                </DialogContent>
            </Dialog>

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialThemes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                                    No themes found.
                                </TableCell>
                            </TableRow>
                        )}
                        {initialThemes.map(theme => (
                            <TableRow key={theme.id}>
                                <TableCell>
                                    <div className="font-medium text-slate-900">{theme.name}</div>
                                    <div className="text-sm text-slate-500">{theme.description}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm" suppressHydrationWarning>
                                        {format(new Date(theme.startDate), 'MMM d, yyyy')} - {format(new Date(theme.endDate), 'MMM d, yyyy')}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {theme.isRecurring ? (
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Recurring</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-800 hover:bg-slate-100">One-time</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" type="button" onClick={() => openEdit(theme)}>
                                            <Edit className="h-4 w-4 text-slate-500" />
                                        </Button>
                                        <Button variant="ghost" size="sm" type="button" onClick={() => handleDelete(theme.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
