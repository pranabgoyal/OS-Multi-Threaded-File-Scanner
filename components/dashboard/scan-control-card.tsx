import React, { useState, useEffect } from 'react'
import { Play, Square, Pause, FolderOpen, FolderSearch } from 'lucide-react'
import { useScanner } from '@/contexts/websocket-provider'
import { useScanEngine } from '@/contexts/scan-engine-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { FolderPickerModal } from './folder-picker-modal'
import { useSoundEffects } from '@/hooks/use-sound-effects'

export function ScanControlCard() {
    const { startScan, stopScan, pauseScan, resumeScan, lastUploadedFile } = useScanner()
    const { status, clearStream } = useScanEngine()
    const [pathInput, setPathInput] = useState("")
    const [showFolderPicker, setShowFolderPicker] = useState(false)
    const { playSound } = useSoundEffects()

    // Auto-fill path when a file/folder is selected previously (or uploaded via other means)
    useEffect(() => {
        if (lastUploadedFile && lastUploadedFile.path) {
            setPathInput(lastUploadedFile.path)
        }
    }, [lastUploadedFile])

    // Fail-safe: If threads are active, allow stopping even if status is weird
    const { threads } = useScanEngine()
    const hasActiveThreads = Array.from(threads.values()).some(t => t.status === 'busy')

    // logic: Scanning OR Paused OR (Idle but Threads are busy -> Bug state, show Stop)
    const isScanning = status === 'SCANNING' || status === 'WARMUP' || hasActiveThreads
    const isPaused = status === 'PAUSED'

    const handleStart = (path?: string) => {
        const target = path || pathInput.trim()
        if (!target) {
            toast.error("Invalid Path", { description: "Please enter a valid directory path." })
            return
        }

        clearStream()
        playSound('start')
        startScan(target, true, 80)
        toast.success("Scan Started", { description: `Target: ${target}` })
    }

    const handleStop = () => {
        stopScan()
        playSound('stop')
        toast.info("Scan Stopped")
    }

    const handlePauseToggle = () => {
        if (isPaused) {
            resumeScan()
            toast.success("Scan Resumed")
        } else {
            pauseScan()
            toast.info("Scan Paused")
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FolderSearch className="h-5 w-5 text-primary" />
                    Scan Control
                </CardTitle>
                <CardDescription>
                    Start a scan by entering a path or selecting a folder
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Enter path to scan (e.g., C:\Windows\System32)"
                        value={pathInput}
                        onChange={(e) => setPathInput(e.target.value)}
                        disabled={isScanning}
                        className="flex-1"
                    />
                    {!isScanning && !isPaused && (
                        <Button onClick={() => handleStart()} className="gap-2">
                            <Play className="h-4 w-4" />
                            Start Scan
                        </Button>
                    )}
                    {(isScanning || isPaused) && (
                        <>
                            <Button onClick={handlePauseToggle} variant="outline" className="gap-2">
                                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                {isPaused ? 'Resume' : 'Pause'}
                            </Button>
                            <Button onClick={handleStop} variant="destructive" className="gap-2">
                                <Square className="h-4 w-4" />
                                Stop
                            </Button>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="h-px bg-border flex-1" />
                    <span className="text-sm text-muted-foreground">or</span>
                    <div className="h-px bg-border flex-1" />
                </div>

                <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowFolderPicker(true)}
                    disabled={isScanning}
                >
                    <FolderOpen className="h-4 w-4" />
                    Browse Folder to Scan...
                </Button>

                <FolderPickerModal
                    open={showFolderPicker}
                    onOpenChange={setShowFolderPicker}
                    onSelect={(path) => setPathInput(path)}
                />

                {!isScanning && (
                    <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Quick Actions</p>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => handleStart("C:\\")} className="text-xs h-7">
                                Scan C: Drive
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => handleStart("C:\\Users")} className="text-xs h-7">
                                Scan Users
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
