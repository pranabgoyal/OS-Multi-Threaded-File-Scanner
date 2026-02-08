"use client"

import React from 'react'
import { AlertTriangle, Shield, Info } from 'lucide-react'
import { useScanner } from '@/contexts/websocket-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ThreatAlertsCard() {
    const { alerts, resolveThreat } = useScanner()

    return (
        <Card className="border-destructive/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Threat Alerts
                    {alerts.length > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                            {alerts.length}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-secondary">
                        <Shield className="h-16 w-16 mb-3 opacity-20" />
                        <p className="font-semibold">System Secure</p>
                        <p className="text-sm text-muted-foreground">No threats detected</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="destructive" className="text-xs">
                                                    {alert.type?.toUpperCase() || 'MALWARE'}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {alert.time}
                                                </span>
                                            </div>
                                            <p className="font-semibold text-sm text-destructive mb-1">
                                                {alert.threat}
                                            </p>
                                            <p className="text-xs font-mono text-muted-foreground break-all">
                                                {alert.file}
                                            </p>
                                        </div>
                                        <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                                    </div>

                                    {alert.status === 'infected' && (
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-destructive/20">
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="w-full h-8 text-xs"
                                                onClick={() => resolveThreat(alert.file, 'quarantine')}
                                            >
                                                Quarantine
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full h-8 text-xs"
                                                onClick={() => resolveThreat(alert.file, 'ignore')}
                                            >
                                                Ignore
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}

                {alerts.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-start gap-2">
                        <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                            Quarantined files are moved to a secure location and can be restored from the Quarantine Manager.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
