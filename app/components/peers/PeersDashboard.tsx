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
  Users,
} from "lucide-react";
import { OpenChannelModal } from "../channels/OpenChannelModal";

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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [nodesData, peersData] = await Promise.all([
        apiCall("/admin/remotes"),
        apiCall("/admin/peers"),
      ]);
      
      const connectedPubkeys = new Set((peersData || []).map((p: Peer) => p.pubKey));
      
      setConnectedPeers(peersData || []);
      setRecommendedNodes((nodesData.nodes || []).filter((node: RemoteNode) => !connectedPubkeys.has(node.pubKey)));
      
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
      fetchData();
    } catch (err: any) {
      setError(`Failed to connect to ${node.alias}: ${err.message}`);
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

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Peers</h2>
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
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-yellow-400" />
          Connected Peers ({connectedPeers.length})
        </h3>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Zap className="w-8 h-8 text-yellow-400 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-2">Address</th>
                  <th className="p-2">Pubkey</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {connectedPeers.map((peer) => (
                  <tr
                    key={peer.pubKey || Math.random()}
                    className="hover:bg-gray-700/50 border-b border-gray-700/50"
                  >
                    <td
                      className="p-2 font-mono text-sm truncate max-w-xs"
                      title={peer.address || "N/A"}
                    >
                      {peer.address || "N/A"}
                    </td>
                    <td
                      className="p-2 font-mono text-sm truncate max-w-xs"
                      title={peer.pubKey || "N/A"}
                    >
                      {peer.pubKey ? `${peer.pubKey.substring(0, 10)}...` : "N/A"}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => handleOpenModal({ 
                          pubKey: peer.pubKey, 
                          alias: peer.address, 
                          addresses: [], 
                          capacity: 0, 
                          numChannels: 0, 
                          betweennessCentrality: 0 
                        })}
                        disabled={!peer.pubKey}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-lg text-sm transition disabled:opacity-50"
                      >
                        Open Channel
                      </button>
                    </td>
                  </tr>
                ))}
                {connectedPeers.length === 0 && (
                   <tr>
                      <td
                        colSpan={3}
                        className="text-center text-gray-500 p-6"
                      >
                        You are not connected to any peers.
                      </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mt-8">
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
                  {paginatedRecommendedNodes.map((node) => (
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
                      </td>
                    </tr>
                  ))}
                   {paginatedRecommendedNodes.length === 0 && (
                   <tr>
                      <td
                        colSpan={5}
                        className="text-center text-gray-500 p-8"
                      >
                        No recommended peers found.
                      </td>
                    </tr>
                )}
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
