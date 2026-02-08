"use client"

import React from 'react'
import { cn } from "@/lib/utils"

interface SystemLayoutProps {
    children: React.ReactNode
    className?: string
}

export function SystemLayout({ children, className }: SystemLayoutProps) {
    return (
        <div className={cn(
            "min-h-screen w-full bg-background text-foreground font-mono overflow-hidden flex flex-col selection:bg-primary/20",
            className
        )}>
            {children}
        </div>
    )
}

export function SystemHeader({ children, className }: SystemLayoutProps) {
    return (
        <header className={cn(
            "h-16 flex-none border-b border-border bg-background/50 backdrop-blur-md flex items-center px-6 z-10",
            className
        )}>
            {children}
        </header>
    )
}

export function SystemContent({ children, className }: SystemLayoutProps) {
    return (
        <main className={cn(
            "flex-1 relative overflow-hidden flex", // Flex to allow split view
            className
        )}>
            {children}
        </main>
    )
}

export function SystemFooter({ children, className }: SystemLayoutProps) {
    return (
        <footer className={cn(
            "h-12 flex-none border-t border-border bg-card flex items-center px-4 z-10",
            className
        )}>
            {children}
        </footer>
    )
}
