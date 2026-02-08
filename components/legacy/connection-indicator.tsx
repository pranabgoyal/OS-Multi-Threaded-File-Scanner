"use client"

import { useScanner } from '@/contexts/websocket-provider'
import { Badge } from '@/components/ui/badge'
import { IconPlugConnected, IconPlugConnectedX, IconLoader2 } from '@tabler/icons-react'

export function ConnectionIndicator() {
  const { connectionStatus } = useScanner()

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: IconPlugConnected,
          text: 'Connected',
          className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
        }
      case 'connecting':
      case 'reconnecting':
        return {
          icon: IconLoader2,
          text: connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Connecting',
          className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse',
          spin: true,
        }
      case 'disconnected':
      default:
        return {
          icon: IconPlugConnectedX,
          text: 'Disconnected',
          className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`gap-1.5 ${config.className}`}>
      <Icon size={14} className={config.spin ? 'animate-spin' : ''} />
      <span className="text-xs font-medium">{config.text}</span>
    </Badge>
  )
}
