'use client'

import { useQuery } from '@tanstack/react-query'
import { getProjects } from '@/app/actions/projects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'
import { Plus, ArrowRight, Loader2, FolderOpen, FolderKanban } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

interface ProjectsClientPageProps {
    initialProjects: any[]
}

export function ProjectsClientPage({ initialProjects }: ProjectsClientPageProps) {
    const { data: projects = initialProjects, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: () => getProjects(),
        initialData: initialProjects,
    })

    return (
        <div className="p-4 md:p-8 w-full">
            <PageHeader
                title={
                    <span className="flex items-center gap-2">
                        <FolderKanban className="h-6 w-6" />
                        Projects
                    </span>
                }
                description="Monitor your ongoing campaigns and active initiatives"
                actions={
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
                        <Link href="/projects/new">
                            <Plus className="h-4 w-4 md:mr-2" />
                            <span className="md:inline">New Project</span>
                        </Link>
                    </Button>
                }
                className="mb-4 md:mb-8"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project: any) => (
                    <Card key={project.id} className="hover:shadow-xl transition-all border-slate-200 shadow-sm overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-slate-50/50 border-b">
                            <CardTitle className="text-lg font-bold text-slate-900 line-clamp-1">{project.name}</CardTitle>
                            <Badge className="font-bold text-[10px] uppercase tracking-wider" variant={project.status === 'active' ? 'default' : 'secondary'}>
                                {project.status}
                            </Badge>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <p className="text-sm text-slate-500 mb-6 line-clamp-2 min-h-[2.5rem] font-medium">
                                {project.description || "No description provided."}
                            </p>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>Campaign Progress</span>
                                    <span className="text-blue-600">
                                        {(() => {
                                            const total = project._count.tasks;
                                            const completed = project.tasks.filter((t: any) => t.status === 'done').length;
                                            return total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%';
                                        })()}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                                    {(() => {
                                        const total = project._count.tasks;
                                        const completed = project.tasks.filter((t: any) => t.status === 'done').length;
                                        const percentage = total > 0 ? (completed / total) * 100 : 0;
                                        return (
                                            <div
                                                className="bg-blue-600 h-full transition-all duration-700 ease-out"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        );
                                    })()}
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Active Tasks</span>
                                        <span className="text-sm font-bold text-slate-700">{project._count.tasks}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Media Assets</span>
                                        <span className="text-sm font-bold text-slate-700">{project._count.assets}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between py-2 text-xs text-slate-500 font-medium bg-slate-50/50 px-3 rounded-lg border border-slate-100">
                                    <span>Timeline:</span>
                                    <span className="text-slate-700 font-bold">
                                        {format(new Date(project.startDate), 'MMM d')} - {project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : 'Ongoing'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-2 bg-slate-50/30">
                            <Button className="w-full group/btn bg-white hover:bg-slate-900 border-slate-200 text-slate-600 hover:text-white transition-all shadow-sm font-bold text-xs uppercase tracking-widest h-10" variant="outline" asChild>
                                <Link href={`/projects/${project.id}`}>
                                    Manage Project
                                    <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}

                {projects.length === 0 && !isLoading && (
                    <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="p-5 bg-slate-50 rounded-full mb-4">
                            <FolderOpen className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No active projects</h3>
                        <p className="text-slate-500 text-sm mb-6 font-medium">Create a project to start tracking your promotional health.</p>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700 h-10 px-6 rounded-xl font-bold">
                            <Link href="/projects/new">Start First Project</Link>
                        </Button>
                    </div>
                )}

                {isLoading && projects.length === 0 && (
                    <div className="col-span-full flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    </div>
                )}
            </div>
        </div>
    )
}
