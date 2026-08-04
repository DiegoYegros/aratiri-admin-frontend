"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "@/app/lib/language";
import {
  AXIS_LINE,
  AXIS_TICK,
  CHART_COLORS,
  CURSOR_STROKE,
  formatShortDate,
  GRID_PROPS,
  LEGEND_STYLE,
} from "@/app/lib/chartTheme";
import { ChartTooltip } from "../ui/ChartTooltip";
import { ChartEmptyState } from "../ui/ChartEmptyState";

interface TransactionStat {
  date: string;
  type: "credit" | "debit";
  count: number;
}

interface DailyRow {
  date: string;
  credit: number;
  debit: number;
}

export const TransactionLineChart = ({ data }: { data: TransactionStat[] }) => {
  const { language, t } = useLanguage();

  const processData = (): DailyRow[] => {
    const dailyData: { [key: string]: DailyRow } = {};

    data.forEach((stat) => {
      if (!dailyData[stat.date]) {
        dailyData[stat.date] = { date: stat.date, credit: 0, debit: 0 };
      }
      dailyData[stat.date][stat.type] = stat.count;
    });

    return Object.values(dailyData).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const chartData = processData();

  if (chartData.length === 0) {
    return (
      <div className="bg-panel p-4 rounded-lg border border-panel-edge h-full">
        <h3 className="text-lg font-bold mb-4">
          {t("charts.transactions.title")}
        </h3>
        <ChartEmptyState />
      </div>
    );
  }

  return (
    <div className="bg-panel p-4 rounded-lg border border-panel-edge h-full">
      <h3 className="text-lg font-bold mb-4">
        {t("charts.transactions.title")}
      </h3>
      <div className="h-72 lg:h-80 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis
              dataKey="date"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={AXIS_LINE}
              minTickGap={24}
              tickMargin={8}
              tickFormatter={(value: string) => formatShortDate(value, language)}
            />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={AXIS_LINE}
              width={40}
              allowDecimals={false}
              tickFormatter={(value: number) => value.toLocaleString()}
            />
            <Tooltip
              cursor={{ stroke: CURSOR_STROKE }}
              content={
                <ChartTooltip
                  labelRenderer={(label) =>
                    formatShortDate(String(label), language)
                  }
                />
              }
            />
            <Legend
              iconType="circle"
              wrapperStyle={LEGEND_STYLE}
              formatter={(value: string) =>
                value === "credit"
                  ? t("charts.transactions.credits")
                  : value === "debit"
                    ? t("charts.transactions.debits")
                    : value
              }
            />
            <Line
              type="monotone"
              dataKey="credit"
              stroke={CHART_COLORS.credit}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: CHART_COLORS.credit }}
              name="credit"
            />
            <Line
              type="monotone"
              dataKey="debit"
              stroke={CHART_COLORS.debit}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: CHART_COLORS.debit }}
              name="debit"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
