"use client"

import { IconHistory, IconFileCheck, IconBug, IconClock } from "@tabler/icons-react"
import { useScanner } from "@/contexts/websocket-provider"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function formatDuration(ms: number) {
    if (ms < 1000) return `${ms}ms`
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    if (m > 0) return `${m}m ${s % 60}s`
    return `${s}s`
}

export function ScanHistory() {
    const { history } = useScanner()

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <IconHistory className="size-5 text-primary" />
                    Scan History
                </CardTitle>
                <CardDescription>
                    Record of previous scan executions • {history.length} {history.length === 1 ? 'entry' : 'entries'}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {history.length > 0 ? (
                    <ScrollArea className="h-[320px] px-6 pb-4">
                        <div className="space-y-3">
                            {history.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={entry.status === 'completed' ? 'default' : 'secondary'} className={entry.status === 'completed' ? 'bg-green-600' : 'bg-gray-500'}>
                                                {entry.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <IconClock size={12} />
                                            {formatDuration(entry.durationMs)}
                                        </div>
                                    </div>

                                    <div className="text-sm font-medium font-mono truncate" title={entry.path}>
                                        {entry.path}
                                    </div>

                                    <div className="flex items-center gap-4 text-xs font-medium">
                                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                            <IconFileCheck size={14} />
                                            {entry.filesScanned.toLocaleString()} files
                                        </div>
                                        <div className={`flex items-center gap-1.5 ${entry.threatsDetected > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            <IconBug size={14} />
                                            {entry.threatsDetected} threats
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[320px] text-muted-foreground">
                        <IconHistory className="size-12 mb-4 opacity-20" />
                        <p className="text-sm">No scan history</p>
                        <p className="text-xs">Completed scans will appear here</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
