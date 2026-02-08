"use client"

import { WebSocketProvider } from '@/contexts/websocket-provider'
import { ScanEngineProvider } from '@/contexts/scan-engine-provider'
import { Toaster } from 'sonner'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default function Dashboard() {
  return (
    <WebSocketProvider>
      <ScanEngineProvider>
        <Toaster position="top-right" richColors />
        <DashboardContent />
      </ScanEngineProvider>
    </WebSocketProvider>
  )
}
