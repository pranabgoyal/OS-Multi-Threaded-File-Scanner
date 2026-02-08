"use client"

import React from 'react'
import { Activity, Loader2 } from 'lucide-react'
import { useScanEngine } from '@/contexts/scan-engine-provider'
import { useScanner } from '@/contexts/websocket-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export function ThreadActivityCard() {
    const { threads, status } = useScanEngine()
    const { metrics } = useScanner()

    const threadArray = Array.from(threads.values())
    const isScanning = status === 'SCANNING' || status === 'WARMUP'

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Thread Activity
                </CardTitle>
                <CardDescription>
                    Real-time visualization of {metrics.totalThreads} parallel scanning threads
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {threadArray.map((thread) => {
                        const isBusy = thread.status === 'busy'
                        const progress = isBusy ? Math.random() * 100 : 0

                        return (
                            <div key={thread.id} className="space-y-1.5">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-muted-foreground">
                                            Thread {thread.id}
                                        </span>
                                        {isBusy && isScanning && (
                                            <Loader2 className="h-3 w-3 text-primary animate-spin" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {thread.filesProcessed} files
                                        </span>
                                        <div className={cn(
                                            "h-2 w-2 rounded-full",
                                            isBusy && isScanning ? "bg-secondary animate-pulse" : "bg-muted-foreground/30"
                                        )} />
                                    </div>
                                </div>
                                <Progress
                                    value={isBusy && isScanning ? progress : 0}
                                    className="h-2"
                                />
                                {thread.currentFile && isBusy && (
                                    <p className="text-xs text-muted-foreground truncate font-mono">
                                        {thread.currentFile}
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </div>

                {threadArray.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                        No thread information available
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
