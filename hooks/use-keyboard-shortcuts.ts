"use client"

import { useEffect } from 'react'
import { useScanner } from '@/contexts/websocket-provider'
import { useScanEngine } from '@/contexts/scan-engine-provider'
import { toast } from 'sonner'

export function useKeyboardShortcuts() {
    const { stopScan, pauseScan, resumeScan } = useScanner()
    const { status } = useScanEngine()

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input is focused
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }

            if (e.code === 'Space') {
                e.preventDefault()
                if (status === 'SCANNING' || status === 'WARMUP') {
                    pauseScan()
                    toast.info("Paused (Space)")
                } else if (status === 'PAUSED') {
                    resumeScan()
                    toast.success("Resumed (Space)")
                }
            } else if (e.code === 'Escape') {
                e.preventDefault()
                if (status === 'SCANNING' || status === 'WARMUP' || status === 'PAUSED') {
                    stopScan()
                    toast.info("Stopped (Esc)")
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [status, stopScan, pauseScan, resumeScan])
}
