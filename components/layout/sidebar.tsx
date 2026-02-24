'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Calendar, MessageSquare, Calendar as CalendarIcon, CheckSquare, Images, Users, Building2, Menu, X, Megaphone, Shield, Package, Bot, Mail, Palette, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import React, { useState } from 'react'
import { logout } from '@/app/actions/auth'
import { CommandMenu } from '@/components/search/command-menu'

type NavItem = {
    name: string
    href?: string
    icon: any
    items?: NavItem[]
}

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Promotions', href: '/promotions', icon: Megaphone },
    {
        name: 'Marketing',
        icon: TrendingUp,
        items: [
            { name: 'Events', href: '/events', icon: CalendarIcon },
            { name: 'Gallery', href: '/gallery', icon: Images },
            { name: 'Asset Editor', href: '/asset-editor', icon: Palette },
            { name: 'Social Media', href: '/social', icon: MessageSquare },
            { name: 'Email Planner', href: '/email-planner', icon: Mail },
        ]
    },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Organizations', href: '/organizations', icon: Building2 },
    { name: 'AI Assistant', href: '/chat', icon: Bot },
    { name: 'Admin', href: '/admin', icon: Shield },
]

export function Sidebar({ disabledPages = [] }: { disabledPages?: string[] }) {
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)

    // Filter out disabled items before continuing
    const filteredNavigation = React.useMemo(() => {
        return navigation.map(item => {
            if (item.items) {
                // If it's a group item, filter its children
                const filteredChildren = item.items.filter(child => {
                    const pageKey = child.href?.replace('/', '') || ''
                    return !disabledPages.includes(pageKey)
                })
                return { ...item, items: filteredChildren }
            }
            return item
        }).filter(item => {
            if (item.items) {
                // If it's a group and all children are filtered out, hide the group
                return item.items.length > 0
            }
            const pageKey = item.href?.replace('/', '') || ''
            // Special cases: Dashboard handles root /
            if (pageKey === '') return true
            return !disabledPages.includes(pageKey)
        })
    }, [disabledPages])

    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
        const isMarketingActive = filteredNavigation.find(n => n.name === 'Marketing')?.items?.some(item => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href!)))
        return {
            Marketing: !!isMarketingActive
        }
    })

    const toggleGroup = (name: string) => {
        if (isDesktopCollapsed) {
            setIsDesktopCollapsed(false)
            setOpenGroups(prev => ({ ...prev, [name]: true }))
        } else {
            setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }))
        }
    }

    // Hide sidebar on auth pages
    if (pathname === '/login' || pathname === '/change-password') {
        return null
    }

    return (
        <>
            {/* Mobile hamburger button */}
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center gap-4 p-4 bg-slate-900 text-white shrink-0">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-1 rounded-md hover:bg-slate-800"
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
                <div className="font-bold text-xl">Co+promote</div>
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
                    "flex h-full flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out",
                    // Mobile: slide in/out
                    "fixed lg:relative z-40",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                    isDesktopCollapsed ? "w-64 lg:w-16" : "w-64"
                )}>
                <div className={cn("flex h-16 items-center shrink-0", isDesktopCollapsed ? "justify-center px-0" : "justify-between px-6")}>
                    {!isDesktopCollapsed && <span className="font-bold text-xl">Co+promote</span>}
                    <button
                        onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                        className="hidden lg:flex p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white items-center justify-center shrink-0"
                        title={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
                <div className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto overflow-x-hidden">
                    <div className={cn("mb-4", isDesktopCollapsed ? "px-2" : "px-3")}>
                        <CommandMenu isCollapsed={isDesktopCollapsed} />
                    </div>
                    {filteredNavigation.map((item) => {
                        if (item.items) {
                            const isGroupOpen = openGroups[item.name]
                            const isAnyChildActive = item.items.some(child => pathname === child.href || (child.href !== '/' && pathname.startsWith(child.href!)))

                            return (
                                <div key={item.name} className="flex flex-col">
                                    <button
                                        onClick={() => toggleGroup(item.name)}
                                        title={isDesktopCollapsed ? item.name : undefined}
                                        className={cn(
                                            "flex items-center gap-3 rounded-md transition-colors hover:bg-slate-800",
                                            isDesktopCollapsed ? "justify-center px-0 py-2 w-10 h-10 mx-auto" : "px-3 py-2 text-sm font-medium w-full justify-between",
                                            isAnyChildActive ? "text-white" : "text-slate-400"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={cn("shrink-0", isDesktopCollapsed ? "h-6 w-6" : "h-5 w-5")} />
                                            {!isDesktopCollapsed && <span>{item.name}</span>}
                                        </div>
                                        {!isDesktopCollapsed && (
                                            isGroupOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                                        )}
                                    </button>

                                    {isGroupOpen && !isDesktopCollapsed && (
                                        <div className="flex flex-col gap-1 mt-1 ml-4 pl-4 border-l border-slate-800">
                                            {item.items.map((child) => {
                                                const isChildActive = pathname === child.href || (child.href !== '/' && pathname.startsWith(child.href!))
                                                return (
                                                    <Link
                                                        key={child.name}
                                                        href={child.href!}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className={cn(
                                                            "flex items-center gap-3 rounded-md transition-colors hover:bg-slate-800 px-3 py-2 text-sm font-medium",
                                                            isChildActive ? "bg-primary text-primary-foreground" : "text-slate-400"
                                                        )}
                                                    >
                                                        <child.icon className="h-4 w-4 shrink-0" />
                                                        <span>{child.name}</span>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        }

                        const isActive = item.href && (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
                        return (
                            <Link
                                key={item.name}
                                href={item.href!}
                                onClick={() => setIsMobileMenuOpen(false)}
                                title={isDesktopCollapsed ? item.name : undefined}
                                className={cn(
                                    "flex items-center gap-3 rounded-md transition-colors hover:bg-slate-800",
                                    isDesktopCollapsed ? "justify-center px-0 py-2 w-10 h-10 mx-auto" : "px-3 py-2 text-sm font-medium",
                                    isActive ? "bg-primary text-primary-foreground" : "text-slate-400"
                                )}
                            >
                                <item.icon className={cn("shrink-0", isDesktopCollapsed ? "h-6 w-6" : "h-5 w-5")} />
                                {!isDesktopCollapsed && <span>{item.name}</span>}
                            </Link>
                        )
                    })}
                </div>
                <div className="p-4">
                    <div className="flex flex-col gap-2">
                        <form action={logout}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "gap-2 text-slate-400 hover:text-white hover:bg-slate-800",
                                    isDesktopCollapsed ? "w-10 h-10 p-0 mx-auto justify-center flex" : "w-full justify-start"
                                )}
                                type="submit"
                                title={isDesktopCollapsed ? "Sign Out" : undefined}
                            >
                                <Users className={cn("shrink-0", isDesktopCollapsed ? "h-6 w-6" : "h-4 w-4")} />
                                {!isDesktopCollapsed && <span>Sign Out</span>}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}
