"use client"

import React, { useState } from 'react'
import { Terminal, Play, Square, Pause, Settings, RefreshCw, FolderOpen, ShieldAlert } from 'lucide-react'
import { useScanner } from '@/contexts/websocket-provider'
import { useScanEngine } from '@/contexts/scan-engine-provider'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function CommandBar() {
    const { startScan, stopScan, pauseScan, resumeScan, connectionStatus, settings, saveSettings, uploadFile } = useScanner()
    const { status, clearStream } = useScanEngine()
    const [pathInput, setPathInput] = useState("")

    const handleStart = () => {
        // Default path if empty
        const targetPath = pathInput || ".";
        clearStream(); // Clear old visual data
        startScan(targetPath, true, 80); // Default args
        toast.info("Command Issued: START_SCAN", { description: `Target: ${targetPath}` });
    }

    const handleStop = () => {
        stopScan();
        toast.warning("Command Issued: STOP_SCAN");
    }

    const handlePauseToggle = () => {
        if (status === 'PAUSED') {
            resumeScan();
            toast.success("Command Issued: RESUME_SCAN");
        } else {
            pauseScan();
            toast.info("Command Issued: PAUSE_SCAN");
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            uploadFile(e.target.files[0]);
        }
    }

    // Status Indicator Color
    const statusColor = {
        'IDLE': 'bg-muted-foreground',
        'WARMUP': 'bg-amber-500',
        'SCANNING': 'bg-cyan-500 animate-pulse',
        'PAUSED': 'bg-amber-500 animate-pulse',
        'COOLDOWN': 'bg-blue-500',
        'ERROR': 'bg-rose-500'
    }[status as string] || 'bg-muted-foreground'

    return (
        <div className="w-full flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
            {/* Brand */}
            <div className="flex items-center gap-2 text-primary font-mono font-bold select-none">
                <Terminal className="h-5 w-5" />
                <span>SYSTEM_CORE</span>
                <div className={cn("h-2 w-2 rounded-full ml-2", statusColor)} title={`Engine Status: ${status}`} />
            </div>

            <div className="h-6 w-px bg-border mx-2" />

            {/* Input Field */}
            <div className="flex-1 relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs pointer-events-none group-focus-within:text-primary transition-colors">
                    {">"}
                </div>
                <input
                    type="text"
                    value={pathInput}
                    onChange={(e) => setPathInput(e.target.value)}
                    placeholder="enter_target_path --recursive (e.g. C:/Windows/System32)"
                    className="w-full bg-input/50 border border-border/50 rounded py-1.5 pl-8 pr-4 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
                    disabled={status === 'SCANNING'}
                />
                {/* Connection Badge */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono opacity-50 uppercase">
                    {connectionStatus}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                {/* Upload Button (Invisible Input Wrapper) */}
                <label className="cursor-pointer px-3 py-1.5 bg-background border border-border hover:bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground rounded text-xs font-mono transition-colors flex items-center gap-2">
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span>UPLOAD</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>

                {status === 'SCANNING' || status === 'PAUSED' ? (
                    <>
                        <button
                            onClick={handlePauseToggle}
                            className="h-8 w-8 flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded transition-colors"
                        >
                            {status === 'PAUSED' ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                        </button>
                        <button
                            onClick={handleStop}
                            className="h-8 w-8 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded transition-colors"
                        >
                            <Square className="h-3.5 w-3.5 fill-current" />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleStart}
                        className="px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded text-xs font-mono font-bold flex items-center gap-2 transition-all hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    >
                        <Play className="h-3.5 w-3.5" />
                        EXECUTE_SCAN
                    </button>
                )}

                <div className="h-4 w-px bg-border mx-1" />

                <button
                    className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    title="System Settings"
                    onClick={() => toast("Settings functionality moving to dedicated panel.")}
                >
                    <Settings className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
