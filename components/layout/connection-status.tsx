'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOfflineSync } from '@/components/providers/offline-sync-provider'

export function ConnectionStatus() {
    const { isOnline, pendingCount, isSyncing } = useOfflineSync()
    const [isVisible, setIsVisible] = useState(false)
    const [wasOffline, setWasOffline] = useState(false)

    useEffect(() => {
        if (!isOnline) {
            setIsVisible(true)
            setWasOffline(true)
        } else if (wasOffline && isOnline) {
            // Just came back online
            setIsVisible(true)
            setTimeout(() => {
                if (!isSyncing && pendingCount === 0) {
                    setIsVisible(false)
                    setWasOffline(false)
                }
            }, 3000)
        }
    }, [isOnline, isSyncing, pendingCount, wasOffline])

    // Show if offline, syncing, or has pending items
    const shouldShow = !isOnline || isSyncing || pendingCount > 0 || isVisible

    return (
        <AnimatePresence>
            {shouldShow && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-4 right-4 z-[9999]"
                >
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border backdrop-blur-sm ${!isOnline
                            ? 'bg-amber-50/90 border-amber-200 text-amber-700'
                            : isSyncing
                                ? 'bg-blue-50/90 border-blue-200 text-blue-700'
                                : 'bg-emerald-50/90 border-emerald-200 text-emerald-700'
                        }`}>
                        {!isOnline ? (
                            <>
                                <WifiOff className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    Working Offline
                                    {pendingCount > 0 && ` · ${pendingCount} pending`}
                                </span>
                            </>
                        ) : isSyncing ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    Syncing {pendingCount} {pendingCount === 1 ? 'item' : 'items'}...
                                </span>
                            </>
                        ) : (
                            <>
                                <Wifi className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Back Online</span>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
