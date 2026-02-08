"use client"

import * as React from "react"
import { IconFolder, IconFile, IconArrowUp, IconCheck } from "@tabler/icons-react"
import { useScanner } from "@/contexts/websocket-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface FileBrowserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (path: string) => void
}

export function FileBrowserDialog({ open, onOpenChange, onSelect }: FileBrowserDialogProps) {
    const { listDir, dirData } = useScanner()
    const [currentPath, setCurrentPath] = React.useState(".")

    // Initial load
    React.useEffect(() => {
        if (open) {
            listDir(currentPath)
        }
    }, [open])

    // Update local path when backend responds
    React.useEffect(() => {
        if (dirData.path) {
            setCurrentPath(dirData.path)
        }
    }, [dirData])

    const handleNavigate = (path: string) => {
        listDir(path)
    }

    const handleUp = () => {
        handleNavigate(currentPath + "/..")
    }

    const handleSelectCurrent = () => {
        onSelect(currentPath)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Select Directory</DialogTitle>
                    <DialogDescription>
                        Choose a folder to scan for threats.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-2 mb-2">
                    <Button variant="outline" size="icon" onClick={handleUp}>
                        <IconArrowUp size={16} />
                    </Button>
                    <Input
                        value={currentPath}
                        onChange={(e) => {
                            setCurrentPath(e.target.value)
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') listDir(currentPath)
                        }}
                        className="font-mono text-sm"
                    />
                    <Button variant="secondary" onClick={() => listDir(currentPath)}>Go</Button>
                </div>

                <div className="border rounded-md h-[400px] overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-1">
                            {dirData.items.sort((a, b) => {
                                if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name)
                                return a.isDirectory ? -1 : 1
                            }).map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer rounded-sm"
                                    onClick={() => {
                                        if (item.isDirectory) {
                                            handleNavigate(`${currentPath}/${item.name}`)
                                        }
                                    }}
                                >
                                    <span className={item.isDirectory ? "text-blue-500" : "text-muted-foreground"}>
                                        {item.isDirectory ? <IconFolder size={16} fill="currentColor" className="opacity-20" /> : <IconFile size={16} />}
                                    </span>
                                    <span className="flex-1 truncate">{item.name}</span>
                                </div>
                            ))}
                            {dirData.items.length === 0 && (
                                <div className="p-4 text-center text-muted-foreground text-xs">
                                    Empty directory or access denied.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSelectCurrent}>
                        <IconCheck size={16} className="mr-2" />
                        Select This Folder
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
