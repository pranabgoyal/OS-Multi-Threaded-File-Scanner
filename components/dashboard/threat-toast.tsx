"use client"

import React from 'react'
import { Shield, AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ThreatToastProps {
    file: string
    threat: string
    path: string
    onDismiss: () => void
}

export function ThreatToast({ file, threat, path, onDismiss }: ThreatToastProps) {
    return (
        <div className="w-full max-w-sm bg-white dark:bg-card rounded-xl shadow-lg border border-border overflow-hidden pointer-events-auto flex flex-col">
            <div className="p-4 flex gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground">Threat Detected!</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium text-red-600 dark:text-red-400">
                            {threat || "Unknown Suspect"}
                        </span>
                        {" found in "}
                        <br />
                        <span className="font-mono text-xs break-all opacity-80">
                            {file}
                        </span>
                    </p>
                </div>
                <button
                    onClick={onDismiss}
                    className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="bg-muted/50 px-4 py-3 flex justify-end gap-2 border-t border-border/50">
                <Button
                    size="sm"
                    variant="default"
                    className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 h-8 text-xs font-medium px-4"
                    onClick={onDismiss}
                >
                    Details
                </Button>
            </div>
        </div>
    )
}
