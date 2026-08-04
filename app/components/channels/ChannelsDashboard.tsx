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
import { Alert } from "../ui/Alert";
import { ChannelLiquidityChart } from "../charts/ChannelLiquidityChart";
import { useLanguage } from "@/app/lib/language";
import { getLocale } from "@/app/lib/chartTheme";

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

const formatPubkeyLabel = (pubkey: string) => {
  if (!pubkey || pubkey === "N/A") return "N/A";
  return `${pubkey.substring(0, 6)}...${pubkey.substring(pubkey.length - 4)}`;
};

export const ChannelsDashboard = () => {
  const { t, language } = useLanguage();
  const [channels, setChannels] = useState<UnifiedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const locale = getLocale(language);
  const fmt = (value: number) => value.toLocaleString(locale);

  const statusMeta = useMemo(
    () =>
      ({
        active: {
          label: t("statuses.active"),
          icon: CheckCircle,
          chipClass: "bg-success-bg text-success ring-1 ring-success/30",
        },
        inactive: {
          label: t("statuses.inactive"),
          icon: XCircle,
          chipClass: "bg-danger-bg text-danger ring-1 ring-danger/30",
        },
        pending_open: {
          label: t("statuses.pending_open"),
          icon: Clock,
          chipClass: "bg-accent-subtle text-accent ring-1 ring-accent/30",
        },
        pending_closing: {
          label: t("statuses.pending_closing"),
          icon: Hourglass,
          chipClass: "bg-accent-subtle text-accent ring-1 ring-accent/30",
        },
        pending_force_closing: {
          label: t("statuses.pending_force_closing"),
          icon: AlertTriangle,
          chipClass: "bg-danger-bg text-danger ring-1 ring-danger/30",
        },
        waiting_close: {
          label: t("statuses.waiting_close"),
          icon: PauseCircle,
          chipClass: "bg-panel-elevated text-muted ring-1 ring-panel-edge",
        },
      } satisfies Record<ChannelStatusType, { label: string; icon: LucideIcon; chipClass: string }>),
    [t]
  );

  const ChannelStatusBadge = ({
    status,
    count,
  }: {
    status: UnifiedChannel["status"];
    count?: number;
  }) => {
    const meta = statusMeta[status];
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
            ? "bg-panel-elevated text-muted ring-1 ring-panel-edge"
            : "bg-accent-subtle text-accent ring-1 ring-accent/30"
        }`}
        title={
          isPrivate ? t("channels.types.privateTooltip") : t("channels.types.publicTooltip")
        }
      >
        {isPrivate ? (
          <Lock size={14} />
        ) : (
          <Globe size={14} />
        )}
        {isPrivate ? t("channels.types.private") : t("channels.types.public")}
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
      setError(t("channels.errors.fetch", { message: err?.message || "" }));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
        name: t("channels.chart.others"),
        outbound: aggregated.outbound,
        inbound: aggregated.inbound,
        total,
      });
    }

    return topData;
  }, [channels, t]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <main className="flex-grow overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isModalOpen && (
          <OpenChannelModal
            node={null}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleModalSuccess}
          />
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
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {t("channels.title")}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {t("channels.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => fetchData()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md border border-panel-edge bg-panel px-4 py-2.5 text-sm font-medium text-foreground hover:bg-panel-elevated disabled:opacity-60"
              >
                <Zap
                  className={`h-4 w-4 ${
                    loading ? "animate-spin-smooth text-accent" : "text-accent"
                  }`}
                />
                {t("channels.actions.refresh")}
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
              >
                <PlusCircle className="h-5 w-5" />
                {t("channels.actions.open")}
              </button>
            </div>
          </div>
          <div className="relative z-10 mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("channels.stats.outbound")}
              value={fmt(totalLocal)}
              unit={t("common.sats")}
              icon={ArrowUpRight}
            />
            <StatCard
              title={t("channels.stats.inbound")}
              value={fmt(totalRemote)}
              unit={t("common.sats")}
              icon={ArrowDownLeft}
            />
            <StatCard
              title={t("channels.stats.active")}
              value={activeCount}
              icon={Activity}
            />
            <StatCard
              title={t("channels.stats.pending")}
              value={pendingCount}
              icon={AlertTriangle}
            />
          </div>
          <div className="relative z-10 mt-6 flex flex-wrap gap-2">
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
              <span className="text-xs uppercase tracking-wide text-muted">
                {t("channels.status.none")}
              </span>
            )}
          </div>
        </div>

        {error && <Alert variant="danger" className="mb-6 text-left">{error}</Alert>}

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <ChannelLiquidityChart data={liquidityChartData} />
          </div>
          <div className="flex h-full flex-col rounded-lg border border-panel-edge bg-panel p-5">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <BarChart3 className="h-5 w-5 text-accent" />
              {t("channels.stats.snapshot")}
            </div>
            <dl className="space-y-3 text-sm text-foreground">
              <div className="flex items-center justify-between">
                <dt className="text-muted">{t("channels.stats.totalCapacity")}</dt>
                <dd className="font-amount font-semibold">
                  {fmt(totalCapacity)} {t("common.sats")}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">{t("channels.stats.averageActiveSize")}</dt>
                <dd className="font-amount font-semibold">
                  {averageActiveSize
                    ? averageActiveSize.toLocaleString(locale, {
                        maximumFractionDigits: 0,
                      })
                    : "0"}{" "}
                  {t("common.sats")}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">{t("channels.stats.activeUtilization")}</dt>
                <dd className="font-amount font-semibold">
                  {activeUtilization.toFixed(1)}%
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">{t("channels.stats.publicChannels")}</dt>
                <dd className="font-semibold">{publicCount}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">{t("channels.stats.privateChannels")}</dt>
                <dd className="font-semibold">{privateCount}</dd>
              </div>
            </dl>
            {channels.length === 0 && (
              <p className="mt-6 text-xs text-muted">
                {t("channels.stats.empty")}
              </p>
            )}
          </div>
        </div>

        <div className="bg-panel p-4 rounded-lg border border-panel-edge">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">{t("channels.table.title")}</h3>
            <div className="relative w-full max-w-xs">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                size={20}
              />
              <input
                type="text"
                placeholder={t("channels.table.search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-panel-edge bg-input pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Zap
                className="w-8 h-8 text-accent animate-spin-smooth"
                aria-label={t("admin.loading")}
                role="img"
              />
            </div>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-panel-edge text-xs uppercase tracking-wide text-muted">
                      <th className="p-2 font-semibold">{t("channels.table.status")}</th>
                      <th className="p-2 font-semibold">{t("channels.table.remotePeer")}</th>
                      <th className="p-2 font-semibold">
                        {t("channels.table.localBalance")}
                      </th>
                      <th className="p-2 font-semibold">
                        {t("channels.table.remoteBalance")}
                      </th>
                      <th className="p-2 font-semibold">
                        {t("channels.table.capacity")}
                      </th>
                      <th className="p-2 font-semibold">{t("channels.table.type")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedChannels.length > 0 ? (
                      paginatedChannels.map((channel) => (
                        <tr
                          key={channel.channelPoint}
                          className="border-b border-panel-edge transition-colors hover:bg-panel-elevated last:border-0"
                        >
                          <td className="p-2 align-middle">
                            <ChannelStatusBadge status={channel.status} />
                          </td>
                          <td
                            className="p-2 align-middle font-address text-xs sm:text-sm"
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
                          <td className="p-2 align-middle">
                            <CopyableCell
                              fullText={fmt(channel.localBalance)}
                              copiedText={copiedText}
                              onCopy={handleCopy}
                            >
                              <span className="font-amount font-semibold text-accent">
                                {fmt(channel.localBalance)}
                              </span>{" "}
                              <span className="text-xs text-muted">
                                {t("common.sats")}
                              </span>
                            </CopyableCell>
                          </td>
                          <td className="p-2 align-middle">
                            <CopyableCell
                              fullText={fmt(channel.remoteBalance)}
                              copiedText={copiedText}
                              onCopy={handleCopy}
                            >
                              <span className="font-amount font-semibold text-credit">
                                {fmt(channel.remoteBalance)}
                              </span>{" "}
                              <span className="text-xs text-muted">
                                {t("common.sats")}
                              </span>
                            </CopyableCell>
                          </td>
                          <td className="p-2 align-middle">
                            <CopyableCell
                              fullText={fmt(channel.capacity)}
                              copiedText={copiedText}
                              onCopy={handleCopy}
                            >
                              <span className="font-amount">
                                {fmt(channel.capacity)}
                              </span>{" "}
                              {t("common.sats")}
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
                          className="p-8 text-center text-sm text-muted"
                        >
                          {searchTerm
                            ? t("channels.table.emptySearch", { query: searchTerm })
                            : t("channels.table.empty")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="sm:hidden space-y-3">
                {paginatedChannels.length > 0 ? (
                  paginatedChannels.map((channel) => (
                    <div
                      key={channel.channelPoint}
                      className="rounded-lg border border-panel-edge bg-panel-elevated p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <ChannelStatusBadge status={channel.status} />
                        <ChannelTypeBadge isPrivate={channel.privateChannel} />
                      </div>
                      <p
                        className="font-address text-xs break-all text-foreground"
                        title={channel.remotePubkey}
                      >
                        {channel.remotePubkey}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-accent">
                          <span className="font-amount font-semibold">
                            {fmt(channel.localBalance)}
                          </span>{" "}
                          <span className="text-xs text-muted">{t("common.sats")}</span>
                        </span>
                        <span className="text-credit">
                          <span className="font-amount font-semibold">
                            {fmt(channel.remoteBalance)}
                          </span>{" "}
                          <span className="text-xs text-muted">{t("common.sats")}</span>
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 text-xs text-muted">
                        <div className="flex items-center justify-between">
                          <span>{t("channels.table.capacity")}</span>
                          <span className="font-amount text-foreground">
                            {fmt(channel.capacity)} {t("common.sats")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>{t("channels.table.remotePeer")}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(channel.channelPoint)}
                            className="max-w-[60%] truncate font-address text-foreground hover:text-accent"
                            title={channel.channelPoint}
                          >
                            {channel.channelPoint}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-muted">
                    {searchTerm
                      ? t("channels.table.emptySearch", { query: searchTerm })
                      : t("channels.table.empty")}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || totalPages === 0}
                  className="flex items-center rounded-md border border-panel-edge bg-panel px-4 py-2 text-sm font-medium text-foreground hover:bg-panel-elevated disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  {t("channels.pagination.previous")}
                </button>
                <span className="text-muted">
                  {t("channels.pagination.pageOf", {
                    current: totalPages > 0 ? currentPage : 0,
                    total: totalPages,
                  })}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="flex items-center rounded-md border border-panel-edge bg-panel px-4 py-2 text-sm font-medium text-foreground hover:bg-panel-elevated disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("channels.pagination.next")}
                  <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
};
