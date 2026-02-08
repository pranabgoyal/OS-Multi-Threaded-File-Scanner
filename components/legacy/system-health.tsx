"use client"

import { IconCpu, IconDeviceAnalytics, IconServer } from "@tabler/icons-react"
import { useScanner } from "@/contexts/websocket-provider"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SystemHealth() {
  const { metrics } = useScanner()
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <IconDeviceAnalytics className="size-5 text-primary" />
          System Resources
        </CardTitle>
        <CardDescription>Live monitoring of scanner host performance</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-6 pt-4">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex aspect-square w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 blur-sm" />
            <svg className="absolute inset-0 size-full -rotate-90 transition-transform duration-300 hover:scale-105">
              <circle
                className="text-muted/30"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="48"
                cy="48"
              />
              <circle
                className="text-primary transition-all duration-700 ease-out"
                strokeWidth="6"
                strokeDasharray={251}
                strokeDashoffset={251 - (251 * metrics.cpuLoad) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="48"
                cy="48"
                style={{
                  filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))"
                }}
              />
            </svg>
            <div className="relative flex flex-col items-center">
              <IconCpu className="size-7 text-primary/90" />
              <span className="mt-1 text-sm font-bold tabular-nums">{Math.round(metrics.cpuLoad)}%</span>
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground">CPU Load</p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="relative flex aspect-square w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/5 to-blue-500/10 blur-sm" />
            <svg className="absolute inset-0 size-full -rotate-90 transition-transform duration-300 hover:scale-105">
              <circle
                className="text-muted/30"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="48"
                cy="48"
              />
              <circle
                className="text-blue-500 transition-all duration-700 ease-out"
                strokeWidth="6"
                strokeDasharray={251}
                strokeDashoffset={251 - (251 * metrics.memoryUsage) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="48"
                cy="48"
                style={{
                  filter: "drop-shadow(0 0 8px hsl(217, 100%, 60% / 0.5))"
                }}
              />
            </svg>
            <div className="relative flex flex-col items-center">
              <IconServer className="size-7 text-blue-500/90" />
              <span className="mt-1 text-sm font-bold tabular-nums">{Math.round(metrics.memoryUsage)}%</span>
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground">Memory</p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="relative flex aspect-square w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/5 to-purple-500/10 blur-sm" />
            <svg className="absolute inset-0 size-full -rotate-90 transition-transform duration-300 hover:scale-105">
              <circle
                className="text-muted/30"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="48"
                cy="48"
              />
              <circle
                className="text-purple-500 transition-all duration-700 ease-out"
                strokeWidth="6"
                strokeDasharray={251}
                strokeDashoffset={251 - (251 * metrics.diskIO) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="48"
                cy="48"
                style={{
                  filter: "drop-shadow(0 0 8px hsl(280, 100%, 60% / 0.5))"
                }}
              />
            </svg>
            <div className="relative flex flex-col items-center">
              <IconDeviceAnalytics className="size-7 text-purple-500/90" />
              <span className="mt-1 text-sm font-bold tabular-nums">{Math.round(metrics.diskIO)}%</span>
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground">Disk I/O</p>
        </div>
      </CardContent>
    </Card>
  )
}
