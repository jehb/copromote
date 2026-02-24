'use client'

import { useState } from 'react'
import { Plus, UserPlus } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createUser } from '@/app/actions/admin-users'

export function NewUserDialog({ roles }: { roles: { id: string, name: string }[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError('')

        const res = await createUser(formData)

        if (res.success) {
            setOpen(false)
        } else {
            setError(res.message || 'Failed to create user')
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    New User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form action={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                            Create a new user account. They will be forced to change their password on first login.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && (
                            <div className="text-sm font-medium text-red-500 bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" placeholder="John Doe" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" name="username" placeholder="jdoe" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select name="role" defaultValue="USER">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(r => (
                                        <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create User'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
