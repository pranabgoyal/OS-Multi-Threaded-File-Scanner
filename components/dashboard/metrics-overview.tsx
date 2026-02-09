"use client"

import React from 'react'
import { Cpu, HardDrive, Activity, Zap } from 'lucide-react'
import { useScanner } from '@/contexts/websocket-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export function MetricsOverview() {
    const { metrics } = useScanner()

    const stats = [
        {
            label: 'CPU Load',
            value: `${metrics.cpuLoad}%`,
            progress: metrics.cpuLoad,
            icon: Cpu,
            color: metrics.cpuLoad > 80 ? 'text-destructive' : 'text-primary',
            bgColor: metrics.cpuLoad > 80 ? 'bg-destructive/10' : 'bg-primary/10'
        },
        {
            label: 'Memory Usage',
            value: `${metrics.memoryUsage}%`,
            progress: metrics.memoryUsage,
            icon: HardDrive,
            color: metrics.memoryUsage > 80 ? 'text-destructive' : 'text-secondary',
            bgColor: metrics.memoryUsage > 80 ? 'bg-destructive/10' : 'bg-secondary/10'
        },
        {
            label: 'Scan Speed',
            value: `${metrics.scanSpeed} /s`,
            subValue: `${(metrics.filesScanned + metrics.threatsDetected).toLocaleString()} processed`,
            icon: Zap,
            color: 'text-warning',
            bgColor: 'bg-warning/10'
        },
        {
            label: 'Active Threads',
            value: `${metrics.activeThreads}/${metrics.totalThreads}`,
            progress: metrics.totalThreads > 0 ? (metrics.activeThreads / metrics.totalThreads) * 100 : 0,
            icon: Activity,
            color: 'text-primary',
            bgColor: 'bg-primary/10'
        }
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.label} className="overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                    {stat.label}
                                </p>
                                <p className={cn("text-2xl font-bold tabular-nums", stat.color)}>
                                    {stat.value}
                                </p>
                                {stat.subValue && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stat.subValue}
                                    </p>
                                )}
                            </div>
                            <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                                <stat.icon className={cn("h-5 w-5", stat.color)} />
                            </div>
                        </div>
                        {stat.progress !== undefined && (
                            <Progress
                                value={stat.progress}
                                className="h-1.5"
                            />
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
