'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, Sparkles, Globe, Key, Cpu, Loader2, MessageSquare } from 'lucide-react'
import { getConfig, updateConfig } from '@/app/actions/settings'
import { testAIConnection, fetchLocalModels, fetchGeminiModels } from '@/app/actions/ai'
import { Link2 } from 'lucide-react'
import Link from 'next/link'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// NCG Brand Colors
const THEMES = [
    { name: 'NCG Dark Green (Default)', primary: '#007934', secondary: '#7AB800' },
    { name: 'NCG Light Green', primary: '#7AB800', secondary: '#007934' },
    { name: 'NCG Orange', primary: '#FF5800', secondary: '#FFA100' },
    { name: 'NCG Dark Purple', primary: '#622567', secondary: '#B382C7' },
    { name: 'NCG Dark Blue', primary: '#005293', secondary: '#00B0CA' },
    { name: 'NCG Red', primary: '#D50032', secondary: '#1e1e1e' },
]

export default function SettingsPage() {
    const [primaryColor, setPrimaryColor] = useState('#007934')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const savedPrimary = localStorage.getItem('theme-primary')
        if (savedPrimary) {
            setPrimaryColor(savedPrimary)
        }
    }, [])

    const handleThemeChange = (color: string) => {
        setPrimaryColor(color)
        localStorage.setItem('theme-primary', color)
        document.documentElement.style.setProperty('--primary', color)
        document.documentElement.style.setProperty('--ring', color)
        document.documentElement.style.setProperty('--sidebar-primary', color)
        document.documentElement.style.setProperty('--sidebar-ring', color)
    }

    if (!mounted) return null

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Settings</h1>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>
                            Customize the look and feel of the application.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <Label>Theme Color</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {THEMES.map((theme) => (
                                    <button
                                        key={theme.primary}
                                        onClick={() => handleThemeChange(theme.primary)}
                                        className={`
                                            relative flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all hover:bg-slate-50
                                            ${primaryColor === theme.primary ? 'border-primary bg-slate-50' : 'border-transparent'}
                                        `}
                                    >
                                        <div
                                            className="h-10 w-full rounded-md shadow-sm border"
                                            style={{ backgroundColor: theme.primary }}
                                        />
                                        <span className="text-xs font-medium text-slate-600 text-center">{theme.name}</span>
                                        {primaryColor === theme.primary && (
                                            <div className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-sm">
                                                <Check className="h-3 w-3 text-primary" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-slate-50 border space-y-4">
                            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Preview</div>
                            <div className="flex gap-4">
                                <Button>Primary Button</Button>
                                <Button variant="secondary">Secondary Button</Button>
                                <Button variant="outline">Outline Button</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>AI Configuration</CardTitle>
                        <CardDescription>
                            Configure your AI provider for suggestions and automation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AIConfig />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>External Product Database</CardTitle>
                        <CardDescription>
                            Configure the connection to your external product database (JDBC compatible).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DatabaseConfig />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>WordPress Integration</CardTitle>
                        <CardDescription>
                            Connect your WordPress site to enable content syncing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <WordPressConfig />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Immich Integration</CardTitle>
                        <CardDescription>
                            Connect your Immich server for native gallery integration.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ImmichConfig />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Postiz Integration</CardTitle>
                        <CardDescription>
                            Connect your Postiz instance for social media scheduling.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PostizConfig />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Profile Settings</CardTitle>
                        <CardDescription>Manage your user profile information.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">User profile management is coming soon.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>API Key Management</CardTitle>
                        <CardDescription>
                            Generate and manage programmatic access keys for integrations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <Button asChild>
                            <Link href="/admin/settings/api-keys">
                                <Key className="mr-2 h-4 w-4" />
                                Manage API Keys
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function AIConfig() {
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'testing', message: string } | null>(null)

    const handleTest = async () => {
        setSaving(true)
        setStatus({ type: 'testing', message: 'Testing AI Connection...' })
        try {
            const { testAIConnection } = await import('@/app/actions/ai')
            const result = await testAIConnection()
            if (result.success) {
                setStatus({ type: 'success', message: `Verified: ${result.message}` })
            } else {
                setStatus({ type: 'error', message: `Error: ${result.message}` })
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: 'Failed to run test.' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="p-4 bg-slate-50 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                    AI configuration is now managed via environment variables (<code>.env</code> file).
                </p>
                <ul className="text-xs text-slate-500 mt-2 list-disc list-inside">
                    <li>AI_PROVIDER</li>
                    <li>AI_MODEL</li>
                    <li>AI_API_KEY</li>
                    <li>AI_BASE_URL</li>
                    <li>AI_CHAT_INSTRUCTIONS</li>
                </ul>
            </div>

            <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={handleTest} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Test Connection
                </Button>
                {status && (
                    <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
                        status.type === 'testing' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                        {status.type === 'success' ? <Check className="h-4 w-4 mt-0.5 shrink-0" /> :
                            status.type === 'testing' ? <Loader2 className="h-4 w-4 mt-0.5 shrink-0 animate-spin" /> :
                                <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />}
                        <div className="flex-1">
                            <p className="font-medium text-xs">{status.type === 'success' ? 'Configuration Verified' : status.type === 'testing' ? 'Verifying...' : 'Configuration Error'}</p>
                            <p className="text-[11px] opacity-90 mt-0.5">{status.message}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function DatabaseConfig() {
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    const handleTest = async () => {
        setSaving(true)
        try {
            const { testExternalConnection } = await import('@/app/actions/external-db')
            const res = await testExternalConnection()
            setStatus({ type: res.success ? 'success' : 'error', message: res.message })
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Failed to run test.' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="p-4 bg-slate-50 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                    Database configuration is now managed via environment variables (<code>.env</code> file).
                </p>
                <ul className="text-xs text-slate-500 mt-2 list-disc list-inside">
                    <li>EXTERNAL_DB_TYPE</li>
                    <li>EXTERNAL_DB_URL</li>
                    <li>EXTERNAL_DB_NAME</li>
                    <li>EXTERNAL_DB_USER</li>
                    <li>EXTERNAL_DB_PASSWORD</li>
                </ul>
            </div>

            <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={handleTest} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Test Connection
                </Button>
                {status && (
                    <span className={`text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {status.message}
                    </span>
                )}
            </div>
        </div>
    )
}

function WordPressConfig() {
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    const handleTest = async () => {
        setSaving(true)
        setStatus(null)
        try {
            const { testWordPressConnection } = await import('@/app/actions/wordpress')
            const res = await testWordPressConnection()
            setStatus({ type: res.success ? 'success' : 'error', message: res.message })
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Failed to run test.' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="p-4 bg-slate-50 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                    WordPress configuration is now managed via environment variables (<code>.env</code> file).
                </p>
                <ul className="text-xs text-slate-500 mt-2 list-disc list-inside">
                    <li>WORDPRESS_URL</li>
                    <li>WORDPRESS_USERNAME</li>
                    <li>WORDPRESS_APP_PASSWORD</li>
                </ul>
            </div>

            <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={handleTest} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Test Connection
                </Button>
                {status && (
                    <span className={`text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {status.message}
                    </span>
                )}
            </div>
        </div>
    )
}

function ImmichConfig() {
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    const handleTest = async () => {
        setSaving(true)
        setStatus(null)
        try {
            const { testImmichConnection } = await import('@/app/actions/immich')
            const res = await testImmichConnection()
            setStatus({ type: res.success ? 'success' : 'error', message: res.message })
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Failed to run test.' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="p-4 bg-slate-50 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                    Immich configuration is now managed via environment variables (<code>.env</code> file).
                </p>
                <ul className="text-xs text-slate-500 mt-2 list-disc list-inside">
                    <li>IMMICH_URL</li>
                    <li>IMMICH_API_KEY</li>
                </ul>
            </div>

            <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={handleTest} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Test Connection
                </Button>
                {status && (
                    <span className={`text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {status.message}
                    </span>
                )}
            </div>
        </div>
    )
}

function PostizConfig() {
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    const handleTest = async () => {
        setSaving(true)
        setStatus(null)
        try {
            const { testPostizConnection } = await import('@/app/actions/postiz')
            const res = await testPostizConnection()
            setStatus({ type: res.success ? 'success' : 'error', message: res.message })
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Failed to run test.' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="p-4 bg-slate-50 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                    Postiz configuration is now managed via environment variables (<code>.env</code> file).
                </p>
                <ul className="text-xs text-slate-500 mt-2 list-disc list-inside">
                    <li>POSTIZ_URL</li>
                    <li>POSTIZ_API_KEY</li>
                </ul>
            </div>

            <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={handleTest} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Test Connection
                </Button>
                {status && (
                    <span className={`text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {status.message}
                    </span>
                )}
            </div>
        </div>
    )
}
