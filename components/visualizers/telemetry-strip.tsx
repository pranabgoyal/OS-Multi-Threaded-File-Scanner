"use client"

import React, { useEffect, useState, useRef } from 'react'
import { Activity, HardDrive, Cpu, Layers, Zap } from 'lucide-react'
import { useScanner } from '@/contexts/websocket-provider'
import { cn } from '@/lib/utils'

function Sparkline({ data, color }: { data: number[], color: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height
        const padding = 2

        ctx.clearRect(0, 0, width, height)
        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.lineJoin = 'round'

        if (data.length < 2) return

        // Scale x to width, y to height
        const stepX = width / (data.length - 1 || 1)

        data.forEach((val, i) => {
            const x = i * stepX
            // Invert Y because canvas 0 is top
            const y = height - padding - ((val / 100) * (height - padding * 2))
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
        })

        ctx.stroke()

        // Add fill gradient
        ctx.lineTo(width, height)
        ctx.lineTo(0, height)
        ctx.closePath()
        const gradient = ctx.createLinearGradient(0, 0, 0, height)
        gradient.addColorStop(0, color + '40') // 25% opacity
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.fill()

    }, [data, color])

    return <canvas ref={canvasRef} width={80} height={24} className="opacity-80" />
}

export function TelemetryStrip() {
    const { metrics, throughputData } = useScanner()
    // Generate a derived CPU history for the sparkline (mocking history if not provided by backend yet)
    const [cpuHistory, setCpuHistory] = useState<number[]>(new Array(20).fill(0))

    useEffect(() => {
        setCpuHistory(prev => [...prev.slice(1), metrics.cpuLoad])
    }, [metrics.cpuLoad])

    // Helper for color coding values
    const getValueColor = (val: number, limit: number) => {
        if (val > limit * 0.9) return "text-rose-500"
        if (val > limit * 0.7) return "text-amber-500"
        return "text-cyan-500"
    }

    return (
        <div className="w-full h-full flex items-center justify-between gap-6 px-4 text-xs font-mono text-muted-foreground bg-card/50 backdrop-blur border-t border-border select-none">

            {/* CPU Section */}
            <div className="flex items-center gap-3 w-40">
                <Cpu className={cn("h-3.5 w-3.5", getValueColor(metrics.cpuLoad, 100))} />
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider opacity-70">CPU Core</span>
                    <span className={cn("font-bold", getValueColor(metrics.cpuLoad, 100))}>
                        {metrics.cpuLoad.toFixed(1)}%
                    </span>
                </div>
                <Sparkline data={cpuHistory} color={metrics.cpuLoad > 80 ? '#f43f5e' : '#06b6d4'} />
            </div>

            <div className="h-6 w-px bg-border/50" />

            {/* RAM Section */}
            <div className="flex items-center gap-3 w-32">
                <Layers className="h-3.5 w-3.5 text-violet-500" />
                <div className="flex flex-col w-full">
                    <div className="flex justify-between text-[10px] uppercase tracking-wider opacity-70">
                        <span>Mem</span>
                        <span>{metrics.memoryUsage.toFixed(1)}%</span>
                    </div>
                    {/* Segmented Bar */}
                    <div className="flex gap-0.5 mt-1">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1.5 w-full rounded-[1px] transition-colors duration-300",
                                    (i * 10) < metrics.memoryUsage
                                        ? "bg-violet-500"
                                        : "bg-muted"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-6 w-px bg-border/50" />

            {/* I/O Section */}
            <div className="flex items-center gap-3 w-32">
                <HardDrive className={cn("h-3.5 w-3.5 transition-colors", metrics.diskIO > 0 ? "text-emerald-500" : "text-muted-foreground")} />
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider opacity-70">Disk I/O</span>
                    <span className="font-bold text-foreground">
                        {metrics.diskIO.toFixed(1)} <span className="text-[10px] font-normal opacity-50">MB/s</span>
                    </span>
                </div>
            </div>

            <div className="flex-1" />

            {/* Throughput */}
            <div className="flex items-center gap-2 mr-6">
                <Activity className="h-3.5 w-3.5 text-cyan-500" />
                <span className="text-cyan-500 font-bold">{metrics.scanSpeed}</span>
                <span className="opacity-50">FILES/S</span>
            </div>

            {/* Thread Matrix */}
            <div className="flex flex-col items-end gap-1">
                <div className="flex gap-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1.5 w-1.5 rounded-full transition-all duration-300",
                                i < metrics.activeThreads
                                    ? "bg-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.6)]"
                                    : "bg-muted-foreground/20"
                            )}
                        />
                    ))}
                </div>
                <span className="text-[10px] uppercase tracking-wider opacity-50">
                    Active Threads [{metrics.activeThreads}/{metrics.totalThreads}]
                </span>
            </div>
        </div>
    )
}
