"use client"

import { IconAlertTriangle, IconCheck, IconBug, IconShieldLock } from "@tabler/icons-react"
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
import { Button } from "@/components/ui/button"

export function RecentAlerts() {
  const { alerts, verifyFile, quarantineFile } = useScanner()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <IconAlertTriangle className="size-5 text-primary" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Real-time scan results and threat detections • {alerts.length} {alerts.length === 1 ? 'item' : 'items'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {alerts.length > 0 ? (
          <ScrollArea className="h-[320px] px-6 pb-4">
            <div className="space-y-3 min-h-[320px]">
              {alerts.slice(0, 20).map((alert, index) => (
                <div
                  key={alert.id}
                  className="group flex items-start justify-between gap-4 border-b border-border/50 pb-3 last:border-0 last:pb-0 transition-all hover:bg-muted/30 rounded-lg px-3 py-2 -mx-3"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 rounded-lg p-2 transition-all ${alert.status === 'infected'
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]' :
                      alert.status === 'warning'
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]' :
                        'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      }`}>
                      {alert.status === 'infected' ? <IconBug size={16} className="animate-pulse" /> :
                        alert.status === 'warning' ? <IconAlertTriangle size={16} /> :
                          <IconCheck size={16} />}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">{alert.file}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{alert.time}</span>
                        <span className="mx-1.5">•</span>
                        <span className="uppercase tracking-wider">{alert.type}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {alert.status !== 'clean' && alert.status !== 'quarantined' && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => verifyFile(alert.file)}
                        >
                          Verify
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => quarantineFile(alert.file)}
                        >
                          <IconShieldLock className="size-3 mr-1" />
                          Quarantine
                        </Button>
                      </div>
                    )}
                    {alert.status === 'infected' || alert.status === 'warning' ? (
                      <Badge
                        variant="destructive"
                        className={`text-[10px] font-semibold px-2 py-0.5 ${alert.status === 'warning'
                          ? 'bg-amber-500 hover:bg-amber-600 border-amber-600/20'
                          : 'border-red-600/20'
                          }`}
                      >
                        {alert.threat || 'Threat'}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold px-2 py-0.5 text-emerald-600 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30"
                      >
                        Clean
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-[320px] text-muted-foreground">
            <IconAlertTriangle className="size-12 mb-4 opacity-20" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs">Waiting for scanner data...</p>
          </div>
        )}
      </CardContent>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Card>
  )
}
