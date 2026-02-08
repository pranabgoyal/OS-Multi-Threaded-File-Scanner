"use client"

import { useCallback } from 'react'

export function useSoundEffects() {
    const playSound = useCallback((type: 'start' | 'stop' | 'alert' | 'success') => {
        // Check for browser support
        if (typeof window === 'undefined' || !window.AudioContext) return

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.connect(gain)
        gain.connect(ctx.destination)

        const now = ctx.currentTime

        switch (type) {
            case 'start':
                // Mechanical Switch / Power Up
                osc.type = 'square'
                osc.frequency.setValueAtTime(150, now)
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.1)
                gain.gain.setValueAtTime(0.1, now)
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
                osc.start(now)
                osc.stop(now + 0.15)
                break

            case 'stop':
                // Power Down
                osc.type = 'sawtooth'
                osc.frequency.setValueAtTime(400, now)
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.2)
                gain.gain.setValueAtTime(0.1, now)
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
                osc.start(now)
                osc.stop(now + 0.25)
                break

            case 'alert':
                // Warning Beep
                osc.type = 'sawtooth'
                osc.frequency.setValueAtTime(800, now)
                osc.frequency.setValueAtTime(800, now + 0.1)
                gain.gain.setValueAtTime(0.1, now)
                gain.gain.linearRampToValueAtTime(0, now + 0.1)
                gain.gain.setValueAtTime(0.1, now + 0.15)
                gain.gain.linearRampToValueAtTime(0, now + 0.25)
                osc.start(now)
                osc.stop(now + 0.3)
                break

            case 'success':
                // Gentle Chime
                osc.type = 'sine'
                osc.frequency.setValueAtTime(523.25, now) // C5
                osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1) // C6
                gain.gain.setValueAtTime(0.05, now)
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
                osc.start(now)
                osc.stop(now + 0.6)
                break
        }
    }, [])

    return { playSound }
}
