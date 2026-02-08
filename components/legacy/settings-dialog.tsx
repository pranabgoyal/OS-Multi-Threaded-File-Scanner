"use client"

import { useEffect, useState } from "react"
import { useScanner } from "@/contexts/websocket-provider"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface SettingsDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { signatures, saveSignatures, settings, saveSettings } = useScanner()
    const [localSignatures, setLocalSignatures] = useState("")
    const [localApiKey, setLocalApiKey] = useState("")

    // Sync local state when signatures loaded or dialog opens
    useEffect(() => {
        if (open) {
            setLocalSignatures(signatures.join('\n'))
            setLocalApiKey(settings.vtApiKey || "")
        }
    }, [signatures, settings, open])

    const handleSave = () => {
        const lines = localSignatures.split('\n').filter(s => s.trim().length > 0)
        saveSignatures(lines)
        saveSettings({ vtApiKey: localApiKey })

        toast("Settings Saved", {
            description: `Updated ${lines.length} signatures and API Key.`,
        })
        if (onOpenChange) onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Scanner Settings</DialogTitle>
                    <DialogDescription>
                        Manage custom virus signatures and VirusTotal integration.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="vt-api-key">VirusTotal API Key</Label>
                        <Input
                            id="vt-api-key"
                            type="password"
                            placeholder="Enter your VirusTotal API Key"
                            value={localApiKey}
                            onChange={(e) => setLocalApiKey(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Required for "Verify (VT)" feature. Get one at virustotal.com.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="signatures">Custom Signatures (one per line)</Label>
                        <Textarea
                            id="signatures"
                            className="font-mono h-[200px]"
                            value={localSignatures}
                            onChange={(e) => setLocalSignatures(e.target.value)}
                            placeholder="e.g. 5A 90 F3"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSave}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
