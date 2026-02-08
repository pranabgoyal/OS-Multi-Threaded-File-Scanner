"use client"

import * as React from "react"
import { useScanner } from "@/contexts/websocket-provider"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconTrash, IconRotateClockwise, IconAlertOctagon } from "@tabler/icons-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function QuarantineManager() {
    const { quarantineList, restoreQuarantine, restoreAllQuarantine, deleteQuarantine, alerts, resolveThreat } = useScanner()

    // Filter alerts to get only "check_required" ones
    const pendingThreats = React.useMemo(() =>
        alerts.filter(a => a.status === 'check_required'),
        [alerts]);

    if ((!quarantineList || quarantineList.length === 0) && pendingThreats.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Quarantine</CardTitle>
                    <CardDescription>Safe storage for detected threats.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground flex-col gap-4">
                    <IconAlertOctagon size={48} className="opacity-20" />
                    <p>No quarantined files.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                    Quarantine Manager
                    {pendingThreats.length > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse">
                            {pendingThreats.length} Pending
                        </span>
                    )}
                </CardTitle>
                <CardDescription>
                    Manage detected threats and isolated files.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <Tabs defaultValue={pendingThreats.length > 0 ? "pending" : "quarantined"} className="h-full flex flex-col">
                    <div className="px-6 border-b">
                        <TabsList className="w-full justify-start h-9 bg-transparent p-0">
                            <TabsTrigger value="pending" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">
                                Pending Action ({pendingThreats.length})
                            </TabsTrigger>
                            <TabsTrigger value="quarantined" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">
                                Quarantined ({quarantineList.length})
                            </TabsTrigger>
                            {quarantineList.length > 0 && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="ml-auto mr-2 h-7"
                                    onClick={() => restoreAllQuarantine()}
                                >
                                    <IconRotateClockwise className="mr-2 h-3 w-3" />
                                    Restore All
                                </Button>
                            )}
                        </TabsList>
                    </div>

                    <TabsContent value="pending" className="flex-1 p-0 m-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <Table>
                                <TableHeader className="bg-muted/50 sticky top-0">
                                    <TableRow>
                                        <TableHead>Filename</TableHead>
                                        <TableHead>Threat</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingThreats.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                                No pending threats.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pendingThreats.map((item, i) => (
                                            <TableRow key={`${item.file}-${i}`}>
                                                <TableCell className="font-mono text-xs font-medium">
                                                    {item.file}
                                                </TableCell>
                                                <TableCell className="text-xs text-red-500 font-semibold">
                                                    {item.threat || "Unknown Threat"}
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                                        onClick={() => resolveThreat(item.file, 'ignore')}
                                                    >
                                                        Ignore
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="h-7 text-xs"
                                                        onClick={() => resolveThreat(item.file, 'quarantine')}
                                                    >
                                                        Quarantine
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="quarantined" className="flex-1 p-0 m-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <Table>
                                <TableHeader className="bg-muted/50 sticky top-0">
                                    <TableRow>
                                        <TableHead>Filename</TableHead>
                                        <TableHead>Original Path</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quarantineList.map((item, i) => (
                                        <TableRow key={item.file || i}>
                                            <TableCell className="font-mono text-xs">
                                                {item.file}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground break-all max-w-[200px]">
                                                {item.original}
                                            </TableCell>
                                            <TableCell className="text-xs text-nowrap">
                                                {item.timestamp ? new Date(item.timestamp * 1000).toLocaleString() : 'Unknown'}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20"
                                                    title="Restore"
                                                    onClick={() => restoreQuarantine(item.file)}
                                                >
                                                    <IconRotateClockwise size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                                                    title="Delete Permanently"
                                                    onClick={() => deleteQuarantine(item.file)}
                                                >
                                                    <IconTrash size={16} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
