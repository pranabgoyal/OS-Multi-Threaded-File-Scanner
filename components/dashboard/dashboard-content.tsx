"use client"

import { StatusHeader } from '@/components/dashboard/status-header'
import { ScanControlCard } from '@/components/dashboard/scan-control-card'
import { MetricsOverview } from '@/components/dashboard/metrics-overview'
import { ActivityView } from '@/components/dashboard/activity-view'
import { ThreatAlertsCard } from '@/components/dashboard/threat-alerts-card'
import { ScanSpeedGraph } from '@/components/dashboard/scan-speed-graph'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

export function DashboardContent() {
    useKeyboardShortcuts()

    return (
        <div className="min-h-screen bg-muted">
            <StatusHeader />

            <main className="container mx-auto px-6 py-8">
                <div className="space-y-6">
                    {/* Metrics Overview */}
                    <MetricsOverview />

                    {/* Middle Row - 2 Column Layout */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Left Column: Scan Control */}
                        <ScanControlCard />

                        {/* Right Column: Speed Graph */}
                        <ScanSpeedGraph />
                    </div>

                    {/* Bottom Section - 2 Column Layout */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Left: Recent Activity */}
                        <ActivityView />

                        {/* Right: Threat Alerts */}
                        <ThreatAlertsCard />
                    </div>
                </div>
            </main>
        </div>
    )
}
