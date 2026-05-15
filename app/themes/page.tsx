export const dynamic = "force-dynamic"
import { getThemes } from '@/app/actions/theme'
import { PageHeader } from '@/components/ui/page-header'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { ThemeList } from '@/components/themes/theme-list'
import { Tags } from 'lucide-react'

export default async function ThemesPage() {
    const themes = await getThemes()

    return (
        <ProtectedRoute pageName="themes">
            <div className="p-8 space-y-8">
                <PageHeader
                    title={
                        <span className="flex items-center gap-2">
                            <Tags className="h-6 w-6" />
                            Themes
                        </span>
                    }
                    description="Manage recurring themes and multi-day calendar events."
                />
                
                <ThemeList initialThemes={themes} />
            </div>
        </ProtectedRoute>
    )
}
