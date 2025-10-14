import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
}

export const StatCard = ({ title, value, icon: Icon }: StatCardProps) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div className="flex items-center">
        <div className="p-2 bg-gray-700 rounded-md mr-4">
          <Icon className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-xl font-bold truncate">{value}</p>
        </div>
      </div>
    </div>
  );
};
