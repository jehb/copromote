export const dynamic = 'force-dynamic'
import { getProjects } from '@/app/actions/projects'
import { ProjectsClientPage } from '@/components/projects/projects-client-page'

export default async function ProjectsPage() {
    const projects = await getProjects()

    return <ProjectsClientPage initialProjects={projects} />
}
