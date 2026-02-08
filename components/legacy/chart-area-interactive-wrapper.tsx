"use client"

import dynamic from "next/dynamic"

export const ChartAreaInteractive = dynamic(
  () => import("@/components/chart-area-interactive").then((mod) => mod.ChartAreaInteractive),
  { ssr: false }
)
