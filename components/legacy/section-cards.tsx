"use client"

import { IconActivity, IconBug, IconCpu, IconFileSearch, IconTrendingUp } from "@tabler/icons-react"
import { useScanner } from "@/contexts/websocket-provider"
import { Badge } from "@/components/ui/badge"
import { AnimatedNumber } from "@/components/ui/animated-number"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  const { metrics, connectionStatus } = useScanner()

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs *:data-[slot=card]:transition-all *:data-[slot=card]:hover:shadow-md *:data-[slot=card]:hover:scale-[1.02] lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Files Scanned</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums whitespace-nowrap @[250px]/card:text-3xl">
            <AnimatedNumber value={metrics.filesScanned} />
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              <IconTrendingUp className="size-3 mr-1" />
              {connectionStatus === 'connected' ? 'Running' : 'Offline'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            <IconFileSearch className="size-4" /> System Scan
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Threats Detected</CardDescription>
          <CardTitle className={`text-2xl font-semibold tabular-nums whitespace-nowrap @[250px]/card:text-3xl ${metrics.threatsDetected > 0 ? 'text-red-500' : ''}`}>
            <AnimatedNumber value={metrics.threatsDetected} />
          </CardTitle>
          <CardAction>
            {metrics.threatsDetected > 0 ? (
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 animate-pulse">
                <IconBug className="size-3 mr-1" />
                Critical
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                <IconBug className="size-3 mr-1" />
                Clean
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className={`line-clamp-1 flex gap-2 font-medium ${metrics.threatsDetected > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
            {metrics.threatsDetected > 0 ? 'Action Required' : 'No threats found'}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Threads</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums whitespace-nowrap @[250px]/card:text-3xl">
            {String(metrics.activeThreads).padStart(2, '0')} / {metrics.totalThreads || '-'}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconCpu className="size-3 mr-1" />
              {metrics.cpuLoad || 0}% Load
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            Optimized for Performance
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Scan Speed</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums whitespace-nowrap @[250px]/card:text-3xl">
            <AnimatedNumber value={metrics.scanSpeed} /> files/s
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-blue-500 border-blue-500/20">
              <IconActivity className="size-3 mr-1" />
              {metrics.scanSpeed > 200 ? 'Peak' : 'Normal'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-muted-foreground">
            Heuristic Analysis Active
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
