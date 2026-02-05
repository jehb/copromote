'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { createTask, updateTask } from '@/app/actions/tasks'
import { Plus } from 'lucide-react'

interface TaskDialogProps {
    users: any[]
    task?: any
    trigger?: React.ReactNode
    defaultStatus?: string
    projectId?: string
    projects?: any[]
}

export function TaskDialog({ users, task, trigger, defaultStatus = 'todo', projectId, projects = [] }: TaskDialogProps) {
    const [open, setOpen] = useState(false)
    const isEditing = !!task

    const handleSubmit = async (formData: FormData) => {
        if (isEditing) {
            await updateTask(task.id, formData)
        } else {
            await createTask(formData)
        }
        setOpen(false)
    }

    const formatForInput = (date: Date) => {
        return date ? format(new Date(date), "yyyy-MM-dd'T'HH:mm") : ''
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Task
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Task' : 'Create Task'}</DialogTitle>
                </DialogHeader>

                <form action={handleSubmit} className="grid gap-4 py-4">
                    <input type="hidden" name="projectId" value={projectId || task?.projectId || ''} />
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" defaultValue={task?.title} required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" defaultValue={task?.description} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" defaultValue={task?.status || defaultStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todo">Todo</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input
                                id="dueDate"
                                name="dueDate"
                                type="datetime-local"
                                defaultValue={task?.dueDate ? formatForInput(task.dueDate) : ''}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="assignee">Assignee</Label>
                        <Select name="assigneeId" defaultValue={task?.assigneeId || 'none'}>
                            <SelectTrigger>
                                <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Unassigned</SelectItem>
                                {users.map((user: any) => (
                                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {!projectId && projects.length > 0 && (
                        <div className="grid gap-2">
                            <Label htmlFor="projectId">Project</Label>
                            <Select name="projectId" defaultValue={task?.projectId || 'none'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="No Project" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Project</SelectItem>
                                    {projects.map((project: any) => (
                                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
