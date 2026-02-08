"use client"

import React from 'react'
import { FileText, Shield, CheckCircle2, AlertTriangle, Download } from 'lucide-react'
import { useScanner } from '@/contexts/websocket-provider'
import { useScanEngine } from '@/contexts/scan-engine-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export function ActivityView() {
    const { metrics, alerts } = useScanner()
    const { eventStream, selectedBlock, selectBlock } = useScanEngine()

    const handleExport = () => {
        const report = {
            timestamp: new Date().toISOString(),
            metrics,
            alerts,
            recentEvents: eventStream
        }
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `scan-report-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const summary = [
        {
            label: 'Files Scanned',
            value: metrics.filesScanned.toLocaleString(),
            icon: FileText,
            color: 'text-primary'
        },
        {
            label: 'Threats Detected',
            value: metrics.threatsDetected,
            icon: metrics.threatsDetected > 0 ? AlertTriangle : Shield,
            color: metrics.threatsDetected > 0 ? 'text-destructive' : 'text-secondary'
        }
    ]

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        Real-time file scanning activity and results
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExport} className="h-8 gap-2">
                    <Download className="h-4 w-4" />
                    Export
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {summary.map((item) => (
                        <div key={item.label} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                            <item.icon className={cn("h-5 w-5", item.color)} />
                            <div>
                                <p className="text-sm text-muted-foreground">{item.label}</p>
                                <p className={cn("text-2xl font-bold", item.color)}>{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    <div className="space-y-2">
                        {eventStream.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                                <Shield className="h-12 w-12 mb-2 opacity-20" />
                                <p className="text-sm">No scanning activity yet</p>
                                <p className="text-xs">Start a scan to see file analysis in real-time</p>
                            </div>
                        ) : (
                            eventStream.map((block) => {
                                const isSelected = selectedBlock?.id === block.id
                                const isThreat = block.status === 'infected' || block.status === 'warning'

                                return (
                                    <button
                                        key={block.id}
                                        onClick={() => selectBlock(block)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-lg border transition-colors cursor-pointer",
                                            isSelected ? "bg-primary/10 border-primary" : "hover:bg-muted border-transparent",
                                            isThreat && "border-destructive/50"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {isThreat ? (
                                                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4 text-secondary flex-shrink-0" />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium truncate">{block.filename}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{block.path}</p>
                                                </div>
                                            </div>
                                            <Badge variant={isThreat ? "destructive" : "secondary"} className="ml-2">
                                                {block.status}
                                            </Badge>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
