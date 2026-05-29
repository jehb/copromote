'use client'

import { createProject } from '@/app/actions/projects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProjectPage() {
    const [startDate, setStartDate] = useState<Date>()
    const [endDate, setEndDate] = useState<Date>()

    // We need to inject the dates into the form data properly or handle submission manually.
    // Using a hidden input or client-side handler.

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Create New Project</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                    <CardDescription>Enter the basic information for your marketing project.</CardDescription>
                </CardHeader>
                <form action={createProject}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Project Name</Label>
                            <Input id="name" name="name" required placeholder="e.g. Summer Campaign 2024" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" placeholder="Brief overview of the project goals..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <DatePicker date={startDate} setDate={setStartDate} />
                                <input type="hidden" name="startDate" value={startDate?.toISOString() || ''} />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date (Optional)</Label>
                                <DatePicker date={endDate} setDate={setEndDate} />
                                <input type="hidden" name="endDate" value={endDate?.toISOString() || ''} />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="ghost" type="button" onClick={() => window.history.back()}>Cancel</Button>
                        <Button type="submit">Create Project</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
