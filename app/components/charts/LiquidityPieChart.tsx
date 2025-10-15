"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface LiquidityData {
  localBalance: number;
  remoteBalance: number;
}

const COLORS = ["#FBBF24", "#34D399"];

export const LiquidityPieChart = ({ data }: { data: LiquidityData }) => {
  const chartData = [
    { name: "Outbound", value: data.localBalance },
    { name: "Inbound", value: data.remoteBalance },
  ];

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 h-full">
      <h3 className="text-lg font-bold mb-4">Channel Liquidity</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, value }) => `${name}: ${(value / 1000000).toFixed(2)}M sats`}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `${value.toLocaleString()} sats`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
