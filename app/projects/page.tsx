export const dynamic = 'force-dynamic'
import { getProjects } from '@/app/actions/projects'
import { getMyRole } from '@/app/actions/user-role'
import { ProjectsClientPage } from '@/components/projects/projects-client-page'

export default async function ProjectsPage() {
    const projects = await getProjects()
    const role = await getMyRole()

    return <ProjectsClientPage initialProjects={projects} userRole={role} />
}
