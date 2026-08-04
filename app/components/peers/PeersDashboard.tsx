"use client";
import { useState, useEffect, useMemo, useCallback, FormEvent } from "react";
import { apiCall } from "@/app/lib/api";
import {
  Zap,
  ChevronLeft,
  ChevronRight,
  Search,
  Wifi,
  Users,
  Settings as SettingsIcon,
  Loader2,
  PlusCircle,
  Star,
  ClipboardCopy,
  Check,
} from "lucide-react";
import { OpenChannelModal } from "../channels/OpenChannelModal";
import { CopyableCell } from "../ui/CopyableCell";
import { StatCard } from "../ui/StatCard";
import { Alert } from "../ui/Alert";
import { useLanguage } from "@/app/lib/language";
import { getLocale } from "@/app/lib/chartTheme";

interface RemoteNode {
  pubKey: string;
  alias: string;
  addresses: string[];
  capacity: number;
  numChannels: number;
  betweennessCentrality: number;
}

interface Peer {
  pubKey: string;
  address: string;
}

const ITEMS_PER_PAGE = 10;

export const PeersDashboard = () => {
  const { t, language } = useLanguage();
  const [recommendedNodes, setRecommendedNodes] = useState<RemoteNode[]>([]);
  const [connectedPeers, setConnectedPeers] = useState<Peer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<RemoteNode | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [connectingNode, setConnectingNode] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [manualPubKey, setManualPubKey] = useState("");
  const [manualHost, setManualHost] = useState("");
  const [manualConnectLoading, setManualConnectLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [nodeIdentity, setNodeIdentity] = useState<{
    pubkey: string;
    uris: string[];
  } | null>(null);

  const [isAutoManageEnabled, setIsAutoManageEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");
  const [updatingSettings, setUpdatingSettings] = useState(false);

  const locale = getLocale(language);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nodesData, peersData, nodeInfo] = await Promise.all([
        apiCall("/admin/remotes"),
        apiCall("/admin/peers"),
        apiCall("/admin/node-info"),
      ]);

      const connectedPubkeys = new Set(
        (peersData || []).map((p: Peer) => p.pubKey)
      );

      setConnectedPeers(peersData || []);
      setRecommendedNodes(
        (nodesData.nodes || []).filter(
          (node: RemoteNode) => !connectedPubkeys.has(node.pubKey)
        )
      );
      setNodeIdentity({
        pubkey: nodeInfo?.identityPubkey || "",
        uris: Array.isArray(nodeInfo?.uris)
          ? nodeInfo.uris.filter(
              (uri: unknown): uri is string =>
                typeof uri === "string" && uri.length > 0
            )
          : [],
      });
    } catch (err: any) {
      setError(t("peers.errors.fetch", { message: err?.message || "" }));
      setNodeIdentity(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError("");
    try {
      const settingsData = await apiCall("/admin/settings");
      setIsAutoManageEnabled(settingsData.auto_manage_peers || false);
    } catch (err: any) {
      setSettingsError(
        t("peers.errors.fetch", { message: err?.message || "" })
      );
      setIsAutoManageEnabled(false);
    } finally {
      setSettingsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, [fetchData, fetchSettings]);

  const handleToggleAutoManage = async () => {
    const newState = !isAutoManageEnabled;
    setUpdatingSettings(true);
    setSettingsError("");
    try {
      await apiCall("/admin/settings/auto-manage-peers", {
        method: "PUT",
        body: JSON.stringify({ enabled: newState }),
      });
      setIsAutoManageEnabled(newState);
    } catch (err: any) {
      setSettingsError(
        t("peers.errors.connect", {
          name: t("peers.stats.autoManage"),
          message: err?.message || "",
        })
      );
      setIsAutoManageEnabled(!newState);
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleOpenModal = (node: RemoteNode | null) => {
    setSelectedNode(node);
    setIsModalOpen(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleConnect = async (node: RemoteNode) => {
    setConnectingNode(node.pubKey);
    setError("");
    setSuccessMessage("");
    try {
      const host = node.addresses[0];
      if (!host) {
        throw new Error(t("peers.connectButton.noAddress"));
      }
      await apiCall("/admin/connect-peer", {
        method: "POST",
        body: JSON.stringify({ pubkey: node.pubKey, host }),
      });
      await fetchData();
      const name = node.alias || node.pubKey.substring(0, 10);
      setSuccessMessage(t("peers.success.connected", { name }));
    } catch (err: any) {
      const name = node.alias || node.pubKey.substring(0, 10);
      setError(
        t("peers.errors.connect", { name, message: err?.message || "" })
      );
    } finally {
      setConnectingNode(null);
    }
  };

  const handleManualConnect = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    if (!manualPubKey.trim() || !manualHost.trim()) {
      setError(t("peers.errors.manualRequired"));
      return;
    }

    setManualConnectLoading(true);
    try {
      await apiCall("/admin/connect-peer", {
        method: "POST",
        body: JSON.stringify({
          pubkey: manualPubKey.trim(),
          host: manualHost.trim(),
        }),
      });
      setManualPubKey("");
      setManualHost("");
      await fetchData();
      const name = manualPubKey.trim().substring(0, 16) + "...";
      setSuccessMessage(t("peers.success.connected", { name }));
    } catch (err: any) {
      setError(t("peers.errors.manual", { message: err?.message || "" }));
    } finally {
      setManualConnectLoading(false);
    }
  };

  const filteredRecommendedNodes = useMemo(() => {
    if (!recommendedNodes) return [];
    return recommendedNodes.filter((node) =>
      (node.alias || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recommendedNodes, searchTerm]);

  const totalRecommendedCapacity = useMemo(
    () =>
      recommendedNodes.reduce(
        (sum, node) => sum + (node.capacity || 0),
        0
      ),
    [recommendedNodes]
  );

  const totalPages = Math.ceil(filteredRecommendedNodes.length / ITEMS_PER_PAGE);
  const paginatedRecommendedNodes = filteredRecommendedNodes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const autoManageLabel = isAutoManageEnabled
    ? t("common.enabled")
    : t("common.disabled");

  const headerButtonClass =
    "inline-flex items-center gap-2 rounded-md border border-panel-edge bg-panel px-4 py-2.5 text-sm font-medium text-foreground hover:bg-panel-elevated disabled:cursor-not-allowed disabled:opacity-60";

  const ConnectButton = ({ node }: { node: RemoteNode }) => {
    const noAddress = !node.addresses || node.addresses.length === 0;
    return (
      <button
        onClick={() => handleConnect(node)}
        disabled={connectingNode === node.pubKey || noAddress}
        className="w-full inline-flex items-center justify-center rounded-md bg-success-bg px-3 py-2 text-sm font-semibold text-success border border-success/30 hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-60"
        title={noAddress ? t("peers.connectButton.noAddress") : t("peers.connectButton.connect")}
      >
        {connectingNode === node.pubKey ? (
          <>
            <Wifi size={16} className="mr-1 animate-pulse" />
            {t("peers.connectButton.connecting")}
          </>
        ) : (
          t("peers.connectButton.connect")
        )}
      </button>
    );
  };

  return (
    <main className="flex-grow overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isModalOpen && (
          <OpenChannelModal
            node={selectedNode}
            onClose={() => setIsModalOpen(false)}
            onSuccess={fetchData}
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
                {t("peers.title")}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {t("peers.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => nodeIdentity?.pubkey && handleCopy(nodeIdentity.pubkey)}
                disabled={!nodeIdentity?.pubkey}
                className={headerButtonClass}
                title={nodeIdentity?.pubkey || t("peers.nodeIdentity.pubkeyUnavailable")}
              >
                {copiedText === nodeIdentity?.pubkey ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <ClipboardCopy className="h-4 w-4 text-accent" />
                )}
                {copiedText === nodeIdentity?.pubkey
                  ? t("common.copied")
                  : t("peers.actions.copyPubkey")}
              </button>
              <button
                onClick={() =>
                  nodeIdentity?.uris?.[0] && handleCopy(nodeIdentity.uris[0])
                }
                disabled={!nodeIdentity?.uris?.length}
                className={headerButtonClass}
                title={
                  nodeIdentity?.uris?.length
                    ? nodeIdentity.uris.join("\n")
                    : t("peers.nodeIdentity.uriUnavailable")
                }
              >
                {copiedText === nodeIdentity?.uris?.[0] ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <ClipboardCopy className="h-4 w-4 text-accent" />
                )}
                {copiedText === nodeIdentity?.uris?.[0]
                  ? t("common.copied")
                  : t("peers.actions.copyUri")}
              </button>
              <button
                onClick={() => fetchData()}
                disabled={loading}
                className={headerButtonClass}
              >
                <Zap
                  className={`h-4 w-4 ${
                    loading ? "animate-spin-smooth text-accent" : "text-accent"
                  }`}
                />
                {t("peers.actions.refresh")}
              </button>
              <button
                onClick={() => handleOpenModal(null)}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
              >
                <PlusCircle className="h-5 w-5" />
                {t("peers.actions.openChannel")}
              </button>
            </div>
          </div>
          <div className="relative z-10 mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("peers.stats.connected")}
              value={connectedPeers.length}
              icon={Users}
            />
            <StatCard
              title={t("peers.stats.recommended")}
              value={recommendedNodes.length}
              icon={Star}
            />
            <StatCard
              title={t("peers.stats.autoManage")}
              value={autoManageLabel}
              icon={SettingsIcon}
            />
            <StatCard
              title={t("peers.stats.recommendedCapacity")}
              value={totalRecommendedCapacity.toLocaleString(locale)}
              unit={t("common.sats")}
              icon={Wifi}
            />
          </div>
        </div>

        <div className="mb-8 rounded-lg border border-panel-edge bg-panel p-5">
          <h3 className="mb-3 flex items-center text-lg font-bold">
            <SettingsIcon className="mr-2 h-5 w-5 text-accent" />
            {t("peers.settings.title")}
          </h3>
          {settingsLoading ? (
            <div className="flex items-center text-muted">
              <Loader2 className="mr-2 h-4 w-4 animate-spin-smooth text-accent" />
              {t("peers.settings.loading")}
            </div>
          ) : (
            <div>
              {settingsError && (
                <Alert variant="danger" className="mb-3 text-left">
                  {settingsError}
                </Alert>
              )}
              <div className="flex items-center space-x-3">
                <label
                  htmlFor="autoManageToggle"
                  className="flex cursor-pointer items-center"
                >
                  <div className="relative">
                    <input
                      id="autoManageToggle"
                      type="checkbox"
                      className="sr-only"
                      checked={isAutoManageEnabled}
                      onChange={handleToggleAutoManage}
                      disabled={updatingSettings}
                    />
                    <div
                      className={`block h-6 w-10 rounded-full transition ${
                        isAutoManageEnabled ? "bg-success" : "bg-panel-elevated"
                      }`}
                    ></div>
                    <div
                      className={`dot absolute left-1 top-1 h-4 w-4 rounded-full bg-foreground transition-transform ${
                        isAutoManageEnabled ? "translate-x-4" : ""
                      }`}
                    ></div>
                  </div>
                  <div className="ml-3 text-foreground">
                    {t("peers.settings.toggleDescription")}
                  </div>
                </label>
                {updatingSettings && (
                  <Loader2 className="h-4 w-4 animate-spin-smooth text-accent" />
                )}
              </div>
              <p className="mt-1 text-xs text-muted">
                {t("peers.settings.helper")}
              </p>
            </div>
          )}
        </div>

        {error && <Alert variant="danger" className="mb-6 text-left">{error}</Alert>}
        {successMessage && (
          <Alert variant="success" className="mb-6">{successMessage}</Alert>
        )}

        <div className="mb-8 rounded-lg border border-panel-edge bg-panel p-5">
          <h3 className="mb-3 flex items-center text-lg font-bold">
            <Wifi className="mr-2 h-5 w-5 text-accent" />
            {t("peers.manual.title")}
          </h3>
          <p className="mb-4 text-sm text-muted">
            {t("peers.manual.description")}
          </p>
          <form
            onSubmit={handleManualConnect}
            className="flex flex-col gap-3 md:flex-row md:items-end"
          >
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                {t("peers.manual.peerPubkey")}
              </label>
              <input
                type="text"
                value={manualPubKey}
                onChange={(e) => setManualPubKey(e.target.value)}
                placeholder={t("peers.manual.pubkeyPlaceholder")}
                className="w-full rounded-lg border border-panel-edge bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent font-address"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                {t("peers.manual.host")}
              </label>
              <input
                type="text"
                value={manualHost}
                onChange={(e) => setManualHost(e.target.value)}
                placeholder={t("peers.manual.hostPlaceholder")}
                className="w-full rounded-lg border border-panel-edge bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            <button
              type="submit"
              disabled={manualConnectLoading}
              className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {manualConnectLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin-smooth" />
                  {t("peers.manual.submitting")}
                </>
              ) : (
                t("peers.manual.submit")
              )}
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-panel-edge bg-panel p-5">
          <h3 className="mb-4 flex items-center text-lg font-bold">
            <Users className="mr-2 h-5 w-5 text-credit" />
            {t("peers.connectedPeers.title", { count: connectedPeers.length })}
          </h3>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Zap
                className="h-8 w-8 animate-spin-smooth text-accent"
                aria-label={t("admin.loading")}
                role="img"
              />
            </div>
          ) : (
            <div className="max-h-64 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-panel-edge text-xs uppercase tracking-wide text-muted">
                    <th className="p-2 font-semibold">
                      {t("peers.connectedPeers.address")}
                    </th>
                    <th className="p-2 font-semibold">
                      {t("peers.connectedPeers.pubkey")}
                    </th>
                    <th className="p-2 font-semibold">
                      {t("peers.connectedPeers.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {connectedPeers.length > 0 ? (
                    connectedPeers.map((peer, index) => (
                      <tr
                        key={peer.pubKey || `${peer.address}-${index}`}
                        className="border-b border-panel-edge transition-colors hover:bg-panel-elevated last:border-0"
                      >
                        <td
                          className="max-w-xs truncate p-2 align-middle font-address text-xs sm:text-sm"
                          title={peer.address || t("common.notAvailable")}
                        >
                          <CopyableCell
                            fullText={peer.address || t("common.notAvailable")}
                            copiedText={copiedText}
                            onCopy={handleCopy}
                          >
                            {peer.address || t("common.notAvailable")}
                          </CopyableCell>
                        </td>
                        <td
                          className="max-w-xs truncate p-2 align-middle font-address text-xs sm:text-sm"
                          title={peer.pubKey || t("common.notAvailable")}
                        >
                          <CopyableCell
                            fullText={peer.pubKey || t("common.notAvailable")}
                            copiedText={copiedText}
                            onCopy={handleCopy}
                          >
                            {peer.pubKey
                              ? `${peer.pubKey.substring(0, 8)}...${peer.pubKey.substring(
                                  peer.pubKey.length - 4
                                )}`
                              : t("common.notAvailable")}
                          </CopyableCell>
                        </td>
                        <td className="p-2 align-middle">
                          <button
                            onClick={() =>
                              handleOpenModal({
                                pubKey: peer.pubKey,
                                alias: peer.address || t("peers.connectedPeers.fallbackAlias"),
                                addresses: peer.address ? [peer.address] : [],
                                capacity: 0,
                                numChannels: 0,
                                betweennessCentrality: 0,
                              })
                            }
                            disabled={!peer.pubKey}
                            className="inline-flex items-center rounded-md bg-success-bg px-3 py-1.5 text-sm font-semibold text-success border border-success/30 hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {t("peers.actions.openChannel")}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-8 text-center text-sm text-muted"
                      >
                        {t("peers.tables.empty")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-lg border border-panel-edge bg-panel p-5">
          <h3 className="mb-4 flex items-center text-lg font-bold">
            <Users className="mr-2 h-5 w-5 text-accent" />
            {t("peers.tables.recommendedTitle")}
          </h3>
          <div className="mb-4 flex items-center justify-between">
            <div className="relative w-full max-w-xs">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                size={20}
              />
              <input
                type="text"
                placeholder={t("common.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-panel-edge bg-input pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-panel-edge text-xs uppercase tracking-wide text-muted">
                  <th className="p-2 font-semibold">{t("peers.tables.alias")}</th>
                  <th className="p-2 font-semibold">{t("peers.tables.channels")}</th>
                  <th className="p-2 font-semibold">{t("peers.tables.capacity")}</th>
                  <th className="p-2 font-semibold">{t("peers.tables.centrality")}</th>
                  <th className="p-2 font-semibold">{t("peers.tables.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecommendedNodes.length > 0 ? (
                  paginatedRecommendedNodes.map((node) => (
                    <tr
                      key={node.pubKey}
                      className="border-b border-panel-edge transition-colors hover:bg-panel-elevated last:border-0"
                    >
                      <td
                        className="max-w-xs truncate p-2 align-middle font-address text-xs sm:text-sm"
                        title={node.alias || node.pubKey}
                      >
                        <CopyableCell
                          fullText={node.alias || node.pubKey}
                          copiedText={copiedText}
                          onCopy={handleCopy}
                        >
                          {node.alias ||
                            `${node.pubKey.substring(0, 10)}...${node.pubKey.substring(
                              node.pubKey.length - 4
                            )}`}
                        </CopyableCell>
                      </td>
                      <td className="p-2 align-middle">
                        <CopyableCell
                          fullText={String(node.numChannels)}
                          copiedText={copiedText}
                          onCopy={handleCopy}
                        >
                          <span className="font-amount">{node.numChannels}</span>
                        </CopyableCell>
                      </td>
                      <td className="p-2 align-middle">
                        <CopyableCell
                          fullText={node.capacity.toLocaleString(locale)}
                          copiedText={copiedText}
                          onCopy={handleCopy}
                        >
                          <span className="font-amount">
                            {node.capacity.toLocaleString(locale)}
                          </span>{" "}
                          {t("common.sats")}
                        </CopyableCell>
                      </td>
                      <td className="p-2 align-middle">
                        <CopyableCell
                          fullText={node.betweennessCentrality.toFixed(6)}
                          copiedText={copiedText}
                          onCopy={handleCopy}
                        >
                          <span className="font-amount">
                            {node.betweennessCentrality.toFixed(6)}
                          </span>
                        </CopyableCell>
                      </td>
                      <td className="p-2 align-middle w-32">
                        <ConnectButton node={node} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-sm text-muted"
                    >
                      {searchTerm
                        ? t("peers.tables.emptySearch", { query: searchTerm })
                        : t("peers.tables.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden space-y-3">
            {paginatedRecommendedNodes.length > 0 ? (
              paginatedRecommendedNodes.map((node) => (
                <div
                  key={node.pubKey}
                  className="rounded-lg border border-panel-edge bg-panel-elevated p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className="font-address text-sm font-semibold break-all text-foreground"
                      title={node.alias || node.pubKey}
                    >
                      {node.alias ||
                        `${node.pubKey.substring(0, 10)}...${node.pubKey.substring(
                          node.pubKey.length - 4
                        )}`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-muted">
                    <div className="flex items-center justify-between">
                      <span>{t("peers.tables.channels")}</span>
                      <span className="font-amount text-foreground">
                        {node.numChannels}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t("peers.tables.capacity")}</span>
                      <span className="font-amount text-foreground">
                        {node.capacity.toLocaleString(locale)} {t("common.sats")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t("peers.tables.centrality")}</span>
                      <span className="font-amount text-foreground">
                        {node.betweennessCentrality.toFixed(6)}
                      </span>
                    </div>
                  </div>
                  <ConnectButton node={node} />
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted">
                {searchTerm
                  ? t("peers.tables.emptySearch", { query: searchTerm })
                  : t("peers.tables.empty")}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="flex items-center rounded-md border border-panel-edge bg-panel px-4 py-2 text-sm font-medium text-foreground hover:bg-panel-elevated disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("channels.pagination.next")}
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
