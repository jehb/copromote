import { Suspense } from 'react'
import { getLocations } from '@/app/actions/locations'
import { LocationForm } from '@/components/locations/location-form'
import { LocationList } from '@/components/locations/location-list'
import { MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LocationsPage() {
    const locations = await getLocations()

    return (
        <div className="p-8 space-y-8 bg-slate-50/30 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <MapPin className="h-8 w-8 text-blue-600" />
                        Locations
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage venues and event locations.</p>
                </div>
                <LocationForm />
            </div>

            <Suspense fallback={<div className="text-center py-10">Loading locations...</div>}>
                <LocationList locations={locations} />
            </Suspense>
        </div>
    )
}
