"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/app/lib/language";
import { CHART_COLORS, LEGEND_STYLE, formatSatsLocale } from "@/app/lib/chartTheme";
import { ChartTooltip } from "../ui/ChartTooltip";
import { ChartEmptyState } from "../ui/ChartEmptyState";

interface LiquidityData {
  localBalance: number;
  remoteBalance: number;
}

export const LiquidityPieChart = ({ data }: { data: LiquidityData }) => {
  const { language, t } = useLanguage();

  const total = data.localBalance + data.remoteBalance;

  if (total === 0) {
    return (
      <div className="bg-panel p-4 rounded-lg border border-panel-edge h-full">
        <h3 className="text-lg font-bold mb-4">
          {t("charts.liquidity.title")}
        </h3>
        <ChartEmptyState />
      </div>
    );
  }

  const chartData = [
    {
      name: t("charts.liquidity.outbound"),
      value: data.localBalance,
      color: CHART_COLORS.accent,
    },
    {
      name: t("charts.liquidity.inbound"),
      value: data.remoteBalance,
      color: CHART_COLORS.credit,
    },
  ];

  return (
    <div className="bg-panel p-4 rounded-lg border border-panel-edge h-full">
      <h3 className="text-lg font-bold mb-4">
        {t("charts.liquidity.title")}
      </h3>
      <div className="h-72 lg:h-80 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius="82%"
              innerRadius={0}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={
                <ChartTooltip
                  valueRenderer={(entry) =>
                    `${formatSatsLocale(Number(entry.value), language)} ${t("common.sats")}`
                  }
                />
              }
            />
            <Legend
              iconType="circle"
              wrapperStyle={LEGEND_STYLE}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
