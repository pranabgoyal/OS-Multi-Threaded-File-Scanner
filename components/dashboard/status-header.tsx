"use client"

import React from 'react'
import { Shield, Wifi, WifiOff, Square, RotateCcw, Zap, Volume2, VolumeX } from 'lucide-react'
import { useScanner } from '@/contexts/websocket-provider'
import { useScanEngine } from '@/contexts/scan-engine-provider'
import { useSoundSettings } from '@/contexts/sound-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SettingsModal } from './settings-modal'

export function StatusHeader() {
    const { connectionStatus, stopScan, resetScanner } = useScanner()
    const { status, resetEngine } = useScanEngine()

    const handleReset = () => {
        resetScanner()
        resetEngine()
    }

    const statusConfig: Record<string, { label: string; color: string }> = {
        'IDLE': { label: 'Ready', color: 'bg-secondary' },
        'SCANNING': { label: 'Scanning', color: 'bg-primary animate-pulse' },
        'PAUSED': { label: 'Paused', color: 'bg-warning' },
        'WARMUP': { label: 'Starting', color: 'bg-primary' },
        'COOLDOWN': { label: 'Finishing', color: 'bg-primary' },
        'ERROR': { label: 'Error', color: 'bg-destructive' }
    }

    const currentStatus = statusConfig[status as string] || statusConfig['IDLE']
    const isConnected = connectionStatus === 'connected'

    // SOUND CONTROLS
    const { isMuted, toggleMute } = useSoundSettings()

    return (
        <div className="bg-card border-b">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="h-6 w-6 text-primary" />
                        <div>
                            <h1 className="text-xl font-bold">File Scanner Dashboard</h1>
                            <p className="text-sm text-muted-foreground">Real-time threat detection system</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleMute}
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <VolumeX className="h-5 w-5 text-muted-foreground" /> : <Volume2 className="h-5 w-5 text-foreground" />}
                        </Button>

                        <div className="mr-2">
                            <SettingsModal />
                        </div>
                        <div className="flex items-center gap-2 mr-4">
                            {(status === 'SCANNING' || status === 'WARMUP' || status === 'PAUSED') && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-8"
                                    onClick={stopScan}
                                >
                                    <Square className="h-3 w-3 mr-2 fill-current" />
                                    Stop
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={handleReset}
                                disabled={status === 'SCANNING' || status === 'WARMUP' || status === 'PAUSED'}
                            >
                                <RotateCcw className="h-3 w-3 mr-2" />
                                Reset
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 mr-4 bg-muted/50 p-1 rounded-lg border">
                            <span className="text-xs font-medium px-2 text-muted-foreground">Mode:</span>
                            <Button
                                variant={status === 'SCANNING' ? "default" : "ghost"}
                                size="sm"
                                className="h-6 text-xs px-2"
                                disabled
                            >
                                <Zap className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                Turbo
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Engine:</span>
                            <Badge className={cn("gap-1", currentStatus.color)}>
                                <span className="h-2 w-2 rounded-full bg-white" />
                                {currentStatus.label}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <>
                                    <Wifi className="h-4 w-4 text-secondary" />
                                    <span className="text-sm text-muted-foreground">Connected</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="h-4 w-4 text-destructive" />
                                    <span className="text-sm text-muted-foreground">Disconnected</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
