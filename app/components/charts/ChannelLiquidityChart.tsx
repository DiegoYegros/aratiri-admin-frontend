"use client";

import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";
import { useLanguage } from "@/app/lib/language";
import {
  AXIS_LINE,
  AXIS_TICK,
  CHART_COLORS,
  formatSatsCompact,
  formatSatsLocale,
  GRID_PROPS,
  LEGEND_STYLE,
} from "@/app/lib/chartTheme";
import { ChartTooltip } from "../ui/ChartTooltip";
import { ChartEmptyState } from "../ui/ChartEmptyState";

interface ChartDatum {
  name: string;
  outbound: number;
  inbound: number;
  outboundShare?: number;
  inboundShare?: number;
  total?: number;
}

const BAR_RADIUS: [number, number, number, number] = [6, 6, 0, 0];

export const ChannelLiquidityChart = ({ data }: { data: ChartDatum[] }) => {
  const { language, t } = useLanguage();

  const hasData = data.some((item) => item.outbound > 0 || item.inbound > 0);

  return (
    <div className="bg-panel p-4 rounded-lg border border-panel-edge h-full flex flex-col">
      <h3 className="text-lg font-bold mb-4">
        {t("charts.channels.title")}
      </h3>
      {hasData ? (
        <div className="h-72 lg:h-80 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis
                dataKey="name"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={AXIS_LINE}
                interval={Math.ceil(data.length / 6)}
                tickMargin={8}
              />
              <YAxis
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={AXIS_LINE}
                width={40}
                tickFormatter={(value: number) => formatSatsCompact(value)}
              />
              <Tooltip
                cursor={{ fill: "rgba(44, 43, 38, 0.25)" }}
                content={
                  <ChartTooltip
                    valueRenderer={(entry) => {
                      const value = Number(entry.value);
                      const total = Number(entry.payload?.total) || 0;
                      const share =
                        total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                      return `${formatSatsLocale(value, language)} ${t("common.sats")} (${share}%)`;
                    }}
                  />
                }
              />
              <Legend
                iconType="circle"
                wrapperStyle={LEGEND_STYLE}
                formatter={(value: string) =>
                  value === "outbound"
                    ? t("charts.channels.outbound")
                    : value === "inbound"
                      ? t("charts.channels.inbound")
                      : value
                }
              />
              <Bar
                dataKey="outbound"
                name="outbound"
                stackId="liquidity"
                radius={BAR_RADIUS}
                fill={CHART_COLORS.accent}
              />
              <Bar
                dataKey="inbound"
                name="inbound"
                stackId="liquidity"
                radius={[0, 0, 0, 0]}
                fill={CHART_COLORS.credit}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmptyState message={t("charts.channels.empty")} />
      )}
    </div>
  );
};
