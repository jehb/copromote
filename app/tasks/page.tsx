export const dynamic = "force-dynamic"
import { getTasks } from '@/app/actions/tasks'
import { getUsers } from '@/app/actions/events'
import { getProjects } from '@/app/actions/projects'
import { TaskBoard } from '@/components/tasks/task-board'
import { TaskDialog } from '@/components/tasks/task-dialog'
import { Button } from '@/components/ui/button'
import { Plus, CheckSquare } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

export default async function TasksPage() {
    const tasks = await getTasks()
    const users = await getUsers()
    const projects = await getProjects()

    return (
        <div className="p-4 md:p-8 space-y-8 h-[calc(100vh-60px)] flex flex-col">
            <PageHeader
                title={
                    <span className="flex items-center gap-2">
                        <CheckSquare className="h-6 w-6" />
                        Tasks
                    </span>
                }
                description="Manage your team's tasks and workload"
                actions={
                    <TaskDialog
                        users={users}
                        trigger={
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Create Task
                            </Button>
                        }
                    />
                }
                className="flex-shrink-0"
            />

            <div className="flex-1 min-h-0">
                <TaskBoard tasks={tasks} users={users} projects={projects} />
            </div>
        </div>
    )
}
