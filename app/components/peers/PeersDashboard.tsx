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
} from "lucide-react";
import { OpenChannelModal } from "../channels/OpenChannelModal";
import { CopyableCell } from "../ui/CopyableCell";

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

      <div className="mb-6">
        <h2 className="text-2xl font-bold">Peers</h2>
      </div>

       {/* --- Settings Section --- */}
       <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-8">
          <h3 className="text-lg font-bold mb-3 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-yellow-400" />
            Peer Management Settings
          </h3>
          {settingsLoading ? (
             <div className="flex items-center text-gray-400">
               <Loader2 className="w-4 h-4 mr-2 animate-spin" />
               Loading settings...
             </div>
          ) : (
            <div>
              {settingsError && (
                 <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-md mb-3 text-sm">
                   {settingsError}
                 </div>
               )}
              <div className="flex items-center space-x-3">
                 <label htmlFor="autoManageToggle" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        id="autoManageToggle"
                        type="checkbox"
                        className="sr-only"
                        checked={isAutoManageEnabled}
                        onChange={handleToggleAutoManage}
                        disabled={updatingSettings}
                      />
                      <div className={`block w-10 h-6 rounded-full transition ${isAutoManageEnabled ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${isAutoManageEnabled ? 'translate-x-4' : ''}`}></div>
                   </div>
                   <div className="ml-3 text-gray-300">
                     Automatically maintain connections with top peers
                   </div>
                 </label>
                 {updatingSettings && <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                  When enabled, Aratiri will periodically connect to recommended peers based on network centrality if not already connected, up to a configured limit.
              </p>
            </div>
          )}
       </div>
       {/* --- End Settings Section --- */}


      {/* Main Error display (for peer/node fetching) */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Connected Peers Table (remains mostly the same) */}
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
                      className="p-2 font-mono text-sm truncate max-w-xs group relative"
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
                      className="p-2 font-mono text-sm truncate max-w-xs group relative"
                      title={peer.pubKey || "N/A"}
                    >
                      <CopyableCell
                        fullText={peer.pubKey || "N/A"}
                        copiedText={copiedText}
                        onCopy={handleCopy}
                      >
                        {peer.pubKey
                          ? `${peer.pubKey.substring(0, 10)}...`
                          : "N/A"}
                      </CopyableCell>
                    </td>
                    <td className="p-2">
                       <button
                         onClick={() =>
                           handleOpenModal({
                             pubKey: peer.pubKey,
                             alias: peer.address || 'Connected Peer',
                             addresses: peer.address ? [peer.address] : [],
                             capacity: 0,
                             numChannels: 0,
                             betweennessCentrality: 0,
                           })
                         }
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


       {/* Recommended Peers Table (remains the same) */}
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
                        className="p-2 font-mono text-sm truncate max-w-xs group relative"
                        title={node.alias}
                      >
                        <CopyableCell
                          fullText={node.alias || node.pubKey}
                          copiedText={copiedText}
                          onCopy={handleCopy}
                        >
                          {node.alias || `${node.pubKey.substring(0, 10)}...`}
                        </CopyableCell>
                      </td>
                      <td className="p-2 hidden md:table-cell group relative">
                        <CopyableCell
                          fullText={String(node.numChannels)}
                          copiedText={copiedText}
                          onCopy={handleCopy}
                        >
                          {node.numChannels}
                        </CopyableCell>
                      </td>
                      <td className="p-2 hidden lg:table-cell group relative">
                        <CopyableCell
                          fullText={node.capacity.toLocaleString()}
                          copiedText={copiedText}
                          onCopy={handleCopy}
                        >
                          {node.capacity.toLocaleString()}
                        </CopyableCell>
                      </td>
                      <td className="p-2 hidden lg:table-cell group relative">
                        <CopyableCell
                          fullText={node.betweennessCentrality.toFixed(6)}
                          copiedText={copiedText}
                          onCopy={handleCopy}
                        >
                          {node.betweennessCentrality.toFixed(6)}
                        </CopyableCell>
                      </td>
                      <td className="p-2">
                         <button
                           onClick={() => handleConnect(node)}
                           disabled={connectingNode === node.pubKey || !node.addresses || node.addresses.length === 0} 
                           className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-lg text-sm transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                           title={(!node.addresses || node.addresses.length === 0) ? "Node has no advertised address" : "Connect"}
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
                  {paginatedRecommendedNodes.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center text-gray-500 p-8"
                      >
                         {searchTerm ? `No recommended peers found matching "${searchTerm}".` : "No recommended peers found or all are connected."}
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
                 className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center disabled:opacity-50"
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