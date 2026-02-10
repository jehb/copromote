'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteUser } from '@/app/actions/admin-users'

interface DeleteUserDialogProps {
    userId: string
    username: string
}

export function DeleteUserDialog({ userId, username }: DeleteUserDialogProps) {
    const [open, setOpen] = useState(false)
    const [confirmText, setConfirmText] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleDelete() {
        if (confirmText !== 'DELETE') return

        setLoading(true)
        await deleteUser(userId)
        setLoading(false)
        setOpen(false)
        setConfirmText('')
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete user"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user
                        <span className="font-bold text-foreground mx-1">{username}</span>
                        and remove their data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="confirm" className="mb-2 block text-sm">
                        Type <span className="font-bold">DELETE</span> to confirm
                    </Label>
                    <Input
                        id="confirm"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="w-full"
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
                    <Button
                        variant="destructive"
                        disabled={confirmText !== 'DELETE' || loading}
                        onClick={handleDelete}
                    >
                        {loading ? 'Deleting...' : 'Delete User'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
