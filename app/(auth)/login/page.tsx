'use client'

import { useActionState, useState } from 'react'
import { login } from '@/app/actions/auth'
import { sendMagicLink } from '@/app/actions/magic-link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// Initial state must match the return type of the action
type ActionState = {
    message: string
    errors?: {
        [key: string]: string[]
    }
    success?: boolean
}

const initialState: ActionState = {
    message: '',
    errors: undefined,
}

export default function LoginPage() {
    const [isMagicLink, setIsMagicLink] = useState(false)
    const [state, action, pending] = useActionState(login, initialState)
    const [magicLinkState, magicLinkAction, magicLinkPending] = useActionState(sendMagicLink, initialState)

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-slate-900">Sign in to Co+promote</CardTitle>
                    <CardDescription className="text-center text-slate-500">
                        {isMagicLink ? 'We\'ll send a magic link to your email' : 'Enter your credentials to access your account'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!isMagicLink ? (
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
                    ) : (
                        <form action={magicLinkAction} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    disabled={magicLinkPending}
                                    className="bg-white"
                                />
                                {magicLinkState?.errors?.email && (
                                    <p className="text-sm text-red-500">{magicLinkState.errors.email[0]}</p>
                                )}
                            </div>

                            {magicLinkState?.message && (
                                <div className={`p-3 rounded-md border ${magicLinkState.success ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                                    <p className="text-sm text-center">{magicLinkState.message}</p>
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={magicLinkPending}>
                                {magicLinkPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending Link...
                                    </>
                                ) : (
                                    'Send Magic Link'
                                )}
                            </Button>
                        </form>
                    )}

                    <div className="mt-4 text-center">
                        <Button
                            variant="link"
                            onClick={() => setIsMagicLink(!isMagicLink)}
                            className="text-sm text-slate-500 hover:text-blue-600"
                        >
                            {isMagicLink ? 'Sign in with password' : 'Sign in with email'}
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="justify-center border-t border-slate-100 py-4">
                    <p className="text-xs text-slate-400">Co+promote Secure Access</p>
                </CardFooter>
            </Card>
        </div>
    )
}
