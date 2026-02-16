export const dynamic = "force-dynamic"
import { getProjects } from '@/app/actions/projects'
import { getHyperlinks } from '@/app/actions/hyperlinks'
import { QuickLinks } from '@/components/dashboard/quick-links'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowRight, BarChart3, Clock, Layout, LayoutDashboard } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

export default async function DashboardPage() {
  const projects = await getProjects()
  const hyperlinks = await getHyperlinks()
  const activeProjects = projects.filter(p => p.status === 'active')

  return (
    <div className="p-8 space-y-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            Dashboard
          </span>
        }
      />

      <QuickLinks hyperlinks={hyperlinks} />

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Layout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">current active campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.reduce((acc, p) => acc + p._count.assets, 0)}
            </div>
            <p className="text-xs text-muted-foreground">across all projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">scheduled this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.slice(0, 5).map(project => (
              <div key={project.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div>
                  <div className="font-semibold">{project.name}</div>
                  <div className="text-sm text-muted-foreground">{project.description}</div>
                </div>
                <Button variant="ghost" asChild>
                  <Link href={`/projects/${project.id}`}>
                    View <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
            {projects.length === 0 && <p className="text-muted-foreground">No projects yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
