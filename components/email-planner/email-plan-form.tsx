'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEmailPlan, updateEmailPlan } from '@/app/actions/email-plan'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface EmailPlanFormProps {
    initialData?: {
        id: string
        subject: string
        sendDate: Date
        notes: string | null
    }
}

export function EmailPlanForm({ initialData }: EmailPlanFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        subject: initialData?.subject || '',
        sendDate: initialData?.sendDate ? new Date(initialData.sendDate).toISOString().split('T')[0] : '',
        notes: initialData?.notes || '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const payload = {
                subject: formData.subject,
                sendDate: new Date(formData.sendDate),
                notes: formData.notes,
            }

            if (initialData) {
                const result = await updateEmailPlan(initialData.id, payload)
                if (!result.success) throw new Error(result.error)
            } else {
                const result = await createEmailPlan(payload)
                if (!result.success) throw new Error(result.error)
                if (result.data) {
                    router.push(`/email-planner/${result.data.id}`)
                }
            }
            router.refresh()
        } catch (err) {
            setError('Failed to save email plan')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{initialData ? 'Edit Email Plan' : 'Create Email Plan'}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject Line <span className="text-red-500">*</span></Label>
                        <Input
                            id="subject"
                            required
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="e.g. Monthly Newsletter"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sendDate">Planned Send Date <span className="text-red-500">*</span></Label>
                        <Input
                            id="sendDate"
                            type="date"
                            required
                            value={formData.sendDate}
                            onChange={(e) => setFormData({ ...formData, sendDate: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Any additional notes or context..."
                            rows={4}
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? 'Save Changes' : 'Create Plan'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
