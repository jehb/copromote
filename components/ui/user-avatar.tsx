"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getGravatarUrl } from "@/lib/gravatar"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
    name?: string
    email?: string
    avatarUrl?: string | null
    className?: string
    size?: number
}

export function UserAvatar({ name = "", email = "", avatarUrl, className, size = 200 }: UserAvatarProps) {
    const gravatarUrl = email ? getGravatarUrl(email, size) : ""
    const finalAvatarUrl = avatarUrl || gravatarUrl

    const initials = name
        ? name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
        : "??"

    return (
        <Avatar className={cn("h-8 w-8", className)}>
            <AvatarImage src={finalAvatarUrl} alt={name || "User avatar"} />
            <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
    )
}
