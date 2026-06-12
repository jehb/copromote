'use client'

import { useActionState, useEffect, useState, useRef } from 'react'
import { verifyTwoFactorCode, getPending2faSessionDetails, resendTwoFactorCode } from '@/app/actions/security-center'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Loader2, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, Toaster } from 'sonner'

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

export default function Verify2faPage() {
    const [state, action, pending] = useActionState(verifyTwoFactorCode, initialState)
    const [expiresAt, setExpiresAt] = useState<number | null>(null)
    const [timeLeft, setTimeLeft] = useState<number>(0)
    const [resending, setResending] = useState(false)
    const [email, setEmail] = useState<string | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // Load initial expiry on mount
    useEffect(() => {
        const loadSessionDetails = async () => {
            try {
                const details = await getPending2faSessionDetails()
                if (details) {
                    if (details.twoFactorExpiresAt) {
                        setExpiresAt(details.twoFactorExpiresAt)
                    }
                    if (details.email) {
                        setEmail(details.email)
                    }
                }
            } catch (err) {
                console.error('Failed to load session details:', err)
            }
        }
        loadSessionDetails()
    }, [])

    // Manage countdown timer
    useEffect(() => {
        if (!expiresAt) return

        const updateTimer = () => {
            const now = Date.now()
            const diff = Math.max(0, Math.floor((expiresAt - now) / 1000))
            setTimeLeft(diff)

            if (diff <= 0 && timerRef.current) {
                clearInterval(timerRef.current)
            }
        }

        // Run once immediately
        updateTimer()

        // Tick every second
        timerRef.current = setInterval(updateTimer, 1000)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [expiresAt])

    const handleResend = async () => {
        if (timeLeft > 0 || resending) return

        setResending(true)
        try {
            const res = await resendTwoFactorCode()
            if (res.success && res.twoFactorExpiresAt) {
                setExpiresAt(res.twoFactorExpiresAt)
                toast.success('New verification code generated!')
            } else {
                toast.error(res.message || 'Failed to resend code.')
            }
        } catch (err) {
            console.error(err)
            toast.error('An error occurred. Please try again.')
        } finally {
            setResending(false)
        }
    }

    // Format minutes and seconds
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    // Calculate percentage for circular progress ring (5 minutes = 300 seconds max)
    const maxTime = 300
    const progress = Math.min(100, (timeLeft / maxTime) * 100)
    const strokeDashoffset = 113 - (113 * progress) / 100 // 113 is circumference for r=18

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-4 relative overflow-hidden">
            <Toaster position="top-center" richColors />
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[8000ms]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[6000ms]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md z-10"
            >
                <Card className="w-full shadow-2xl border border-white/5 bg-slate-900/60 backdrop-blur-xl text-slate-100">
                    <CardHeader className="space-y-1 pb-4">
                        <div className="flex justify-center mb-4">
                            <motion.div 
                                initial={{ scale: 0.5, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl shadow-inner"
                            >
                                <ShieldCheck className="h-10 w-10" />
                            </motion.div>
                        </div>
                        <CardTitle className="text-3xl font-extrabold text-center tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-white bg-clip-text text-transparent">
                            Security Verification
                        </CardTitle>
                        <CardDescription className="text-center text-slate-400 text-sm max-w-sm mx-auto">
                            {email ? (
                                <>A login attempt was detected from a new IP for <span className="text-blue-300 font-semibold">{email}</span>. Please verify your identity.</>
                            ) : (
                                <>A login attempt was detected from a new IP. Please verify your identity.</>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Countdown Circular Timer */}
                        {expiresAt && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-2"
                            >
                                <div className="relative flex items-center justify-center">
                                    <svg className="w-20 h-20 transform -rotate-90">
                                        {/* Background Circle */}
                                        <circle
                                            cx="40"
                                            cy="40"
                                            r="18"
                                            className="stroke-slate-800"
                                            strokeWidth="3.5"
                                            fill="transparent"
                                        />
                                        {/* Progress Circle */}
                                        <motion.circle
                                            cx="40"
                                            cy="40"
                                            r="18"
                                            className="stroke-blue-500"
                                            strokeWidth="3.5"
                                            fill="transparent"
                                            strokeDasharray="113"
                                            initial={{ strokeDashoffset: 113 }}
                                            animate={{ strokeDashoffset }}
                                            transition={{ ease: 'linear' }}
                                        />
                                    </svg>
                                    <span className="absolute text-sm font-mono font-bold text-slate-200">{formattedTime}</span>
                                </div>
                                <span className="text-xs text-slate-500 mt-2 font-medium">
                                    {timeLeft > 0 ? 'Code expires shortly' : 'Code expired'}
                                </span>
                            </motion.div>
                        )}

                        <form action={action} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    6-Digit Verification Code
                                </Label>
                                <Input
                                    id="code"
                                    name="code"
                                    type="text"
                                    placeholder="••••••"
                                    maxLength={6}
                                    pattern="\d{6}"
                                    required
                                    disabled={pending || timeLeft <= 0}
                                    className="bg-slate-950/50 border-white/10 text-center text-3xl tracking-[0.6em] font-mono py-7 placeholder:tracking-normal placeholder:font-sans placeholder:text-xl focus:border-blue-500/50 focus:ring-blue-500/20 text-white transition-all rounded-xl"
                                    autoFocus
                                />
                                <AnimatePresence>
                                    {state?.errors?.code && (
                                        <motion.p 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="text-xs text-red-400 text-center font-medium mt-1"
                                        >
                                            {state.errors.code[0]}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            <AnimatePresence>
                                {state?.message && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                                    >
                                        <p className="text-xs text-red-400 text-center font-medium">{state.message}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button 
                                type="submit" 
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-6 shadow-lg shadow-blue-500/20 rounded-xl transition-all"
                                disabled={pending || timeLeft <= 0}
                            >
                                {pending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying Code...
                                    </>
                                ) : (
                                    'Verify Identity'
                                )}
                            </Button>
                        </form>

                        {/* Resend Option */}
                        <div className="flex flex-col items-center justify-center pt-2">
                            <Button
                                variant="ghost"
                                disabled={timeLeft > 0 || resending}
                                onClick={handleResend}
                                className={`text-xs gap-2 font-semibold px-4 py-2 rounded-lg transition-all ${
                                    timeLeft > 0 
                                        ? 'text-slate-600 cursor-not-allowed hover:bg-transparent' 
                                        : 'text-blue-400 hover:text-blue-300 hover:bg-white/5'
                                }`}
                            >
                                {resending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-3.5 w-3.5" />
                                )}
                                {timeLeft > 0 ? `Resend available in ${formattedTime}` : 'Resend Verification Code'}
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-2 justify-center border-t border-white/5 py-4 bg-slate-950/20 rounded-b-2xl">
                        <form action={logout} className="w-full">
                            <Button
                                variant="ghost"
                                className="w-full text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 gap-2 py-4 rounded-xl"
                                type="submit"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Return to Login
                            </Button>
                        </form>
                        <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-widest font-bold">
                            Co+promote Secure Core
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
