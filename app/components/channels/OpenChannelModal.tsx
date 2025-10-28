"use client";
import { useState } from "react";
import { apiCall } from "@/app/lib/api";
import { X, Zap } from "lucide-react";
import { useLanguage } from "@/app/lib/language";

interface RemoteNode {
  pubKey: string;
  alias: string;
}

interface OpenChannelModalProps {
  node: RemoteNode | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const OpenChannelModal = ({
  node,
  onClose,
  onSuccess,
}: OpenChannelModalProps) => {
  const { t } = useLanguage();
  const [nodePubkey, setNodePubkey] = useState(node?.pubKey || "");
  const [localFundingAmount, setLocalFundingAmount] = useState("");
  const [pushSat, setPushSat] = useState("0");
  const [privateChannel, setPrivateChannel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await apiCall("/admin/channels/open", {
        method: "POST",
        body: JSON.stringify({
          nodePubkey,
          localFundingAmount: parseInt(localFundingAmount, 10),
          pushSat: parseInt(pushSat, 10),
          privateChannel,
        }),
      });
      setSuccess(t("modal.openChannel.success", { txid: response }));
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-lg border border-yellow-500/20 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label={t("common.collapse")}
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-2">{t("modal.openChannel.title")}</h2>
        <p className="text-gray-400 mb-6">
          {t("modal.openChannel.description")}
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              {t("modal.openChannel.nodePublicKey")}
            </label>
            <input
              type="text"
              value={nodePubkey}
              onChange={(e) => setNodePubkey(e.target.value)}
              placeholder="02f..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
              readOnly={!!node?.pubKey}
            />
            {node && (
              <p className="text-xs text-gray-500 mt-1">
                {t("modal.openChannel.openingWith", { alias: node.alias })}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {t("modal.openChannel.localAmount")}
              </label>
              <input
                type="number"
                value={localFundingAmount}
                onChange={(e) => setLocalFundingAmount(e.target.value)}
                placeholder="1000000"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {t("modal.openChannel.pushToPeer")}
              </label>
              <input
                type="number"
                value={pushSat}
                onChange={(e) => setPushSat(e.target.value)}
                placeholder={t("modal.openChannel.optional")}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              id="private-channel"
              type="checkbox"
              checked={privateChannel}
              onChange={(e) => setPrivateChannel(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-600"
            />
            <label
              htmlFor="private-channel"
              className="ml-2 block text-sm text-gray-300"
            >
              {t("modal.openChannel.privateLabel")}
            </label>
          </div>
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-yellow-500 disabled:opacity-50 flex items-center justify-center transition"
            >
              {loading ? (
                <>
                  <Zap className="w-5 h-5 mr-2 animate-spin" />
                  {t("modal.openChannel.submitting")}
                </>
              ) : (
                t("modal.openChannel.submit")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

