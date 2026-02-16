import { getProject, updateProject } from '@/app/actions/projects'
import { getUsers } from '@/app/actions/events'
import { getCurrentUser } from '@/lib/user-util'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { createAsset, deleteAsset } from '@/app/actions/assets'
import { updateTaskStatus, deleteTask } from '@/app/actions/tasks'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Link as LinkIcon, FileText, Image as ImageIcon, Video, CheckCircle2, Circle, Clock, User as UserIcon, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TaskDialog } from '@/components/tasks/task-dialog'
import { AuditInfo } from '@/components/common/audit-info'
import { Settings } from 'lucide-react'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const [project, users, currentUser] = await Promise.all([
        getProject(id),
        getUsers(),
        getCurrentUser()
    ])

    if (!project) notFound()

    const completedTasks = project.tasks.filter((t: any) => t.status === 'done').length
    const totalTasks = project.tasks.length
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Navigation */}
            <Link href="/projects" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
            </Link>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-bold tracking-tight">{project.name}</h1>
                        <div className="flex items-center gap-2">
                            <Badge className="uppercase tracking-wider" variant={project.status === 'active' ? 'default' : 'secondary'}>
                                {project.status}
                            </Badge>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Project</DialogTitle>
                                        <DialogDescription>Update project details and status.</DialogDescription>
                                    </DialogHeader>
                                    <form action={updateProject.bind(null, project.id)} className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Project Name</Label>
                                            <Input id="name" name="name" defaultValue={project.name} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Input id="description" name="description" defaultValue={project.description || ''} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="startDate">Start Date</Label>
                                                <Input id="startDate" name="startDate" type="date" defaultValue={format(new Date(project.startDate), 'yyyy-MM-dd')} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="endDate">End Date (Optional)</Label>
                                                <Input id="endDate" name="endDate" type="date" defaultValue={project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : ''} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status</Label>
                                            <Select name="status" defaultValue={project.status}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="archived">Archived</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button type="submit" className="w-full">Save Changes</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                    <p className="text-muted-foreground text-lg max-w-2xl">{project.description}</p>
                </div>

                <Card className="w-full md:w-auto min-w-[240px]">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Timeline
                                </span>
                            </div>
                            <div className="text-sm font-medium">
                                {format(new Date(project.startDate), 'MMM d, yyyy')} - {project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : 'Ongoing'}
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium uppercase tracking-tighter">
                                    <span>Project Progress</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border">
                                    <div
                                        className="bg-blue-600 h-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            {currentUser?.role === 'ADMIN' && (
                                <AuditInfo
                                    createdAt={project.createdAt}
                                    updatedAt={project.updatedAt}
                                    createdBy={project.createdBy}
                                    updatedBy={project.updatedBy}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Tasks */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            Tasks
                            <Badge variant="outline" className="ml-2 font-normal">{totalTasks}</Badge>
                        </h2>
                        <TaskDialog users={users} projectId={project.id} />
                    </div>

                    <div className="space-y-3">
                        {project.tasks.map((task: any) => (
                            <Card key={task.id} className="group hover:shadow-md transition-shadow overflow-hidden">
                                <div className="flex items-center gap-4 p-4">
                                    <form action={updateTaskStatus.bind(null, task.id, task.status === 'done' ? 'todo' : 'done')}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={task.status === 'done' ? 'text-green-600 hover:text-green-700' : 'text-slate-300 hover:text-slate-400'}
                                        >
                                            {task.status === 'done' ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                                        </Button>
                                    </form>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-semibold truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                                {task.title}
                                            </h3>
                                            <Badge variant="outline" className="text-[10px] h-5 capitalize">
                                                {task.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                            {task.assignee && (
                                                <span className="flex items-center gap-1">
                                                    <UserIcon className="h-3 w-3" /> {task.assignee.name}
                                                </span>
                                            )}
                                            {task.dueDate && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {format(new Date(task.dueDate), 'MMM d')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TaskDialog users={users} task={task} trigger={
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <LinkIcon className="h-4 w-4" />
                                            </Button>
                                        } />
                                        <form action={deleteTask.bind(null, task.id)}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {project.tasks.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50/50">
                                <div className="text-muted-foreground">No tasks for this project yet.</div>
                                <div className="mt-4">
                                    <TaskDialog users={users} projectId={project.id} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar - Assets */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-semibold">Assets</h2>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">Add</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Asset</DialogTitle>
                                    <DialogDescription>Link an asset to this project.</DialogDescription>
                                </DialogHeader>
                                <form action={createAsset} className="space-y-4 pt-4">
                                    <input type="hidden" name="projectId" value={project.id} />
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Asset Name</Label>
                                        <Input id="name" name="name" required placeholder="e.g. Campaign Banner" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Type</Label>
                                        <Select name="type" required defaultValue="image">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="image">Image</SelectItem>
                                                <SelectItem value="video">Video</SelectItem>
                                                <SelectItem value="document">Document</SelectItem>
                                                <SelectItem value="link">External Link</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="url">URL / Path</Label>
                                        <Input id="url" name="url" required placeholder="https://..." />
                                    </div>
                                    <Button type="submit" className="w-full">Add Asset</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {project.assets.map((asset: any) => (
                            <div key={asset.id} className="flex items-center justify-between p-3 border rounded-xl bg-white shadow-sm group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        {asset.type === 'image' && <ImageIcon className="h-4 w-4 text-blue-500" />}
                                        {asset.type === 'video' && <Video className="h-4 w-4 text-red-500" />}
                                        {asset.type === 'document' && <FileText className="h-4 w-4 text-orange-500" />}
                                        {asset.type === 'link' && <LinkIcon className="h-4 w-4 text-slate-500" />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium text-sm truncate">{asset.name}</div>
                                        <a href={asset.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline truncate block">
                                            {(() => {
                                                try {
                                                    return new URL(asset.url).hostname;
                                                } catch (e) {
                                                    return asset.name || 'External Link';
                                                }
                                            })()}
                                        </a>
                                    </div>
                                </div>
                                <form action={deleteAsset.bind(null, asset.id, project.id)}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </form>
                            </div>
                        ))}
                        {project.assets.length === 0 && (
                            <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl bg-slate-50/50">
                                No assets added yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    )
}
