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
                speed: metrics.scanSpeed
            }

            // Keep last 30 data points for a smooth window
            const updated = [...prev, newPoint].slice(-30)
            return updated
        })
    }, [metrics.scanSpeed])

    // Clear data ONLY when a NEW scan starts
    useEffect(() => {
        if (metrics.status === 'WARMUP') {
            setDataPoints([])
        }
    }, [metrics.status])

    const maxSpeed = Math.max(...dataPoints.map(d => d.speed), 10)

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
                {dataPoints.length === 0 ? (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                        Start a scan to see real-time speed metrics
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={dataPoints}>
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
                                minTickGap={30}
                            />
                            <YAxis
                                tick={{ fontSize: 10 }}
                                className="text-muted-foreground"
                                domain={[0, maxSpeed + 5]}
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
                                fillOpacity={1}
                                fill="url(#colorSpeed)"
                                dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                                animationDuration={300}
                                isAnimationActive={true}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}
