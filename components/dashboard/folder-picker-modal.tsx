"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Folder,
    File,
    CornerLeftUp,
    HardDrive,
    Loader2,
    Check,
    Monitor,
    ChevronRight,
    Home
} from "lucide-react"
import { useScanner } from "@/contexts/websocket-provider"
import { cn } from "@/lib/utils"

interface FolderPickerModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (path: string) => void
}

export function FolderPickerModal({ open, onOpenChange, onSelect }: FolderPickerModalProps) {
    const { listDir, dirData } = useScanner()
    const [currentPath, setCurrentPath] = useState("")
    const [loading, setLoading] = useState(false)

    // Initial load
    useEffect(() => {
        if (open) {
            // Check if we have a previously selected path to restore? 
            // For now, start specific or empty (drives)
            if (!currentPath) loadPath("")
        }
    }, [open])

    // Update whenever dirData changes
    useEffect(() => {
        setLoading(false)
        if (dirData.path !== undefined) {
            setCurrentPath(dirData.path)
        }
    }, [dirData])

    const loadPath = (path: string) => {
        setLoading(true)
        listDir(path)
    }

    const handleNavigate = (path: string) => {
        loadPath(path)
    }

    const goUp = () => {
        if (!currentPath || currentPath.length <= 3) {
            loadPath("") // Drives
            return
        }
        const isWindows = currentPath.includes('\\') || currentPath.includes(':')
        const separator = isWindows ? '\\' : '/'

        const parts = currentPath.split(/[/\\]/).filter(Boolean)
        parts.pop()

        if (isWindows) {
            if (parts.length === 1 && parts[0].includes(':')) {
                loadPath(parts[0] + '\\')
            } else if (parts.length === 0) {
                loadPath("")
            } else {
                loadPath(parts.join(separator))
            }
        } else {
            loadPath(parts.length === 0 ? '/' : '/' + parts.join(separator))
        }
    }

    const handleSelectCurrent = () => {
        onSelect(currentPath)
        onOpenChange(false)
    }

    // Sort: Drives -> Directories -> Files
    const sortedItems = [...dirData.items].sort((a, b) => {
        // @ts-ignore - isDrive might not exist on type but backend sends it
        if (a.isDrive && !b.isDrive) return -1;
        // @ts-ignore
        if (!a.isDrive && b.isDrive) return 1;

        if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name)
        return a.isDirectory ? -1 : 1
    })

    const isDriveView = !currentPath;

    // Breadcrumb Splitter
    const getBreadcrumbs = () => {
        if (!currentPath) return [];
        const parts = currentPath.split(/[/\\]/).filter(Boolean);
        return parts;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden bg-background">

                {/* Header Section */}
                <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between mb-4">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Folder className="h-5 w-5 text-primary" />
                            Select Folder
                        </DialogTitle>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-full">
                            {/* Close icon handled by DialogPrimitive, but custom logic here if needed */}
                        </Button>
                    </div>

                    {/* Breadcrumb / Address Bar */}
                    <div className="flex items-center gap-2 bg-background border rounded-md px-3 py-2 shadow-sm">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground mb-0.5"
                            onClick={() => loadPath("")}
                            title="This PC / Root"
                        >
                            <Monitor className="h-4 w-4" />
                        </Button>

                        <div className="h-4 w-px bg-border mx-1" />

                        <div className="flex-1 flex items-center overflow-hidden text-sm">
                            {getBreadcrumbs().length === 0 ? (
                                <span className="text-muted-foreground font-medium">This PC</span>
                            ) : (
                                getBreadcrumbs().map((part, index, arr) => (
                                    <div key={index} className="flex items-center whitespace-nowrap">
                                        <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />
                                        <span
                                            className={cn(
                                                "cursor-pointer hover:bg-accent hover:text-accent-foreground px-1.5 py-0.5 rounded transition-colors",
                                                index === arr.length - 1 && "font-semibold text-foreground"
                                            )}
                                            onClick={() => {
                                                // Reconstruct path to this point
                                                const parts = getBreadcrumbs();
                                                const targetParts = parts.slice(0, index + 1);
                                                const isWindows = currentPath.includes('\\') || currentPath.includes(':');
                                                const separator = isWindows ? '\\' : '/';
                                                let newPath = targetParts.join(separator);

                                                // Ensure drive roots have trailing slash if needed
                                                if (isWindows && newPath.length === 2 && newPath.endsWith(':')) {
                                                    newPath += '\\';
                                                } else if (!isWindows && !newPath.startsWith('/')) {
                                                    newPath = '/' + newPath;
                                                }

                                                loadPath(newPath);
                                            }}
                                        >
                                            {part}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    </div>
                </div>

                {/* Content Area */}
                <ScrollArea className="flex-1 p-4 bg-card/50">
                    {/* Grid for Drives / List for Folders */}
                    <div className={cn(
                        "grid gap-2",
                        isDriveView ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-1"
                    )}>
                        {sortedItems.length === 0 && !loading && (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Folder className="h-12 w-12 mb-4 opacity-20" />
                                <p>This folder is empty</p>
                            </div>
                        )}

                        {sortedItems.map((item, idx) => {
                            // @ts-ignore
                            const isDrive = item.isDrive;

                            if (isDrive) {
                                return (
                                    <div
                                        key={`${item.name}-${idx}`}
                                        className="flex flex-col items-center justify-center p-4 border rounded-lg bg-card hover:bg-accent/50 hover:border-primary/50 cursor-pointer transition-all gap-3 text-center group"
                                        onClick={() => loadPath(item.name + '\\')}
                                    >
                                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <HardDrive className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{item.name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Local Disk</span>
                                        </div>
                                    </div>
                                )
                            }

                            return (
                                <div
                                    key={`${item.name}-${idx}`}
                                    className={cn(
                                        "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all group",
                                        item.isDirectory
                                            ? "hover:bg-accent hover:pl-3"
                                            : "opacity-40 cursor-default grayscale"
                                    )}
                                    onClick={() => {
                                        if (item.isDirectory) {
                                            let newPath = "";
                                            if (!currentPath) {
                                                // Selecting a drive or root folder
                                                newPath = item.name + (item.name.includes(':') ? '\\' : '/');
                                            } else {
                                                // Append to current path
                                                const separator = currentPath.includes('\\') ? '\\' : '/';
                                                const cleanCurrent = currentPath.endsWith(separator) ? currentPath : currentPath + separator;
                                                newPath = cleanCurrent + item.name;
                                            }
                                            loadPath(newPath);
                                        }
                                    }}
                                >
                                    {item.isDirectory ? (
                                        <Folder className="h-5 w-5 text-blue-500 fill-blue-500/10 group-hover:scale-110 transition-transform" />
                                    ) : (
                                        <File className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className={cn("text-sm transition-colors", item.isDirectory ? "text-foreground" : "text-muted-foreground")}>
                                        {item.name}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="p-4 border-t bg-muted/30 flex items-center justify-between gap-4">
                    <div className="text-xs text-muted-foreground truncate flex-1 font-mono">
                        {currentPath || "No Folder Selected"}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSelectCurrent} disabled={!currentPath}>
                            <Check className="mr-2 h-4 w-4" />
                            Select Folder
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
