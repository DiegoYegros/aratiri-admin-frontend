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

interface ChartDatum {
  name: string;
  outbound: number;
  inbound: number;
  outboundShare?: number;
  inboundShare?: number;
  total?: number;
}

const OUTBOUND_COLOR = "#FCD34D";
const INBOUND_COLOR = "#34D399";
const BAR_RADIUS: [number, number, number, number] = [6, 6, 0, 0];

const formatSats = (value: number) => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return value.toLocaleString();
};

export const ChannelLiquidityChart = ({ data }: { data: ChartDatum[] }) => {
  const hasData = data.some((item) => item.outbound > 0 || item.inbound > 0);

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Active Channel Liquidity</h3>
        <div className="flex items-center text-xs text-gray-400 space-x-3">
          <span className="flex items-center">
            <span
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: OUTBOUND_COLOR }}
            />
            Outbound
          </span>
          <span className="flex items-center">
            <span
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: INBOUND_COLOR }}
            />
            Inbound
          </span>
        </div>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data}>
            <defs>
              <linearGradient id="channelOutbound" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="100%" stopColor={OUTBOUND_COLOR} />
              </linearGradient>
              <linearGradient id="channelInbound" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6EE7B7" />
                <stop offset="100%" stopColor={INBOUND_COLOR} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" vertical={false} />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" tickFormatter={(value) => formatSats(value)} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
              }}
              formatter={(
                value: number,
                key: string,
                payload: any
              ) => {
                const label = key === "outbound" ? "Outbound" : "Inbound";
                const total = payload?.payload?.total || 0;
                const share =
                  total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                return [
                  `${value.toLocaleString()} sats (${share}%)`,
                  label,
                ];
              }}
            />
            <Legend
              formatter={(value) =>
                value === "outbound" ? "Outbound" : "Inbound"
              }
            />
            <Bar
              dataKey="outbound"
              stackId="liquidity"
              radius={BAR_RADIUS}
              fill="url(#channelOutbound)"
            />
            <Bar
              dataKey="inbound"
              stackId="liquidity"
              radius={BAR_RADIUS}
              fill="url(#channelInbound)"
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          No liquidity data available for active channels.
        </div>
      )}
    </div>
  );
};
