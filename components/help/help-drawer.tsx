'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { HelpCircle, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const helpContent: Record<string, string> = {}

// Map routes to help files
const routeToHelpFile: Record<string, string> = {
    '/': '/docs/help/dashboard.md',
    '/projects': '/docs/help/projects.md',
    '/products': '/docs/help/products.md',
    '/tasks': '/docs/help/tasks.md',
    '/calendar': '/docs/help/calendar.md',
    '/promotions': '/docs/help/promotions.md',
    '/social': '/docs/help/social.md',
    '/events': '/docs/help/events.md',
    '/gallery': '/docs/help/gallery.md',
    '/contacts': '/docs/help/contacts.md',
    '/organizations': '/docs/help/organizations.md',
    '/settings': '/docs/help/settings.md',
    '/admin': '/docs/help/admin.md',
}

export function HelpDrawer() {
    const [isOpen, setIsOpen] = useState(false)
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const pathname = usePathname()

    // Load help content based on current route
    useEffect(() => {
        if (!isOpen) return

        const loadHelpContent = async () => {
            setLoading(true)

            // Determine which help file to load
            let helpFile = '/docs/help/general.md'

            // Exact match
            if (routeToHelpFile[pathname]) {
                helpFile = routeToHelpFile[pathname]
            } else {
                // Check for sub-routes (e.g., /projects/123 -> /projects)
                // We check fairly simply by looking for partial matches
                // Longer keys first to handle specificity if needed, but for now exact or prefix
                const matchedRoute = Object.keys(routeToHelpFile).find(route =>
                    pathname !== '/' && route !== '/' && pathname.startsWith(route)
                )

                if (matchedRoute) {
                    helpFile = routeToHelpFile[matchedRoute]
                } else if (pathname.startsWith('/admin')) {
                    helpFile = '/docs/help/admin.md'
                }
            }

            // Check if already cached
            if (helpContent[helpFile]) {
                setContent(helpContent[helpFile])
                setLoading(false)
                return
            }

            try {
                // Ensure we are in a browser environment
                if (typeof window === 'undefined') return

                const response = await fetch(helpFile)
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const text = await response.text()
                helpContent[helpFile] = text
                setContent(text)
            } catch (error) {
                console.error('Failed to load help content:', error)
                setContent('# documentation unavailable\n\nCould not load help content. Please ensure you are online.')
            } finally {
                setLoading(false)
            }
        }

        loadHelpContent()
    }, [isOpen, pathname])

    // Keyboard shortcut: ? or Ctrl+/
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '?' || (e.ctrlKey && e.key === '/')) {
                e.preventDefault()
                setIsOpen(prev => !prev)
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen])

    return (
        <>
            {/* Help Button - Fixed position */}
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all p-0"
                title="Help (Press ? or Ctrl+/)"
            >
                <HelpCircle className="h-6 w-6 text-white" />
            </Button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <HelpCircle className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-slate-900">Help & Documentation</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOpen(false)}
                        className="h-8 w-8 p-0 rounded-full hover:bg-slate-200"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="h-[calc(100%-80px)] overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600 prose-strong:text-slate-900 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-slate-50">
                    <p className="text-xs text-slate-500 text-center">
                        Press <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 font-mono">?</kbd> or{' '}
                        <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 font-mono">Ctrl+/</kbd> to toggle help
                    </p>
                </div>
            </div>
        </>
    )
}
