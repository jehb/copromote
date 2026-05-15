'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { createTheme, updateTheme } from '@/app/actions/theme'
import { toast } from 'sonner'
import { DatePicker } from '@/components/ui/date-picker'

export function ThemeForm({ theme, onSuccess }: { theme?: any, onSuccess: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [name, setName] = useState(theme?.name || '')
    const [description, setDescription] = useState(theme?.description || '')
    const [startDate, setStartDate] = useState<Date | undefined>(theme?.startDate ? new Date(theme?.startDate) : undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(theme?.endDate ? new Date(theme?.endDate) : undefined)
    const [isRecurring, setIsRecurring] = useState(theme?.isRecurring ?? true)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !startDate || !endDate) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsSubmitting(true)
        try {
            const data = {
                name,
                description,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                isRecurring
            }

            if (theme?.id) {
                await updateTheme(theme.id, data)
                toast.success('Theme updated')
            } else {
                await createTheme(data)
                toast.success('Theme created')
            }
            onSuccess()
        } catch (error) {
            toast.error('An error occurred while saving the theme')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input 
                    id="name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. Back to School"
                    required
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                    id="description" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Brief details about this theme"
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex flex-col">
                    <Label>Start Date *</Label>
                    <DatePicker date={startDate} setDate={setStartDate} />
                </div>
                <div className="space-y-2 flex flex-col">
                    <Label>End Date *</Label>
                    <DatePicker date={endDate} setDate={setEndDate} />
                </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                    id="isRecurring" 
                    checked={isRecurring} 
                    onCheckedChange={(c) => setIsRecurring(!!c)} 
                />
                <Label htmlFor="isRecurring" className="cursor-pointer">
                    Recurring yearly
                </Label>
            </div>

            <div className="flex justify-end pt-4 gap-2">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Theme'}
                </Button>
            </div>
        </form>
    )
}
