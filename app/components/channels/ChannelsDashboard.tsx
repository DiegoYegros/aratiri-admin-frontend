"use client";
import { useState, useEffect, useMemo } from "react";
import { apiCall } from "@/app/lib/api";
import {
  PlusCircle,
  Zap,
  ChevronLeft,
  ChevronRight,
  Search,
  Wifi,
} from "lucide-react";
import { OpenChannelModal } from "./OpenChannelModal";

interface RemoteNode {
  pubKey: string;
  alias: string;
  addresses: string[];
  capacity: number;
  numChannels: number;
  betweennessCentrality: number;
}

const ITEMS_PER_PAGE = 10;

export const ChannelsDashboard = () => {
  const [remoteNodes, setRemoteNodes] = useState<RemoteNode[]>([]);
  const [peers, setPeers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<RemoteNode | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [connectingNode, setConnectingNode] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [nodesData, peersData] = await Promise.all([
        apiCall("/admin/remotes"),
        apiCall("/admin/peers"),
      ]);
      setRemoteNodes(nodesData.nodes);
      setPeers(new Set(peersData.map((p: any) => p.pub_key)));
    } catch (err: any) {
      setError("Failed to fetch data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (node: RemoteNode | null) => {
    setSelectedNode(node);
    setIsModalOpen(true);
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
      setPeers((prev) => new Set(prev).add(node.pubKey));
    } catch (err: any) {
      setError(`Failed to connect to ${node.alias}: ${err.message}`);
    } finally {
      setConnectingNode(null);
    }
  };

  const filteredNodes = useMemo(() => {
    return remoteNodes.filter((node) =>
      node.alias.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [remoteNodes, searchTerm]);

  const totalPages = Math.ceil(filteredNodes.length / ITEMS_PER_PAGE);
  const paginatedNodes = filteredNodes.slice(
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

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Channels</h2>
        <button
          onClick={() => handleOpenModal(null)}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Open Channel
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Recommended Peers</h3>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by alias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-2">Alias</th>
                    <th className="p-2 hidden md:table-cell">Channels</th>
                    <th className="p-2 hidden lg:table-cell">
                      Capacity (sats)
                    </th>
                    <th className="p-2 hidden lg:table-cell">Centrality</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedNodes.map((node) => {
                    const isPeer = peers.has(node.pubKey);
                    return (
                      <tr
                        key={node.pubKey}
                        className="hover:bg-gray-700/50 border-b border-gray-700/50"
                      >
                        <td
                          className="p-2 font-mono text-sm truncate max-w-xs"
                          title={node.alias}
                        >
                          {node.alias}
                        </td>
                        <td className="p-2 hidden md:table-cell">
                          {node.numChannels}
                        </td>
                        <td className="p-2 hidden lg:table-cell">
                          {node.capacity.toLocaleString()}
                        </td>
                        <td className="p-2 hidden lg:table-cell">
                          {node.betweennessCentrality.toFixed(6)}
                        </td>
                        <td className="p-2">
                          {isPeer ? (
                            <button
                              onClick={() => handleOpenModal(node)}
                              className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-lg text-sm transition"
                            >
                              Open Channel
                            </button>
                          ) : (
                            <button
                              onClick={() => handleConnect(node)}
                              disabled={connectingNode === node.pubKey}
                              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-lg text-sm transition flex items-center disabled:opacity-50"
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
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center disabled:opacity-50"
              >
                <ChevronLeft size={16} className="mr-1" />
                Previous
              </button>
              <span className="text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center disabled:opacity-50"
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