'use client'

import { useState, useMemo } from 'react'

interface TaskBoardProps {
    tasks: any[]
    users: any[]
    projects: any[]
}

export function TaskBoard({ tasks, users, projects }: TaskBoardProps) {
    const [editingTask, setEditingTask] = useState<any>(null)

    // Memoize derived filtered arrays to prevent redundant O(N) recalculations on every re-render (e.g. when opening/closing the edit modal)
    const todoTasks = useMemo(() => tasks.filter(t => t.status === 'todo'), [tasks])
    const progressTasks = useMemo(() => tasks.filter(t => t.status === 'in-progress'), [tasks])
    const doneTasks = useMemo(() => tasks.filter(t => t.status === 'done'), [tasks])

    const TaskCard = ({ task }: { task: any }) => (
        <Card className="mb-3 hover:shadow-md transition-shadow group">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm line-clamp-2 leading-tight">{task.title}</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Task options">
                                <MoreHorizontal className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={(e) => {
                                e.preventDefault()
                                setEditingTask(task)
                            }}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-600 focus:text-red-600">
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {task.project && (
                    <div className="mb-2">
                        <Badge variant="outline" className="text-[10px] h-4 py-0 font-normal border-blue-100 bg-blue-50/50 text-blue-700">
                            {task.project.name}
                        </Badge>
                    </div>
                )}

                {task.description && (
                    <div className="text-xs text-slate-500 mb-3 whitespace-pre-wrap">
                        {task.description.split(/(\[.*?\]\(.*?\))/g).map((part: string, i: number) => {
                            const match = part.match(/\[(.*?)\]\((.*?)\)/)
                            if (match) {
                                return (
                                    <a
                                        key={i}
                                        href={match[2]}
                                        className="text-primary hover:underline font-medium"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {match[1]}
                                    </a>
                                )
                            }
                            return part
                        })}
                    </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                        {task.dueDate && (
                            <div className={`flex items-center ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-red-500' : ''}`}>
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(task.dueDate), 'MMM d')}
                            </div>
                        )}
                        {task.assignee && (
                            <div className="flex items-center" title={task.assignee.name}>
                                <UserAvatar
                                    name={task.assignee.name}
                                    email={task.assignee.email}
                                    size={40}
                                    className="h-4 w-4 mr-1.5"
                                />
                                <span className="max-w-[60px] truncate">{task.assignee.name.split(' ')[0]}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Status Moves */}
                <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.status !== 'todo' && (
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => updateTaskStatus(task.id, 'todo')}>
                            To Do
                        </Button>
                    )}
                    {task.status !== 'in-progress' && (
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => updateTaskStatus(task.id, 'in-progress')}>
                            In Prog
                        </Button>
                    )}
                    {task.status !== 'done' && (
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => updateTaskStatus(task.id, 'done')}>
                            Done
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
            {/* To-Do Column */}
            <div className="flex flex-col h-full bg-slate-50/30 rounded-lg border border-slate-100">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-slate-50/30 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                        <h3 className="font-semibold text-sm text-slate-900">To Do</h3>
                        <Badge variant="secondary" className="text-xs h-5 px-1.5 min-w-[20px] justify-center bg-slate-100 text-slate-700">{todoTasks.length}</Badge>
                    </div>
                    <TaskDialog users={users} projects={projects} defaultStatus="todo" trigger={<Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-slate-100 text-slate-700" aria-label="Add task to To Do"><Plus className="h-4 w-4" /></Button>} />
                </div>
                <div className="p-3 overflow-y-auto flex-1">
                    {todoTasks.map(task => <TaskCard key={task.id} task={task} />)}
                </div>
            </div>

            {/* In Progress Column */}
            <div className="flex flex-col h-full bg-blue-50/30 rounded-lg border border-blue-100">
                <div className="p-4 border-b border-blue-100 flex justify-between items-center sticky top-0 bg-blue-50/30 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <h3 className="font-semibold text-sm text-blue-900">In Progress</h3>
                        <Badge variant="secondary" className="text-xs h-5 px-1.5 min-w-[20px] justify-center bg-blue-100 text-blue-700">{progressTasks.length}</Badge>
                    </div>
                    <TaskDialog users={users} projects={projects} defaultStatus="in-progress" trigger={<Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-blue-100 text-blue-700" aria-label="Add task to In Progress"><Plus className="h-4 w-4" /></Button>} />
                </div>
                <div className="p-3 overflow-y-auto flex-1">
                    {progressTasks.map(task => <TaskCard key={task.id} task={task} />)}
                </div>
            </div>

            {/* Done Column */}
            <div className="flex flex-col h-full bg-green-50/30 rounded-lg border border-green-100">
                <div className="p-4 border-b border-green-100 flex justify-between items-center sticky top-0 bg-green-50/30 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <h3 className="font-semibold text-sm text-green-900">Done</h3>
                        <Badge variant="secondary" className="text-xs h-5 px-1.5 min-w-[20px] justify-center bg-green-100 text-green-700">{doneTasks.length}</Badge>
                    </div>
                    <TaskDialog users={users} projects={projects} defaultStatus="done" trigger={<Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-green-100 text-green-700" aria-label="Add task to Done"><Plus className="h-4 w-4" /></Button>} />
                </div>
                <div className="p-3 overflow-y-auto flex-1">
                    {doneTasks.map(task => <TaskCard key={task.id} task={task} />)}
                </div>
            </div>

            {/* Central Edit Dialog */}
            <TaskDialog
                users={users}
                projects={projects}
                task={editingTask}
                open={!!editingTask}
                onOpenChange={(open) => !open && setEditingTask(null)}
            />
        </div>
    )
}

import { TaskDialog } from './task-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Calendar, MoreHorizontal } from 'lucide-react'
import { UserAvatar } from '@/components/ui/user-avatar'
import { deleteTask, updateTaskStatus } from '@/app/actions/tasks'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function Plus({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
    )
}
