export const dynamic = "force-dynamic"
import { getTasks } from '@/app/actions/tasks'
import { getUsers } from '@/app/actions/events'
import { getProjects } from '@/app/actions/projects'
import { TaskBoard } from '@/components/tasks/task-board'
import { TaskDialog } from '@/components/tasks/task-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function TasksPage() {
    const tasks = await getTasks()
    const users = await getUsers()
    const projects = await getProjects()

    return (
        <div className="p-8 space-y-8 h-[calc(100vh-60px)] flex flex-col">
            <div className="flex justify-between items-center flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold">Tasks</h1>
                    <p className="text-muted-foreground">Manage your team's tasks and workload</p>
                </div>
                <TaskDialog
                    users={users}
                    trigger={
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Task
                        </Button>
                    }
                />
            </div>

            <div className="flex-1 min-h-0">
                <TaskBoard tasks={tasks} users={users} projects={projects} />
            </div>
        </div>
    )
}
