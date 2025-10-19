"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { apiCall } from "@/app/lib/api";
import {
  Zap,
  ChevronLeft,
  ChevronRight,
  Search,
  Wifi,
  Users,
  Settings,
  Loader2,
  PlusCircle,
  Star,
} from "lucide-react";
import { OpenChannelModal } from "../channels/OpenChannelModal";
import { CopyableCell } from "../ui/CopyableCell";
import { StatCard } from "../ui/StatCard";

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

  const [isAutoManageEnabled, setIsAutoManageEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");
  const [updatingSettings, setUpdatingSettings] = useState(false);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nodesData, peersData] = await Promise.all([
        apiCall("/admin/remotes"),
        apiCall("/admin/peers"),
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
    } catch (err: any) {
      setError("Failed to fetch peer/node data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []); 
  
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError("");
    try {
      const settingsData = await apiCall("/admin/settings");
      setIsAutoManageEnabled(settingsData.auto_manage_peers || false);
    } catch (err: any) {
      setSettingsError("Failed to fetch settings: " + err.message);
      setIsAutoManageEnabled(false);
    } finally {
      setSettingsLoading(false);
    }
  }, []);
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
      setSettingsError("Failed to update setting: " + err.message);
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
    try {
      const host = node.addresses[0];
      if (!host) {
        throw new Error("Node has no advertised address.");
      }
      await apiCall("/admin/connect-peer", {
        method: "POST",
        body: JSON.stringify({ pubkey: node.pubKey, host }),
      });
      fetchData();
    } catch (err: any) {
      setError(`Failed to connect to ${node.alias || node.pubKey.substring(0,10)}: ${err.message}`);
    } finally {
      setConnectingNode(null);
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


  return (
    <main className="flex-grow p-4 sm:p-8 overflow-y-auto">
      {isModalOpen && (
        <OpenChannelModal
          node={selectedNode}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchData}
        />
      )}

      <div className="mb-8 rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900/90 via-gray-900 to-gray-800 px-6 py-6 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Peers</h2>
            <p className="mt-1 text-sm text-gray-400">
              Keep your node well connected with curated peer recommendations.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800/70 px-4 py-2 text-sm font-semibold text-gray-200 shadow hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Zap
                className={`h-4 w-4 ${loading ? "animate-spin text-yellow-300" : "text-yellow-400"}`}
              />
              Refresh
            </button>
            <button
              onClick={() => handleOpenModal(null)}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-400 hover:to-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <PlusCircle className="h-5 w-5" />
              Open Channel
            </button>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Connected Peers"
            value={connectedPeers.length}
            icon={Users}
          />
          <StatCard
            title="Recommended Nodes"
            value={recommendedNodes.length}
            icon={Star}
          />
          <StatCard
            title="Auto-Manage Peers"
            value={isAutoManageEnabled ? "Enabled" : "Disabled"}
            icon={Settings}
          />
          <StatCard
            title="Recommended Capacity"
            value={totalRecommendedCapacity.toLocaleString()}
            unit="sats"
            icon={Wifi}
          />
        </div>
      </div>

      {/* --- Settings Section --- */}
      <div className="mb-8 rounded-lg border border-gray-700 bg-gray-800/80 p-5">
        <h3 className="mb-3 flex items-center text-lg font-bold">
          <Settings className="mr-2 h-5 w-5 text-blue-400" />
          Peer Management Settings
        </h3>
        {settingsLoading ? (
          <div className="flex items-center text-gray-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading settings...
          </div>
        ) : (
          <div>
            {settingsError && (
              <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {settingsError}
              </div>
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
                      isAutoManageEnabled ? "bg-emerald-500" : "bg-gray-600"
                    }`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      isAutoManageEnabled ? "translate-x-4" : ""
                    }`}
                  ></div>
                </div>
                <div className="ml-3 text-gray-300">
                  Automatically maintain connections with top peers
                </div>
              </label>
              {updatingSettings && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              When enabled, Aratiri will periodically connect to recommended
              peers based on network centrality if not already connected, up to
              a configured limit.
            </p>
          </div>
        )}
      </div>
       {/* --- End Settings Section --- */}


      {/* Main Error display (for peer/node fetching) */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500 bg-red-500/15 px-4 py-3 text-red-200">
          {error}
        </div>
      )}

      {/* Connected Peers Table */}
      <div className="rounded-lg border border-gray-700 bg-gray-800/80 p-5">
        <h3 className="mb-4 flex items-center text-lg font-bold">
          <Users className="mr-2 h-5 w-5 text-emerald-400" />
          Connected Peers ({connectedPeers.length})
        </h3>
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Zap className="h-8 w-8 animate-spin text-emerald-300" />
          </div>
        ) : (
          <div className="max-h-64 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-700/60 text-xs uppercase tracking-wide text-gray-400">
                  <th className="p-2 font-semibold">Address</th>
                  <th className="p-2 font-semibold">Pubkey</th>
                  <th className="p-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {connectedPeers.length > 0 ? (
                  connectedPeers.map((peer, index) => (
                    <tr
                      key={peer.pubKey || `${peer.address}-${index}`}
                      className="border-b border-gray-800/70 transition-colors hover:bg-gray-800/60 last:border-0"
                    >
                      <td
                        className="max-w-xs truncate p-2 align-middle font-mono text-xs sm:text-sm"
                        title={peer.address || "N/A"}
                      >
                        <CopyableCell
                          fullText={peer.address || "N/A"}
                          copiedText={copiedText}
                          onCopy={handleCopy}
                        >
                          {peer.address || "N/A"}
                        </CopyableCell>
                      </td>
                      <td
                        className="max-w-xs truncate p-2 align-middle font-mono text-xs sm:text-sm"
                        title={peer.pubKey || "N/A"}
                      >
                        <CopyableCell
                          fullText={peer.pubKey || "N/A"}
                          copiedText={copiedText}
                          onCopy={handleCopy}
                        >
                          {peer.pubKey
                            ? `${peer.pubKey.substring(0, 8)}...${peer.pubKey.substring(
                                peer.pubKey.length - 4
                              )}`
                            : "N/A"}
                        </CopyableCell>
                      </td>
                      <td className="p-2 align-middle">
                        <button
                          onClick={() =>
                            handleOpenModal({
                              pubKey: peer.pubKey,
                              alias: peer.address || "Connected Peer",
                              addresses: peer.address ? [peer.address] : [],
                              capacity: 0,
                              numChannels: 0,
                              betweennessCentrality: 0,
                            })
                          }
                          disabled={!peer.pubKey}
                          className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-1 text-sm font-semibold text-white transition hover:bg-emerald-500/80 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Open Channel
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-6 text-center text-sm text-gray-500"
                    >
                      You are not connected to any peers yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Recommended Peers Table */}
      <div className="mt-8 rounded-lg border border-gray-700 bg-gray-800/80 p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-bold">Recommended Peers</h3>
          <div className="relative w-full max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by alias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900/60 pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-transparent"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Zap className="h-8 w-8 animate-spin text-sky-300" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700/60 text-xs uppercase tracking-wide text-gray-400">
                    <th className="p-2 font-semibold">Alias</th>
                    <th className="p-2 font-semibold hidden md:table-cell">
                      Channels
                    </th>
                    <th className="p-2 font-semibold hidden lg:table-cell">
                      Capacity (sats)
                    </th>
                    <th className="p-2 font-semibold hidden lg:table-cell">
                      Centrality
                    </th>
                    <th className="p-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecommendedNodes.length > 0 ? (
                    paginatedRecommendedNodes.map((node) => (
                      <tr
                        key={node.pubKey}
                        className="border-b border-gray-800/70 transition-colors hover:bg-gray-800/60 last:border-0"
                      >
                        <td
                          className="max-w-xs truncate p-2 align-middle font-mono text-xs sm:text-sm"
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
                        <td className="p-2 align-middle hidden md:table-cell">
                          <CopyableCell
                            fullText={String(node.numChannels)}
                            copiedText={copiedText}
                            onCopy={handleCopy}
                          >
                            {node.numChannels}
                          </CopyableCell>
                        </td>
                        <td className="p-2 align-middle hidden lg:table-cell">
                          <CopyableCell
                            fullText={node.capacity.toLocaleString()}
                            copiedText={copiedText}
                            onCopy={handleCopy}
                          >
                            {node.capacity.toLocaleString()}{" "}
                            <span className="text-xs text-gray-400">sats</span>
                          </CopyableCell>
                        </td>
                        <td className="p-2 align-middle hidden lg:table-cell">
                          <CopyableCell
                            fullText={node.betweennessCentrality.toFixed(6)}
                            copiedText={copiedText}
                            onCopy={handleCopy}
                          >
                            {node.betweennessCentrality.toFixed(6)}
                          </CopyableCell>
                        </td>
                        <td className="p-2 align-middle">
                          <button
                            onClick={() => handleConnect(node)}
                            disabled={
                              connectingNode === node.pubKey ||
                              !node.addresses ||
                              node.addresses.length === 0
                            }
                            className="inline-flex items-center rounded-lg bg-sky-500 px-3 py-1 text-sm font-semibold text-white transition hover:bg-sky-500/80 disabled:cursor-not-allowed disabled:opacity-60"
                            title={
                              !node.addresses || node.addresses.length === 0
                                ? "Node has no advertised address"
                                : "Connect"
                            }
                          >
                            {connectingNode === node.pubKey ? (
                              <>
                                <Wifi
                                  size={16}
                                  className="mr-1 animate-pulse"
                                />
                                Connecting...
                              </>
                            ) : (
                              "Connect"
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-sm text-gray-500"
                      >
                        {searchTerm
                          ? `No recommended peers match "${searchTerm}".`
                          : "No recommended peers found or all are already connected."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between">
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
