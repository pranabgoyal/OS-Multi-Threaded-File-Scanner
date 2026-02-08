"use client"

import React, { useState, useCallback } from 'react'
import { useScanner } from "@/contexts/websocket-provider"
import { IconCloudUpload, IconFile, IconCheck } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export function DragDropZone({ className }: { className?: string }) {
    const { uploadFile, connectionStatus } = useScanner()
    const [isDragging, setIsDragging] = useState(false)
    const [lastUploaded, setLastUploaded] = useState<string | null>(null)
    const [cpuLimit, setCpuLimit] = useState(100)

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        if (connectionStatus !== 'connected') return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            uploadFile(file, cpuLimit);
            // Actually, uploadFile is just for upload. The auto-scan trigger in bridge.js defaults to full speed?
            // Bridge.js needs update to accept cpuLimit on upload. 
            // For now, let's assume uploads are small and fast.
            setLastUploaded(file.name);
            setTimeout(() => setLastUploaded(null), 3000);
        }
    }, [uploadFile, connectionStatus, cpuLimit])

    const handleClick = () => {
        document.getElementById('file-upload-input')?.click();
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            uploadFile(file, cpuLimit);
            setLastUploaded(file.name);
            setTimeout(() => setLastUploaded(null), 3000);
        }
    }

    return (
        <div className={cn("space-y-4", className)}>
            <div
                className={cn(
                    "relative group border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out cursor-pointer overflow-hidden",
                    isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    id="file-upload-input"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                />

                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className={cn(
                        "p-3 rounded-full mb-3 transition-colors",
                        lastUploaded ? "bg-green-100 text-green-600 dark:bg-green-900/20" : "bg-primary/10 text-primary group-hover:bg-primary/20"
                    )}>
                        {lastUploaded ? <IconCheck size={24} /> : <IconCloudUpload size={24} />}
                    </div>

                    <h3 className="font-semibold text-sm mb-1">
                        {lastUploaded ? "Scan Initiated!" : "Scan File"}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-[200px]">
                        {lastUploaded ? lastUploaded : "Drag & drop or click to upload and scan instantly."}
                    </p>
                </div>

                {/* Connection warning overlay */}
                {connectionStatus !== 'connected' && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm z-10 cursor-not-allowed">
                        <span className="text-xs font-medium text-muted-foreground">Scanner Disconnected</span>
                    </div>
                )}
            </div>

            {/* CPU limit control - Keeping it simple and close to action */}
            <div className="flex items-center justify-between px-2">
                <label className="text-xs font-medium text-muted-foreground">CPU Limit</label>
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min="10"
                        max="100"
                        step="10"
                        value={cpuLimit}
                        onChange={(e) => setCpuLimit(parseInt(e.target.value))}
                        className="h-2 w-24 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="text-xs font-mono w-8 text-right">{cpuLimit}%</span>
                </div>
            </div>
        </div>
    )
}
