'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Calendar, MessageSquare, Calendar as CalendarIcon, CheckSquare, Images, Users, Building2, Menu, X, Megaphone, Shield, Package, Bot, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { logout } from '@/app/actions/auth'
import { CommandMenu } from '@/components/search/command-menu'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Promotions', href: '/promotions', icon: Megaphone },
    { name: 'Social Media', href: '/social', icon: MessageSquare },
    { name: 'Events', href: '/events', icon: CalendarIcon },
    { name: 'Gallery', href: '/gallery', icon: Images },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Organizations', href: '/organizations', icon: Building2 },
    { name: 'AI Assistant', href: '/chat', icon: Bot },
    { name: 'Admin', href: '/admin', icon: Shield },
    { name: 'Email Planner', href: '/email-planner', icon: Mail },
]

export function Sidebar() {
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Hide sidebar on auth pages
    if (pathname === '/login' || pathname === '/change-password') {
        return null
    }

    return (
        <>
            {/* Mobile hamburger button */}
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900 text-white shrink-0">
                <div className="font-bold text-xl">Promoty</div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-1 rounded-md hover:bg-slate-800"
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                data-testid="sidebar"
                className={cn(
                    "flex h-full w-64 flex-col bg-slate-900 text-white transition-transform duration-300 ease-in-out",
                    // Desktop: always visible
                    "lg:translate-x-0",
                    // Mobile: slide in/out
                    "fixed lg:relative z-40",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                <div className="flex h-16 items-center px-6 font-bold text-xl">
                    Promoty
                </div>
                <div className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
                    <div className="px-3 mb-4">
                        <CommandMenu />
                    </div>
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800",
                                    isActive ? "bg-primary text-primary-foreground" : "text-slate-400"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        )
                    })}
                </div>
                <div className="p-4">
                    <div className="flex flex-col gap-2">
                        <form action={logout}>
                            <Button
                                variant="ghost"
                                className="w-full gap-2 text-slate-400 hover:text-white hover:bg-slate-800 justify-start"
                                type="submit"
                            >
                                <Users className="h-4 w-4" />
                                Sign Out
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}
