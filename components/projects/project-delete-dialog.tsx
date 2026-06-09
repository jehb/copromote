'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteProject } from '@/app/actions/projects'
import { useRouter } from 'next/navigation'
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
} from "@/components/ui/alert-dialog"

interface ProjectDeleteDialogProps {
    projectId: string
    projectName: string
    variant?: 'icon' | 'default' | 'outline'
    className?: string
}

export function ProjectDeleteDialog({ projectId, projectName, variant = 'icon', className }: ProjectDeleteDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deleteProject(projectId)
            router.push('/projects')
        } catch (error) {
            console.error('Failed to delete project:', error)
            alert('Failed to delete project. Please check permissions.')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {variant === 'icon' ? (
                    <Button variant="ghost" size="icon" aria-label="Delete Project" title="Delete Project" className={className || "h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button variant={variant} className={className}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the project
                        "<strong>{projectName}</strong>" and all related tasks, assets, and events.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Project'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
