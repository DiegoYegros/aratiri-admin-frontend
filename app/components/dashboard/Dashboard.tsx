"use client";
import { apiCall, NodeInfo } from "@/app/lib/api";
import {
  GitCommit,
  Hash,
  Info,
  Link2,
  LogOut,
  Network,
  Package,
  Server,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { StatCard } from "../ui/StatCard";

export const Dashboard = ({ setIsAuthenticated, setToken }: any) => {
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNodeInfo = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiCall("/admin/node-info");
      setNodeInfo(data);
    } catch (err: any) {
      setError("Failed to fetch node info: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNodeInfo();
  }, [fetchNodeInfo]);

  const logout = async () => {
    // Logic to clear tokens and state
    localStorage.removeItem("aratiri_accessToken");
    localStorage.removeItem("aratiri_refreshToken");
    setToken(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <Server className="w-16 h-16 text-yellow-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-yellow-500/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold">Aratiri Admin</h1>
            <button
              onClick={logout}
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {nodeInfo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <StatCard title="Alias" value={nodeInfo.alias} icon={Info} />
            <StatCard title="Version" value={nodeInfo.version} icon={Package} />
            <StatCard
              title="Block Height"
              value={nodeInfo.blockHeight.toLocaleString()}
              icon={Hash}
            />
            <StatCard
              title="Commit Hash"
              value={nodeInfo.commitHash.substring(0, 7)}
              icon={GitCommit}
            />
            <StatCard
              title="Peers"
              value={nodeInfo.numPeers}
              icon={Users}
            />
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
      </main>
    </div>
  );
};
