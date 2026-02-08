"use client"

import React, { useState, useEffect } from 'react'
import { Settings, Save, Moon, Sun, Monitor } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { useScanner } from '@/contexts/websocket-provider'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function SettingsModal() {
    const { settings, saveSettings } = useScanner()
    const [open, setOpen] = useState(false)
    const [localSettings, setLocalSettings] = useState({
        cpuLimit: 80,
        theme: 'blue',
        vtApiKey: ''
    })

    // Load initial settings
    useEffect(() => {
        if (open) {
            setLocalSettings({
                cpuLimit: settings.cpuLimit || 80,
                theme: settings.theme || 'blue',
                vtApiKey: settings.vtApiKey || ''
            })
        }
    }, [open, settings])

    const handleSave = () => {
        saveSettings(localSettings)
        setOpen(false)
        toast.success("Settings Saved", { description: "Your preferences have been updated." })

        // Apply Theme Immediately (Mock)
        document.documentElement.style.setProperty('--primary', getThemeColor(localSettings.theme));
    }

    const getThemeColor = (theme: string) => {
        switch (theme) {
            case 'green': return '142.1 76.2% 36.3%';
            case 'purple': return '262.1 83.3% 57.8%';
            case 'orange': return '24.6 95% 53.1%';
            default: return '221.2 83.2% 53.3%'; // Blue
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Configure scanning performance and appearance.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {/* CPU Limit */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="cpu-limit">Max CPU Usage</Label>
                            <span className="text-sm font-mono text-muted-foreground">{localSettings.cpuLimit}%</span>
                        </div>
                        <Slider
                            id="cpu-limit"
                            min={10}
                            max={100}
                            step={10}
                            value={[localSettings.cpuLimit]}
                            onValueChange={(vals: number[]) => setLocalSettings({ ...localSettings, cpuLimit: vals[0] })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Higher values scan faster but may slow down your PC.
                        </p>
                    </div>

                    {/* Theme Selector */}
                    <div className="space-y-3">
                        <Label>Theme Accent</Label>
                        <div className="flex gap-3">
                            {['blue', 'green', 'purple', 'orange'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setLocalSettings({ ...localSettings, theme: t })}
                                    className={cn(
                                        "h-8 w-8 rounded-full border-2 transition-all",
                                        localSettings.theme === t ? "border-primary ring-2 ring-primary/30" : "border-transparent opacity-50 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: `hsl(${getThemeColor(t)})` }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* API Keys */}
                    <div className="space-y-2">
                        <Label htmlFor="vt-api">VirusTotal API Key</Label>
                        <Input
                            id="vt-api"
                            type="password"
                            placeholder="Enter API Key"
                            value={localSettings.vtApiKey}
                            onChange={(e) => setLocalSettings({ ...localSettings, vtApiKey: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Required for cloud verification of suspicious files.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
