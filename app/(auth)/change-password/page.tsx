'use client'

import { useActionState } from 'react'
import { changePassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Loader2, Lock } from 'lucide-react'

const initialState = {
    message: '',
    errors: undefined,
}

export default function ChangePasswordPage() {
    const [state, action, pending] = useActionState(changePassword, initialState)

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                            <Lock className="h-6 w-6 text-amber-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-slate-900">Change Password Required</CardTitle>
                    <CardDescription className="text-center text-slate-500">
                        For your security, please update your password to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={action} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                placeholder="Enter current password"
                                required
                                disabled={pending}
                                className="bg-white"
                            />
                            {state?.errors?.currentPassword && (
                                <p className="text-sm text-red-500">{state.errors.currentPassword[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                placeholder="Enter new password (min 6 chars)"
                                required
                                disabled={pending}
                                className="bg-white"
                            />
                            {state?.errors?.newPassword && (
                                <p className="text-sm text-red-500">{state.errors.newPassword[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                required
                                disabled={pending}
                                className="bg-white"
                            />
                            {state?.errors?.confirmPassword && (
                                <p className="text-sm text-red-500">{state.errors.confirmPassword[0]}</p>
                            )}
                        </div>

                        {state?.message && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-600 text-center">{state.message}</p>
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={pending}>
                            {pending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Password & Sign In'
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t border-slate-100 py-4">
                    <p className="text-xs text-slate-400">Promoty Secure Access</p>
                </CardFooter>
            </Card>
        </div>
    )
}
