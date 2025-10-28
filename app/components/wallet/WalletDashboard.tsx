"use client";

import { useCallback, useEffect, useState } from "react";
import {
  apiCall,
  NewAddressResponse,
  WalletBalanceResponse,
} from "@/app/lib/api";
import {
  Check,
  Coins,
  Copy,
  Hourglass,
  Loader2,
  PlusCircle,
  RefreshCcw,
  Server,
  Wallet,
} from "lucide-react";
import { StatCard } from "../ui/StatCard";

interface WalletBalance {
  confirmed: number;
  unconfirmed: number;
}

export const WalletDashboard = () => {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string>("");
  const [latestAddress, setLatestAddress] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const fetchBalance = useCallback(
    async (showSpinner = false) => {
      setError("");
      if (showSpinner) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      try {
        const response: WalletBalanceResponse = await apiCall(
          "/admin/wallet/balance"
        );
        setBalance({
          confirmed: response.confirmed_balance,
          unconfirmed: response.unconfirmed_balance,
        });
      } catch (err: any) {
        const message =
          err?.message || "Failed to load wallet balance. Please try again.";
        setError(message);
      } finally {
        if (showSpinner) {
          setLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchBalance(true);
  }, [fetchBalance]);

  const handleRefresh = () => {
    if (loading || isRefreshing) return;
    fetchBalance();
  };

  const handleGenerateAddress = async () => {
    if (isGenerating) return;

    setError("");
    setSuccessMessage("");
    setIsGenerating(true);
    try {
      const response: NewAddressResponse = await apiCall(
        "/admin/wallet/address",
        {
          method: "POST",
        }
      );
      setLatestAddress(response.address);
      setCopyStatus("idle");
      await fetchBalance();
    } catch (err: any) {
      const message =
        err?.message || "Failed to generate a new address. Please try again.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAddress = async () => {
    if (!latestAddress) return;

    try {
      await navigator.clipboard.writeText(latestAddress);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to copy address", err);
    }
  };

  const formatSats = (value: number) => {
    if (value === 0) return "0";
    return value.toLocaleString();
  };

  const totalBalance = balance
    ? balance.confirmed + balance.unconfirmed
    : 0;

  if (loading) {
    return (
      <main className="flex-grow p-8 flex items-center justify-center">
        <Server className="w-16 h-16 text-yellow-400 animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-grow p-4 sm:p-8 overflow-y-auto">
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-lg mb-6">
          {successMessage}
        </div>
      )}

      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Confirmed Balance"
            value={formatSats(balance.confirmed)}
            icon={Wallet}
            unit="sats"
          />
          <StatCard
            title="Unconfirmed Balance"
            value={formatSats(balance.unconfirmed)}
            icon={Hourglass}
            unit="sats"
          />
          <StatCard
            title="Total Balance"
            value={formatSats(totalBalance)}
            icon={Coins}
            unit="sats"
          />
        </div>
      )}

      <section className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">On-chain Wallet</h2>
            <p className="text-sm text-gray-400">
              Generate addresses and monitor your on-chain wallet
              balances.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="inline-flex items-center justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </button>
            <button
              onClick={handleGenerateAddress}
              disabled={isGenerating}
              className="inline-flex items-center justify-center rounded-md bg-yellow-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? "Generating" : "Generate Address"}
            </button>
          </div>
        </div>

        {latestAddress && (
          <div className="mt-6">
            <p className="text-sm text-gray-400">Latest generated address</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 truncate rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-yellow-100">
                {latestAddress}
              </code>
              <button
                onClick={handleCopyAddress}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600"
              >
                {copyStatus === "copied" ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copyStatus === "copied" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};
