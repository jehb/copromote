import { getPromotion, updatePromotion } from '@/app/actions/promotions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default async function EditPromotionPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const promotion = await getPromotion(id)

    if (!promotion) notFound()

    const startDate = promotion.startDate.toISOString().split('T')[0]
    const endDate = promotion.endDate.toISOString().split('T')[0]

    return (
        <div className="max-w-2xl mx-auto p-8 space-y-8">
            <Link href={`/promotions/${id}`} className="text-muted-foreground hover:text-foreground flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Promotion Details
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle>Edit Promotion</CardTitle>
                    <CardDescription>Update the details of your marketing campaign.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updatePromotion.bind(null, id)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Promotion Name</Label>
                            <Input id="name" name="name" defaultValue={promotion.name} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input type="date" id="startDate" name="startDate" defaultValue={startDate} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input type="date" id="endDate" name="endDate" defaultValue={endDate} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 border-t pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="adLiveDate">Ad Live Date</Label>
                                <Input type="date" id="adLiveDate" name="adLiveDate" defaultValue={promotion.adLiveDate ? promotion.adLiveDate.toISOString().split('T')[0] : ''} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="adImageDeadline">Image Deadline</Label>
                                <Input type="date" id="adImageDeadline" name="adImageDeadline" defaultValue={promotion.adImageDeadline ? promotion.adImageDeadline.toISOString().split('T')[0] : ''} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="adPublishingDeadline">Publishing Deadline</Label>
                                <Input type="date" id="adPublishingDeadline" name="adPublishingDeadline" defaultValue={promotion.adPublishingDeadline ? promotion.adPublishingDeadline.toISOString().split('T')[0] : ''} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" asChild>
                                <Link href={`/promotions/${id}`}>Cancel</Link>
                            </Button>
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
