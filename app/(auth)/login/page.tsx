'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// Initial state must match the return type of the action
const initialState = {
    message: '',
    errors: undefined,
}

export default function LoginPage() {
    const [state, action, pending] = useActionState(login, initialState)

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-slate-900">Sign in to Promoty</CardTitle>
                    <CardDescription className="text-center text-slate-500">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={action} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                name="username"
                                placeholder="Enter your username"
                                required
                                disabled={pending}
                                className="bg-white"
                            />
                            {state?.errors?.username && (
                                <p className="text-sm text-red-500">{state.errors.username[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Enter your password"
                                required
                                disabled={pending}
                                className="bg-white"
                            />
                            {state?.errors?.password && (
                                <p className="text-sm text-red-500">{state.errors.password[0]}</p>
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
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
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
