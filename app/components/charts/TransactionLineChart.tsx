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

interface TransactionStat {
  date: string;
  type: "credit" | "debit";
  count: number;
}

export const TransactionLineChart = ({ data }: { data: TransactionStat[] }) => {
  const processData = () => {
    const dailyData: { [key: string]: { date: string; credit: number; debit: number } } = {};

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

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 h-full">
      <h3 className="text-lg font-bold mb-4">Transaction Volume (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis dataKey="date" stroke="#A0AEC0" />
          <YAxis stroke="#A0AEC0" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A202C",
              border: "1px solid #4A5568",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="credit"
            stroke="#34D399"
            name="Credits"
          />
          <Line
            type="monotone"
            dataKey="debit"
            stroke="#FBBF24"
            name="Debits"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
