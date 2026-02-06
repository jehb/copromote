import { createPromotion } from '@/app/actions/promotions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewPromotionPage() {
    return (
        <div className="max-w-2xl mx-auto p-8 space-y-8">
            <Link href="/promotions" className="text-muted-foreground hover:text-foreground flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Promotions
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle>Create New Promotion</CardTitle>
                    <CardDescription>Define a marketing period to organize assets and social posts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={createPromotion} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Promotion Name</Label>
                            <Input id="name" name="name" placeholder="e.g., Summer Sale 2026" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input type="date" id="startDate" name="startDate" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input type="date" id="endDate" name="endDate" required />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" asChild>
                                <Link href="/promotions">Cancel</Link>
                            </Button>
                            <Button type="submit">Create Promotion</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
