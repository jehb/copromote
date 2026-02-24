export const dynamic = 'force-dynamic'
import { getProjects } from '@/app/actions/projects'
import { getMyRole } from '@/app/actions/user-role'
import { ProjectsClientPage } from '@/components/projects/projects-client-page'

import { ProtectedRoute } from '@/components/layout/protected-route'

export default async function ProjectsPage() {
    const projects = await getProjects()
    const role = await getMyRole()

    return (
        <ProtectedRoute pageName="projects">
            <ProjectsClientPage initialProjects={projects} userRole={role} />
        </ProtectedRoute>
    )
}
