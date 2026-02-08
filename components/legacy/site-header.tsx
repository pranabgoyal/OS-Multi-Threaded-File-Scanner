"use client"

import * as React from "react"
import { IconSearch, IconBell, IconSettings, IconShield, IconShieldCheck, IconShieldX, IconPlayerPlay, IconPlayerStop, IconFolder, IconDownload } from "@tabler/icons-react"
import { useScanner } from "@/contexts/websocket-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "@/components/mode-toggle"
import { SettingsDialog } from "@/components/settings-dialog"
import { FileBrowserDialog } from "@/components/file-browser-dialog"

export function SiteHeader() {
  const { startScan, stopScan, pauseScan, resumeScan, metrics, connectionStatus, startWatch, stopWatcher, watchStatus, history } = useScanner()
  const [path, setPath] = React.useState(".")
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [showBrowser, setShowBrowser] = React.useState(false)

  const handleExport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      scanMetrics: metrics,
      scanHistory: history
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `scan_report_${new Date().getTime()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex flex-1 items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            {connectionStatus === 'connected' ? (
              <IconShieldCheck className="h-6 w-6 text-green-500" />
            ) : connectionStatus === 'disconnected' ? (
              <IconShieldX className="h-6 w-6 text-red-500" />
            ) : (
              <IconShield className="h-6 w-6 text-yellow-500 animate-pulse" />
            )}
            <span className="hidden font-bold sm:inline-block">
              Neural Anti-Virus
            </span>
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'} className="ml-2 text-[10px] h-5">
              {connectionStatus.toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Path to scan..."
                className="pl-9 h-9 font-mono text-sm bg-background/50 border-input/50 focus:bg-background transition-colors"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                disabled={metrics.status === 'running' || metrics.status === 'paused'}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setShowBrowser(true)}
              disabled={metrics.status === 'running' || metrics.status === 'paused'}
              title="Browse Files"
            >
              <IconFolder size={16} />
            </Button>
          </div>

          <Button
            size="sm"
            className={metrics.status === 'running' ? "w-24 bg-red-500 hover:bg-red-600" : "w-24"}
            onClick={() => {
              if (metrics.status === 'running') {
                stopScan()
              } else if (metrics.status === 'paused') {
                resumeScan()
              } else {
                startScan(path, false, 80)
              }
            }}
          >
            {metrics.status === 'running' ? (
              <>
                <IconPlayerStop className="mr-2 h-4 w-4" /> Stop
              </>
            ) : metrics.status === 'paused' ? (
              <>
                <IconPlayerPlay className="mr-2 h-4 w-4" /> Resume
              </>
            ) : (
              <>
                <IconPlayerPlay className="mr-2 h-4 w-4" /> Scan
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant={watchStatus?.active ? "destructive" : "secondary"}
            onClick={() => {
              if (watchStatus?.active) {
                stopWatcher();
              } else {
                startWatch(path);
              }
            }}
            disabled={metrics.status === 'running'}
            title="Real-time Directory Watcher"
            className="w-24"
          >
            {watchStatus?.active ? "Stop Watch" : "Watch"}
          </Button>

          <Button variant="ghost" size="icon" onClick={handleExport} title="Export Report">
            <IconDownload className="size-4" />
          </Button>

          <ModeToggle />

          <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
            <IconSettings className="size-4" />
          </Button>
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <FileBrowserDialog
        open={showBrowser}
        onOpenChange={setShowBrowser}
        onSelect={(p) => setPath(p)}
      />
    </header>
  )
}
