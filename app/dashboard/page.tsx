"use client"

import { WebSocketProvider } from '@/contexts/websocket-provider'
import { ScanEngineProvider } from '@/contexts/scan-engine-provider'
import { SoundProvider } from '@/contexts/sound-provider'
import { Toaster } from 'sonner'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default function Dashboard() {
  return (
    <WebSocketProvider>
      <SoundProvider>
        <ScanEngineProvider>
          <Toaster position="top-right" richColors visibleToasts={3} closeButton />
          <DashboardContent />
        </ScanEngineProvider>
      </SoundProvider>
    </WebSocketProvider>
  )
}
