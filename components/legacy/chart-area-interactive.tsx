"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useScanner } from "@/contexts/websocket-provider"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  throughput: {
    label: "Files/sec",
    color: "hsl(158, 64%, 52%)", // Emerald 500
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const { throughputData, metrics } = useScanner()

  // Use WebSocket data if available, otherwise generate mock data
  const chartData = throughputData.length > 0
    ? throughputData
    : Array.from({ length: 50 }, (_, i) => ({
      time: `${i}s`,
      throughput: 0,
    }))

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Scan Performance</CardTitle>
        <CardDescription>
          Real-time file processing throughput • Current: {Math.round(metrics.scanSpeed)} files/sec
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillThroughput" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-throughput)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-throughput)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/20" />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="throughput"
              type="natural"
              fill="url(#fillThroughput)"
              stroke="var(--color-throughput)"
              stackId="a"
              animationDuration={300}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
