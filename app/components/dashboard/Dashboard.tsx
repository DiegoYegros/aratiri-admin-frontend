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
import { Alert } from "../ui/Alert";
import { LiquidityPieChart } from "../charts/LiquidityPieChart";
import { TransactionLineChart } from "../charts/TransactionLineChart";
import { useLanguage } from "@/app/lib/language";

interface ChannelBalance {
  localBalance: number;
  remoteBalance: number;
}

export const Dashboard = ({ refreshKey }: { refreshKey: number }) => {
  const { t, language } = useLanguage();
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
      setError(
        t("dashboard.errors.fetch", { message: err?.message || "" })
      );
    }
  }, [t]);

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
      <main className="flex-grow flex items-center justify-center">
        <Server
          className="w-16 h-16 text-accent animate-calm-busy"
          aria-label={t("admin.loading")}
          role="img"
        />
      </main>
    );
  }

  return (
    <main className="flex-grow overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {error && (
        <Alert variant="danger" className="mb-6 text-left">{error}</Alert>
      )}

      <div className="relative mb-8 overflow-hidden rounded-2xl border border-panel-edge bg-panel px-6 py-6">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(90% 70% at 50% 45%, rgba(201,162,39,0.08), transparent 58%)",
          }}
        />
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {t("dashboard.title")}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {t("dashboard.subtitle")}
          </p>
        </div>
      </div>

      {nodeInfo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t("dashboard.stats.alias")}
            value={nodeInfo.alias}
            icon={Info}
          />
          <StatCard
            title={t("dashboard.stats.version")}
            value={nodeInfo.version}
            icon={Package}
          />
          <StatCard
            title={t("dashboard.stats.blockHeight")}
            value={nodeInfo.blockHeight.toLocaleString(
              language === "es" ? "es-ES" : "en-US"
            )}
            icon={Hash}
          />
          <StatCard
            title={t("dashboard.stats.commitHash")}
            value={nodeInfo.commitHash}
            icon={GitCommit}
          />
          <StatCard
            title={t("dashboard.stats.peers")}
            value={nodeInfo.numPeers}
            icon={Users}
          />
          <StatCard
            title={t("dashboard.stats.activeChannels")}
            value={nodeInfo.numActiveChannels}
            icon={Link2}
          />
          <StatCard
            title={t("dashboard.stats.pendingChannels")}
            value={nodeInfo.numPendingChannels}
            icon={Link2}
          />
          <StatCard
            title={t("dashboard.stats.network")}
            value={nodeInfo.chains[0]?.network || t("common.notAvailable")}
            icon={Network}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="min-w-0">
          {channelBalance && <LiquidityPieChart data={channelBalance} />}
        </div>
        <div className="min-w-0">
          <TransactionLineChart data={transactionStats} />
        </div>
      </div>
      </div>
    </main>
  );
};

