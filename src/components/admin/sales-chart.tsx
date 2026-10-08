"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  sales: { label: "Sales", color: "#1b2743" },
} satisfies ChartConfig;

export function SalesChart({
  data,
}: {
  data: { date: string; salesMinor: number }[];
}) {
  const points = data.map((d) => ({
    day: d.date.slice(8) + "/" + d.date.slice(5, 7),
    sales: d.salesMinor / 100,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={points} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={4}
          fontSize={11}
        />
        <YAxis tickLine={false} axisLine={false} fontSize={11} width={48} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
