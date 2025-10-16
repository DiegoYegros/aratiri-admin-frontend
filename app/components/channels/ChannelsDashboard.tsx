"use client";
import { useState, useEffect, useMemo } from "react";
import { apiCall } from "@/app/lib/api";
import {
  PlusCircle,
  Zap,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  Globe,
  ClipboardCopy,
  Check,
} from "lucide-react";
import { OpenChannelModal } from "./OpenChannelModal";
import { StatCard } from "../ui/StatCard";

interface OpenChannel {
  channelPoint: string;
  remotePubkey: string;
  capacity: number;
  localBalance: number;
  remoteBalance: number;
  active: boolean;
  privateChannel: boolean;
}

const ITEMS_PER_PAGE = 10;

export const ChannelsDashboard = () => {
  const [channels, setChannels] = useState<OpenChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedPubkey, setCopiedPubkey] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const channelsData = await apiCall("/admin/channels");
      setChannels(channelsData.channels || []);
    } catch (err: any) {
      setError("Failed to fetch open channels: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleModalSuccess = () => {
    fetchData();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPubkey(text);
    setTimeout(() => setCopiedPubkey(null), 2000);
  };

  const filteredChannels = useMemo(() => {
    return channels.filter((channel) =>
      channel.remotePubkey.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [channels, searchTerm]);

  const { totalLocal, totalRemote, activeCount, pendingCount } =
    useMemo(() => {
      let totalLocal = 0;
      let totalRemote = 0;
      let activeCount = 0;
      let pendingCount = 0;

      for (const channel of channels) {
        if (channel.active) {
          totalLocal += channel.localBalance;
          totalRemote += channel.remoteBalance;
          activeCount++;
        } else {
          pendingCount++;
        }
      }
      return { totalLocal, totalRemote, activeCount, pendingCount };
    }, [channels]);

  const totalPages = Math.ceil(filteredChannels.length / ITEMS_PER_PAGE);
  const paginatedChannels = filteredChannels.slice(
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
          node={null}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Channels</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Open New Channel
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Outbound Liquidity"
          value={totalLocal.toLocaleString()}
          unit="sats"
          icon={Zap}
        />
        <StatCard
          title="Inbound Liquidity"
          value={totalRemote.toLocaleString()}
          unit="sats"
          icon={Zap}
        />
        <StatCard title="Active Channels" value={activeCount} icon={CheckCircle} />
        <StatCard
          title="Inactive/Pending"
          value={pendingCount}
          icon={AlertCircle}
        />
      </div>

      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Channel List</h3>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by remote pubkey..."
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
                    <th className="p-2">Status</th>
                    <th className="p-2">Remote Peer</th>
                    <th className="p-2 hidden md:table-cell">Local Balance</th>
                    <th className="p-2 hidden md:table-cell">Remote Balance</th>
                    <th className="p-2 hidden lg:table-cell">Capacity</th>
                    <th className="p-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedChannels.map((channel) => (
                    <tr
                      key={channel.channelPoint}
                      className="hover:bg-gray-700/50 border-b border-gray-700/50"
                    >
                      <td className="p-2">
                        {channel.active ? (
                          <span title="Channel is Active">
                            <CheckCircle
                              className="text-green-500"
                            />
                          </span>
                        ) : (
                          <span title="Channel is Inactive">
                            <XCircle
                              className="text-red-500"
                            />
                          </span>
                        )}
                      </td>
                      <td
                        className="p-2 font-mono text-sm truncate max-w-xs group relative"
                        title={channel.remotePubkey}
                      >
                        <span>
                          {channel.remotePubkey.substring(0, 10)}...
                          {channel.remotePubkey.substring(
                            channel.remotePubkey.length - 4
                          )}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(channel.remotePubkey);
                          }}
                          className="absolute top-1/2 right-2 -translate-y-1/2 p-1 bg-gray-700 rounded-md text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy full pubkey"
                        >
                          {copiedPubkey === channel.remotePubkey ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <ClipboardCopy size={14} />
                          )}
                        </button>
                      </td>
                      <td className="p-2 hidden md:table-cell">
                        {channel.localBalance.toLocaleString()} sats
                      </td>
                      <td className="p-2 hidden md:table-cell">
                        {channel.remoteBalance.toLocaleString()} sats
                      </td>
                      <td className="p-2 hidden lg:table-cell">
                        {channel.capacity.toLocaleString()} sats
                      </td>
                      <td className="p-2 text-xs text-gray-400">
                        {channel.privateChannel ? (
                          <span title="Private Channel">
                            <Lock size={16} />
                          </span>
                        ) : (
                          <span title="Public Channel">
                            <Globe size={16} />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {channels.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-gray-500 p-8"
                      >
                        You have no open channels.
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