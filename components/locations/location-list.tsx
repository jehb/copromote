'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteLocation } from '@/app/actions/locations'
import { Trash2, MapPin } from 'lucide-react'
import { LocationForm } from '@/components/locations/location-form'
import { toast } from 'sonner'

export function LocationList({ locations }: { locations: any[] }) {
    async function handleDelete(id: string) {
        const result = await deleteLocation(id)
        if (result.success) {
            toast.success('Location deleted')
        } else {
            toast.error(result.message || 'Failed to delete location')
        }
    }

    if (locations.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                No locations found. Create one to get started.
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
                <Card key={location.id} className="group relative hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <span className="p-2 bg-slate-100 rounded-md text-slate-600">
                                    <MapPin className="h-5 w-5" />
                                </span>
                                {location.name}
                            </CardTitle>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <LocationForm location={location} />
                                <form action={handleDelete.bind(null, location.id)}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                        title="Delete Location"
                                        type="submit"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            Used in <span className="font-medium text-foreground">{location._count.events}</span> events
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
