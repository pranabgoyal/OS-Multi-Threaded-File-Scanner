"use client"

import React, { useEffect, useState, useRef } from 'react'
import { useScanEngine } from '@/contexts/scan-engine-provider'
import { cn } from '@/lib/utils'
import type { ScanBlock } from '@/types/scanner'

// --- Visual Constants ---
const LANE_COUNT = 8;

export function ThreadWaterfall() {
    const { threads, eventStream, selectBlock, selectedBlock } = useScanEngine()
    const containerRef = useRef<HTMLDivElement>(null)
    const [lanes, setLanes] = useState<ScanBlock[][]>(Array.from({ length: LANE_COUNT }, () => []))

    // Distribute events into lanes for rendering
    useEffect(() => {
        const newLanes = Array.from({ length: LANE_COUNT }, () => [] as ScanBlock[])

        // We only want to show the last N items per lane to prevent DOM overload
        const MAX_ITEMS_PER_LANE = 20;

        // Group by thread ID (modulo lane count to be safe)
        eventStream.forEach(block => {
            const laneIndex = block.threadId % LANE_COUNT
            if (newLanes[laneIndex].length < MAX_ITEMS_PER_LANE) {
                newLanes[laneIndex].push(block)
            }
        })

        setLanes(newLanes)
    }, [eventStream])

    return (
        <div className="flex-1 bg-background relative border-r border-border overflow-hidden flex flex-col">
            {/* Header / Thread IDs */}
            <div className="flex w-full h-8 border-b border-border bg-card/50 backdrop-blur z-10 shrink-0">
                {Array.from({ length: LANE_COUNT }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex-1 border-r border-border/50 text-[10px] font-mono flex items-center justify-center transition-colors duration-300",
                            (threads.get(i)?.status === 'busy') ? "bg-violet-500/10 text-violet-400" : "text-muted-foreground/50"
                        )}
                    >
                        T-{i.toString().padStart(2, '0')}
                    </div>
                ))}
            </div>

            {/* Waterfall Stream */}
            <div ref={containerRef} className="flex-1 flex w-full relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/50 via-background to-background">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex w-full pointer-events-none">
                    {Array.from({ length: LANE_COUNT }).map((_, i) => (
                        <div key={`grid-${i}`} className="flex-1 border-r border-dashed border-border/20 h-full" />
                    ))}
                </div>

                {/* Falling Blocks */}
                {lanes.map((laneBlocks, laneIdx) => (
                    <div key={`lane-${laneIdx}`} className="flex-1 flex flex-col items-center pt-4 gap-2 relative z-0">
                        {laneBlocks.map((block) => {
                            const isSelected = selectedBlock?.id === block.id
                            const isThreat = block.status === 'infected' || block.status === 'warning'

                            return (
                                <button
                                    key={block.id}
                                    onClick={() => selectBlock(block)}
                                    className={cn(
                                        "w-[80%] h-12 rounded-sm border backdrop-blur-sm transition-all duration-500 animate-in slide-in-from-top-8 fade-in text-[9px] font-mono p-1 text-left flex flex-col justify-between overflow-hidden group hover:scale-105 hover:z-50 focus:outline-none focus:ring-1",
                                        isThreat
                                            ? "bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                                            : "bg-cyan-950/20 border-cyan-500/20 text-cyan-200/70 hover:border-cyan-500/50 hover:bg-cyan-900/30",
                                        isSelected && "ring-1 ring-white/50 border-white/50 bg-white/5"
                                    )}
                                    title={block.path}
                                >
                                    <div className="truncate opacity-80 group-hover:opacity-100">{block.filename}</div>
                                    <div className="flex justify-between w-full opacity-50 group-hover:opacity-100">
                                        <span>.{block.filename.split('.').pop() || 'file'}</span>
                                        <span>{block.threadId}</span>
                                    </div>

                                    {/* Scan Progress Bar (Decoration) */}
                                    <div className={cn(
                                        "h-0.5 w-full mt-1 rounded-full overflow-hidden bg-black/20",
                                        isThreat ? "bg-rose-900" : "bg-cyan-900"
                                    )}>
                                        <div className={cn(
                                            "h-full w-full animate-[shimmer_1s_infinite]",
                                            isThreat ? "bg-rose-500" : "bg-cyan-500"
                                        )} />
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}
