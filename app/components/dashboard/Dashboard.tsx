"use client";
import { apiCall, NodeInfo, TransactionStat } from "@/app/lib/api";
import {
  GitCommit,
  Hash,
  Info,
  Link2,
  Network,
  Package,
  Server,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { StatCard } from "../ui/StatCard";
import { LiquidityPieChart } from "../charts/LiquidityPieChart";
import { TransactionLineChart } from "../charts/TransactionLineChart";

interface ChannelBalance {
  localBalance: number;
  remoteBalance: number;
}

export const Dashboard = ({ refreshKey }: { refreshKey: number }) => {
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [channelBalance, setChannelBalance] = useState<ChannelBalance | null>(
    null
  );
  const [transactionStats, setTransactionStats] = useState<TransactionStat[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setError("");
    try {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 30);
      const fromDate = from.toISOString().split("T")[0];
      const toDate = to.toISOString().split("T")[0];

      const [nodeData, balanceData, statsData] = await Promise.all([
        apiCall("/admin/node-info"),
        apiCall("/admin/channel-balance"),
        apiCall(`/admin/transaction-stats?from=${fromDate}&to=${toDate}`),
      ]);
      setNodeInfo(nodeData);
      setChannelBalance({
        localBalance: balanceData.local_balance.sat,
        remoteBalance: balanceData.remote_balance.sat,
      });
      setTransactionStats(statsData.stats);
    } catch (err: any) {
      setError("Failed to fetch dashboard data: " + err.message);
    }
  }, []);

  useEffect(() => {
    if (refreshKey === 0) {
      setLoading(true);
      fetchDashboardData().finally(() => setLoading(false));
    } else {
      fetchDashboardData();
    }
  }, [fetchDashboardData, refreshKey]);

  if (loading) {
    return (
      <main className="flex-grow p-8 flex items-center justify-center">
        <Server className="w-16 h-16 text-yellow-400 animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-grow p-4 sm:p-8 overflow-y-auto">
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {nodeInfo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Alias" value={nodeInfo.alias} icon={Info} />
          <StatCard title="Version" value={nodeInfo.version} icon={Package} />
          <StatCard
            title="Block Height"
            value={nodeInfo.blockHeight.toLocaleString()}
            icon={Hash}
          />
          <StatCard
            title="Commit Hash"
            value={nodeInfo.commitHash}
            icon={GitCommit}
          />
          <StatCard title="Peers" value={nodeInfo.numPeers} icon={Users} />
          <StatCard
            title="Active Channels"
            value={nodeInfo.numActiveChannels}
            icon={Link2}
          />
          <StatCard
            title="Pending Channels"
            value={nodeInfo.numPendingChannels}
            icon={Link2}
          />
          <StatCard
            title="Network"
            value={
              nodeInfo.chains[0]?.network || "N/A"
            }
            icon={Network}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {channelBalance && <LiquidityPieChart data={channelBalance} />}
        {transactionStats.length > 0 && (
          <TransactionLineChart data={transactionStats} />
        )}
      </div>
    </main>
  );
};