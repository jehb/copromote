'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { deleteRole } from '@/app/actions/admin-roles'
import { toast } from 'sonner'

export function DeleteRoleDialog({ roleName }: { roleName: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleConfirm() {
        setLoading(true)

        const res = await deleteRole(roleName)

        if (res.success) {
            toast.success('Role deleted successfully.')
            setOpen(false)
        } else {
            toast.error(res.message || 'Failed to delete role')
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500 rounded-full" title="Delete role">
                    <Trash2 className="h-3 w-3" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Delete Role</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete the <strong>{roleName}</strong> role? This action cannot be undone.
                        You can only delete this role if no users are currently assigned to it.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
                        {loading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
