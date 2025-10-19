"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { apiCall } from "@/app/lib/api";
import {
  PlusCircle,
  Zap,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Clock,
  Hourglass,
  PauseCircle,
  BarChart3,
  Lock,
  Globe,
  LucideIcon,
} from "lucide-react";
import { OpenChannelModal } from "./OpenChannelModal";
import { StatCard } from "../ui/StatCard";
import { CopyableCell } from "../ui/CopyableCell";
import { ChannelLiquidityChart } from "../charts/ChannelLiquidityChart";

type ChannelStatusType =
  | "active"
  | "inactive"
  | "pending_open"
  | "pending_closing"
  | "pending_force_closing"
  | "waiting_close";

interface UnifiedChannel {
  channelPoint: string;
  remotePubkey: string;
  capacity: number;
  localBalance: number;
  remoteBalance: number;
  active: boolean; 
  privateChannel: boolean;
  status: ChannelStatusType;
}

const ITEMS_PER_PAGE = 10;

const CHANNEL_STATUS_META: Record<
  ChannelStatusType,
  {
    label: string;
    icon: LucideIcon;
    chipClass: string;
  }
> = {
  active: {
    label: "Active",
    icon: CheckCircle,
    chipClass:
      "bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-500/30",
  },
  inactive: {
    label: "Inactive",
    icon: XCircle,
    chipClass: "bg-rose-500/10 text-rose-200 ring-1 ring-rose-500/30",
  },
  pending_open: {
    label: "Pending Open",
    icon: Clock,
    chipClass: "bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/30",
  },
  pending_closing: {
    label: "Pending Close",
    icon: Hourglass,
    chipClass: "bg-blue-500/10 text-blue-200 ring-1 ring-blue-500/30",
  },
  pending_force_closing: {
    label: "Force Closing",
    icon: AlertTriangle,
    chipClass:
      "bg-orange-500/10 text-orange-200 ring-1 ring-orange-500/30",
  },
  waiting_close: {
    label: "Waiting Close",
    icon: PauseCircle,
    chipClass: "bg-indigo-500/10 text-indigo-200 ring-1 ring-indigo-500/30",
  },
};

const formatPubkeyLabel = (pubkey: string) => {
  if (!pubkey || pubkey === "N/A") return "N/A";
  return `${pubkey.substring(0, 6)}...${pubkey.substring(pubkey.length - 4)}`;
};

export const ChannelsDashboard = () => {
  const [channels, setChannels] = useState<UnifiedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const ChannelStatusBadge = ({
    status,
    count,
  }: {
    status: UnifiedChannel["status"];
    count?: number;
  }) => {
    const meta = CHANNEL_STATUS_META[status];
    if (!meta) return null;
    const StatusIcon = meta.icon;
    return (
      <span
        title={meta.label}
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${meta.chipClass}`}
      >
        <StatusIcon size={14} className="mr-1" />
        {meta.label}
        {typeof count === "number" && (
          <span className="ml-2 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            {count}
          </span>
        )}
      </span>
    );
  };

  const ChannelTypeBadge = ({ isPrivate }: { isPrivate: boolean }) => {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
          isPrivate
            ? "bg-purple-500/10 text-purple-200 ring-1 ring-purple-500/30"
            : "bg-sky-500/10 text-sky-200 ring-1 ring-sky-500/30"
        }`}
        title={isPrivate ? "Private Channel" : "Public Channel"}
      >
        {isPrivate ? (
          <Lock size={14} className="text-purple-300" />
        ) : (
          <Globe size={14} className="text-sky-300" />
        )}
        {isPrivate ? "Private" : "Public"}
      </span>
    );
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const channelsData = await apiCall("/admin/channels");

      const openChannels: UnifiedChannel[] = (
        channelsData.openChannels || []
      ).map((c: any) => ({
        ...c,
        status: c.active ? "active" : "inactive",
      }));

      const processPending = (
        pendingList: any[],
        status: UnifiedChannel["status"]
      ): UnifiedChannel[] => {
        if (!pendingList) return [];
        return pendingList.map((p: any) => ({
          channelPoint: p.channel?.channelPoint || "N/A",
          remotePubkey: p.channel?.remoteNodePub || "N/A",
          capacity: p.channel?.capacity || 0,
          localBalance: p.channel?.localBalance || 0,
          remoteBalance: p.channel?.remoteBalance || 0,
          active: false,
          privateChannel: p.channel?.privateChannel || false,
          status: status,
        }));
      };

      const pendingOpen = processPending(
        channelsData.pendingChannels?.pendingOpenChannels,
        "pending_open"
      );
      const pendingClosing = processPending(
        channelsData.pendingChannels?.pendingClosingChannels,
        "pending_closing"
      );
      const pendingForceClosing = processPending(
        channelsData.pendingChannels?.pendingForceClosingChannels,
        "pending_force_closing"
      );
      const waitingClose = processPending(
        channelsData.pendingChannels?.waitingCloseChannels,
        "waiting_close"
      );

      setChannels([
        ...openChannels,
        ...pendingOpen,
        ...pendingClosing,
        ...pendingForceClosing,
        ...waitingClose,
      ]);
    } catch (err: any) {
      setError("Failed to fetch open channels: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleModalSuccess = () => {
    fetchData();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const filteredChannels = useMemo(() => {
    return channels.filter((channel) =>
      channel.remotePubkey.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [channels, searchTerm]);

  const {
    totalLocal,
    totalRemote,
    activeCount,
    pendingCount,
    publicCount,
    privateCount,
    totalCapacity,
    activeCapacity,
    activeUtilization,
    averageActiveSize,
  } = useMemo(() => {
    let totalLocal = 0;
    let totalRemote = 0;
    let activeCount = 0;
    let pendingCount = 0;
    let publicCount = 0;
    let privateCount = 0;
    let totalCapacity = 0;
    let activeCapacity = 0;

    for (const channel of channels) {
      totalCapacity += channel.capacity;
      if (channel.privateChannel) {
        privateCount++;
      } else {
        publicCount++;
      }

      if (channel.status === "active") {
        totalLocal += channel.localBalance;
        totalRemote += channel.remoteBalance;
        activeCapacity += channel.capacity;
        activeCount++;
      } else {
        pendingCount++;
      }
    }

    const activeUtilization =
      activeCapacity > 0 ? (totalLocal / activeCapacity) * 100 : 0;
    const averageActiveSize =
      activeCount > 0 ? activeCapacity / activeCount : 0;

    return {
      totalLocal,
      totalRemote,
      activeCount,
      pendingCount,
      publicCount,
      privateCount,
      totalCapacity,
      activeCapacity,
      activeUtilization,
      averageActiveSize,
    };
  }, [channels]);

  const totalPages = Math.ceil(filteredChannels.length / ITEMS_PER_PAGE);
  const paginatedChannels = filteredChannels.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const statusBreakdown = useMemo(() => {
    const counts: Record<ChannelStatusType, number> = {
      active: 0,
      inactive: 0,
      pending_open: 0,
      pending_closing: 0,
      pending_force_closing: 0,
      waiting_close: 0,
    };

    for (const channel of channels) {
      counts[channel.status] = (counts[channel.status] || 0) + 1;
    }

    return counts;
  }, [channels]);

  const liquidityChartData = useMemo(() => {
    const activeChannels = channels.filter(
      (channel) => channel.status === "active"
    );

    if (activeChannels.length === 0) {
      return [];
    }

    const sorted = [...activeChannels].sort(
      (a, b) => b.capacity - a.capacity
    );
    const topFive = sorted.slice(0, 5);
    const others = sorted.slice(5);

    const topData = topFive.map((channel) => {
      const outbound = Math.max(channel.localBalance, 0);
      const inbound = Math.max(channel.remoteBalance, 0);
      const total = outbound + inbound || channel.capacity || 1;

      return {
        name: formatPubkeyLabel(channel.remotePubkey),
        outbound,
        inbound,
        total,
      };
    });

    if (others.length > 0) {
      const aggregated = others.reduce(
        (acc, channel) => {
          acc.outbound += Math.max(channel.localBalance, 0);
          acc.inbound += Math.max(channel.remoteBalance, 0);
          return acc;
        },
        { outbound: 0, inbound: 0 }
      );

      const total = aggregated.outbound + aggregated.inbound || 1;

      topData.push({
        name: "Others",
        outbound: aggregated.outbound,
        inbound: aggregated.inbound,
        total,
      });
    }

    return topData;
  }, [channels]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <main className="flex-grow p-4 sm:p-8 overflow-y-auto">
      {isModalOpen && (
        <OpenChannelModal
          node={null}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      <div className="mb-8 rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900/90 via-gray-900 to-gray-800 px-6 py-6 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Channels</h2>
            <p className="mt-1 text-sm text-gray-400">
              Monitor liquidity, channel health, and privacy posture at a glance.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800/70 px-4 py-2 text-sm font-semibold text-gray-200 shadow hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-60"
            >
              <Zap
                className={`h-4 w-4 ${loading ? "animate-spin text-yellow-300" : "text-yellow-400"}`}
              />
              Refresh
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-green-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <PlusCircle className="h-5 w-5" />
              Open Channel
            </button>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Outbound Liquidity"
            value={totalLocal.toLocaleString()}
            unit="sats"
            icon={ArrowUpRight}
          />
          <StatCard
            title="Inbound Liquidity"
            value={totalRemote.toLocaleString()}
            unit="sats"
            icon={ArrowDownLeft}
          />
          <StatCard
            title="Active Channels"
            value={activeCount}
            icon={Activity}
          />
          <StatCard
            title="Inactive / Pending"
            value={pendingCount}
            icon={AlertTriangle}
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {Object.entries(statusBreakdown)
            .filter(([, count]) => count > 0)
            .map(([status, count]) => (
              <ChannelStatusBadge
                key={status}
                status={status as ChannelStatusType}
                count={count}
              />
            ))}
          {channels.length === 0 && (
            <span className="text-xs uppercase tracking-wide text-gray-500">
              No channels yet
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500 bg-red-500/15 px-4 py-3 text-red-200">
          {error}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChannelLiquidityChart data={liquidityChartData} />
        </div>
        <div className="flex h-full flex-col rounded-lg border border-gray-700 bg-gray-800/80 p-5">
          <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            Channel Snapshot
          </div>
          <dl className="space-y-3 text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <dt>Total Capacity</dt>
              <dd className="font-semibold text-white">
                {totalCapacity.toLocaleString()} sats
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Avg. Active Size</dt>
              <dd className="font-semibold text-white">
                {averageActiveSize ? averageActiveSize.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"} sats
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Active Utilization</dt>
              <dd className="font-semibold text-white">
                {activeUtilization.toFixed(1)}%
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Public Channels</dt>
              <dd className="font-semibold text-white">{publicCount}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Private Channels</dt>
              <dd className="font-semibold text-white">{privateCount}</dd>
            </div>
          </dl>
          {channels.length === 0 && (
            <p className="mt-6 text-xs text-gray-500">
              Open a channel to populate analytics.
            </p>
          )}
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Channel List</h3>
          <div className="relative w-full max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by remote pubkey..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900/60 pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-transparent"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Zap className="w-8 h-8 text-yellow-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700/60 text-xs uppercase tracking-wide text-gray-400">
                    <th className="p-2 font-semibold">Status</th>
                    <th className="p-2 font-semibold">Remote Peer</th>
                    <th className="p-2 font-semibold hidden md:table-cell">
                      Local Balance
                    </th>
                    <th className="p-2 font-semibold hidden md:table-cell">
                      Remote Balance
                    </th>
                    <th className="p-2 font-semibold hidden lg:table-cell">
                      Capacity
                    </th>
                    <th className="p-2 font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedChannels.length > 0 ? (
                    paginatedChannels.map((channel) => (
                      <tr
                        key={channel.channelPoint}
                        className="border-b border-gray-800/70 transition-colors hover:bg-gray-800/60 last:border-0"
                      >
                        <td className="p-2 align-middle">
                          <ChannelStatusBadge status={channel.status} />
                        </td>
                        <td
                          className="p-2 align-middle font-mono text-xs sm:text-sm"
                          title={channel.remotePubkey}
                        >
                          <CopyableCell
                            fullText={channel.remotePubkey}
                            copiedText={copiedText}
                            onCopy={handleCopy}
                          >
                            {formatPubkeyLabel(channel.remotePubkey)}
                          </CopyableCell>
                        </td>
                        <td className="p-2 align-middle hidden md:table-cell">
                          <CopyableCell
                            fullText={channel.localBalance.toLocaleString()}
                            copiedText={copiedText}
                            onCopy={handleCopy}
                          >
                            <span className="font-semibold text-emerald-200">
                              {channel.localBalance.toLocaleString()}
                            </span>{" "}
                            <span className="text-xs text-gray-400">sats</span>
                          </CopyableCell>
                        </td>
                        <td className="p-2 align-middle hidden md:table-cell">
                          <CopyableCell
                            fullText={channel.remoteBalance.toLocaleString()}
                            copiedText={copiedText}
                            onCopy={handleCopy}
                          >
                            <span className="font-semibold text-blue-200">
                              {channel.remoteBalance.toLocaleString()}
                            </span>{" "}
                            <span className="text-xs text-gray-400">sats</span>
                          </CopyableCell>
                        </td>
                        <td className="p-2 align-middle hidden lg:table-cell">
                          <CopyableCell
                            fullText={channel.capacity.toLocaleString()}
                            copiedText={copiedText}
                            onCopy={handleCopy}
                          >
                            {channel.capacity.toLocaleString()}{" "}
                            <span className="text-xs text-gray-400">sats</span>
                          </CopyableCell>
                        </td>
                        <td className="p-2 align-middle">
                          <ChannelTypeBadge isPrivate={channel.privateChannel} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-sm text-gray-500"
                      >
                        {searchTerm
                          ? `No channels match "${searchTerm}".`
                          : "You have no channels yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || totalPages === 0}
                className="flex items-center rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} className="mr-1" />
                Previous
              </button>
              <span className="text-gray-400">
                Page {totalPages > 0 ? currentPage : 0} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
};
