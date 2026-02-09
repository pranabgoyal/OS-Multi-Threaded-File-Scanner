import React, { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { useScanner } from '@/contexts/websocket-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DataPoint {
    time: string
    speed: number
}

export function ScanSpeedGraph() {
    const { metrics } = useScanner()
    const [dataPoints, setDataPoints] = useState<DataPoint[]>([])

    useEffect(() => {
        // SIMPLIFIED LOGIC: Always record if not IDLE.
        // This ensures usually we see SOMETHING.
        if (metrics.status !== 'IDLE') {
            const now = new Date()
            const timeStr = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })

            setDataPoints(prev => {
                const newPoint = {
                    time: timeStr,
                    speed: metrics.scanSpeed || 0
                }
                return [...prev, newPoint].slice(-300)
            })
        }
    }, [metrics.filesScanned, metrics.scanSpeed, metrics.status]) // Explicit primitives to avoid React Hook errors

    // Clear data when a NEW scan starts OR when RESET happens
    useEffect(() => {
        if (metrics.status === 'WARMUP') {
            setDataPoints([])
        }
        // If status is IDLE and filesScanned is 0, it means we Reset.
        if (metrics.status === 'IDLE' && metrics.filesScanned === 0) {
            setDataPoints([])
        }
    }, [metrics.status, metrics.filesScanned])

    // OPTIMIZATION: Smooth the data for better visuals
    // A raw throughput graph is very spiky. We apply a simple moving average.
    const smoothedData = dataPoints.map((point, i, arr) => {
        if (i < 2) return point;
        const prev = arr[i - 1];
        const prev2 = arr[i - 2];
        const avgSpeed = (point.speed + prev.speed + prev2.speed) / 3;
        return { ...point, speed: Math.round(avgSpeed) };
    });

    const maxSpeed = Math.max(...smoothedData.map(d => d.speed), 10)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Scan Speed Over Time
                </CardTitle>
                <CardDescription>
                    Real-time file throughput (Files/Sec)
                </CardDescription>
            </CardHeader>
            <CardContent>
                {smoothedData.length === 0 ? (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                        Start a scan to see real-time speed metrics
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={smoothedData}>
                            <defs>
                                <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={true} />
                            <XAxis
                                dataKey="time"
                                tick={{ fontSize: 10 }}
                                className="text-muted-foreground"
                                minTickGap={5} // Show ticks even for short durations
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{ fontSize: 10 }}
                                className="text-muted-foreground"
                                domain={[0, maxSpeed > 10 ? 'auto' : 10]} // Ensure scale doesn't look flat for low speeds
                                width={30}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    color: 'hsl(var(--foreground))'
                                }}
                                itemStyle={{ color: 'hsl(var(--primary))' }}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="speed"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                fillOpacity={0.2}
                                fill="url(#colorSpeed)"
                                dot={false} // Clean look
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                animationDuration={300}
                                isAnimationActive={true}
                                connectNulls={true}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}
