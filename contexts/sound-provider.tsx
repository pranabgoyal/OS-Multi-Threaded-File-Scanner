"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

interface SoundContextType {
    isMuted: boolean
    toggleMute: () => void
    volume: number // 0.0 to 1.0 (Future proofing)
    setVolume: (val: number) => void
}

const SoundContext = createContext<SoundContextType | undefined>(undefined)

export function SoundProvider({ children }: { children: React.ReactNode }) {
    const [isMuted, setIsMuted] = useState(false)
    const [volume, setVolume] = useState(0.5) // Default 50%

    // Load from LocalStorage
    useEffect(() => {
        const savedMute = localStorage.getItem('sound-muted')
        if (savedMute !== null) setIsMuted(savedMute === 'true')

        const savedVol = localStorage.getItem('sound-volume')
        if (savedVol !== null) setVolume(parseFloat(savedVol))
    }, [])

    // Save to LocalStorage
    useEffect(() => {
        localStorage.setItem('sound-muted', String(isMuted))
    }, [isMuted])

    useEffect(() => {
        localStorage.setItem('sound-volume', String(volume))
    }, [volume])

    const toggleMute = () => setIsMuted(prev => !prev)

    return (
        <SoundContext.Provider value={{ isMuted, toggleMute, volume, setVolume }}>
            {children}
        </SoundContext.Provider>
    )
}

export function useSoundSettings() {
    const context = useContext(SoundContext)
    if (context === undefined) {
        throw new Error('useSoundSettings must be used within a SoundProvider')
    }
    return context
}
