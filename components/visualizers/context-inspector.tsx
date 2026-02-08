"use client"

import React from 'react'
import { useScanEngine } from '@/contexts/scan-engine-provider'
import { useScanner } from '@/contexts/websocket-provider'
import { cn } from '@/lib/utils'
import { FileText, Cpu, Database, Activity, Shield, AlertTriangle, FileCode } from 'lucide-react'

// --- Sub-Components ---

function InfoRow({ label, value, mono = false, highlight = false }: { label: string, value: React.ReactNode, mono?: boolean, highlight?: boolean }) {
    return (
        <div className="flex justify-between items-start py-1 border-b border-border/50 last:border-0">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
            <span className={cn("text-xs text-right", mono && "font-mono", highlight && "text-primary font-bold")}>{value}</span>
        </div>
    )
}

function SectionHeader({ icon: Icon, title }: { icon: any, title: string }) {
    return (
        <div className="flex items-center gap-2 mb-3 text-primary border-b border-primary/20 pb-1">
            <Icon className="h-4 w-4" />
            <h3 className="text-sm font-bold uppercase tracking-widest">{title}</h3>
        </div>
    )
}

function HexPreview({ filename }: { filename: string }) {
    // Simulated Hex Dump for UI Demo
    // In production, this would fetch the first 64 bytes via API
    const generateHex = () => {
        const hex = []
        const chars = "0123456789ABCDEF"
        for (let i = 0; i < 48; i++) {
            hex.push(chars[Math.floor(Math.random() * 16)] + chars[Math.floor(Math.random() * 16)])
        }
        return hex.join(" ")
    }

    return (
        <div className="mt-4 font-mono text-[10px] bg-background/50 p-2 rounded border border-border">
            <div className="flex justify-between text-muted-foreground mb-1">
                <span>OFFSET</span>
                <span>00 01 02 03 04 05 06 07</span>
            </div>
            <div className="space-y-0.5 opacity-70">
                <div className="flex gap-3">
                    <span className="text-violet-500">00000000</span>
                    <span>{generateHex().slice(0, 23)}</span>
                </div>
                <div className="flex gap-3">
                    <span className="text-violet-500">00000010</span>
                    <span>{generateHex().slice(0, 23)}</span>
                </div>
                <div className="flex gap-3">
                    <span className="text-violet-500">00000020</span>
                    <span>{generateHex().slice(0, 23)}</span>
                </div>
            </div>
        </div>
    )
}

// --- Views ---

function IdleView() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <SectionHeader icon={Cpu} title="System Resources" />
                <div className="space-y-1">
                    <InfoRow label="Hostname" value="WIN32_NT_WORKSTATION" mono />
                    <InfoRow label="Architecture" value="AMD64 / x86_64" mono />
                    <InfoRow label="Kernel" value="10.0.19045" mono />
                    <InfoRow label="Logical Cores" value="16 (8 Physical)" mono />
                </div>
            </div>

            <div>
                <SectionHeader icon={Database} title="Signature DB" />
                <div className="space-y-1">
                    <InfoRow label="Version" value="2024.02.08.1" mono />
                    <InfoRow label="Signatures" value="412,092" mono highlight />
                    <InfoRow label="Last Update" value="Today 09:00 AM" />
                </div>
            </div>

            <div>
                <SectionHeader icon={Shield} title="Engine Status" />
                <div className="p-3 bg-primary/5 border border-primary/20 rounded text-center">
                    <span className="text-cyan-500 font-bold text-lg tracking-widest">READY</span>
                    <p className="text-[10px] text-muted-foreground mt-1">WAITING FOR COMMAND</p>
                </div>
            </div>
        </div>
    )
}

function ActiveView({ metrics }: { metrics: any }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <SectionHeader icon={Activity} title="Live Telemetry" />
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-card p-2 rounded border border-border text-center">
                        <div className="text-2xl font-mono font-bold text-primary">{metrics.scanSpeed}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Files / Sec</div>
                    </div>
                    <div className="bg-card p-2 rounded border border-border text-center">
                        <div className="text-2xl font-mono font-bold text-violet-500">{metrics.activeThreads}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Active Threads</div>
                    </div>
                </div>
                <div className="space-y-1">
                    <InfoRow label="Total Scanned" value={metrics.filesScanned.toLocaleString()} mono />
                    <InfoRow label="Threats Found" value={<span className="text-rose-500">{metrics.threatsDetected}</span>} mono />
                    <InfoRow label="Avg Latency" value="2.4ms" mono />
                </div>
            </div>

            <div className="opacity-50">
                <SectionHeader icon={FileText} title="Heuristics" />
                <p className="text-xs text-muted-foreground">Real-time analysis active.</p>
                {/* Visual filler for "Code analysis" */}
                <div className="mt-2 space-y-1 font-mono text-[10px] text-violet-400">
                    <div>{">"} ANALYZING HEADER STRUCTURE...</div>
                    <div>{">"} CHECKING ENTROPY LEVELS...</div>
                    <div>{">"} VERIFYING SIGNATURES...</div>
                </div>
            </div>
        </div>
    )
}

function FileDetailView({ block }: { block: any }) {
    const { quarantineFile, resolveThreat } = useScanner()
    if (!block) return null

    const isThreat = block.status === 'infected' || block.status === 'warning'

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <SectionHeader icon={isThreat ? AlertTriangle : FileCode} title="Object Inspection" />

                <div className={cn(
                    "p-4 rounded border mb-4 text-center break-all",
                    isThreat ? "bg-rose-500/10 border-rose-500/50" : "bg-card border-border"
                )}>
                    <div className={cn("text-lg font-bold mb-1", isThreat ? "text-rose-500" : "text-foreground")}>
                        {block.filename}
                    </div>
                    <div className={cn("text-[10px] font-mono", isThreat ? "text-rose-300" : "text-muted-foreground")}>
                        {block.status.toUpperCase()}
                    </div>
                </div>

                <div className="space-y-1">
                    <InfoRow label="Full Path" value={block.path} mono />
                    <InfoRow label="Size" value={`${(block.size / 1024).toFixed(2)} KB`} mono />
                    <InfoRow label="Detected" value={new Date(block.timestamp).toLocaleTimeString()} mono />
                    <InfoRow label="Thread ID" value={`#${block.threadId}`} mono />
                </div>
            </div>

            <div>
                <SectionHeader icon={Activity} title="Analysis" />
                <div className="space-y-1">
                    <InfoRow label="Entropy" value="5.82" mono />
                    <InfoRow label="MIME Type" value="application/octet-stream" mono />
                </div>
                <HexPreview filename={block.filename} />
            </div>

            {isThreat && (
                <div className="pt-4">
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('quarantine-request', { detail: block.path }))}
                        className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-widest rounded transition-colors cursor-pointer active:scale-95"
                    >
                        Isolate / Quarantine
                    </button>
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('ignore-request', { detail: block.path }))}
                        className="w-full py-2 mt-2 bg-transparent border border-muted hover:border-foreground text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest rounded transition-colors cursor-pointer active:scale-95"
                    >
                        Mark False Positive
                    </button>
                </div>
            )}
        </div>
    )
}

// --- Main Component ---

export function ContextInspector() {
    const { status, selectedBlock } = useScanEngine()
    const { metrics } = useScanner()

    // Determine which view to show
    let content

    if (selectedBlock) {
        content = <FileDetailView block={selectedBlock} />
    } else if (status === 'SCANNING' || status === 'WARMUP' || status === 'PAUSED') {
        content = <ActiveView metrics={metrics} />
    } else {
        content = <IdleView />
    }

    return (
        <div className="w-[400px] flex-none bg-background/95 backdrop-blur border-l border-border flex flex-col overflow-y-auto">
            <div className="h-12 border-b border-border flex items-center px-4 bg-card/50">
                <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                    System Context / {selectedBlock ? 'INSPECTOR' : status}
                </span>
            </div>
            <div className="p-6">
                {content}
            </div>
        </div>
    )
}
