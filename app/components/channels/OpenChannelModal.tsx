"use client";
import { useState } from "react";
import { apiCall } from "@/app/lib/api";
import { Zap } from "lucide-react";
import { useLanguage } from "@/app/lib/language";
import { Modal } from "../ui/Modal";
import { Alert } from "../ui/Alert";

interface RemoteNode {
  pubKey: string;
  alias: string;
}

interface OpenChannelModalProps {
  node: RemoteNode | null;
  onClose: () => void;
  onSuccess: () => void;
}

const fieldClass =
  "w-full px-4 py-2.5 bg-input border border-panel-edge rounded-lg text-foreground placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition touch-manipulation";

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
    <Modal title={t("modal.openChannel.title")} onClose={onClose} className="max-w-lg">
      <p className="text-sm text-muted mb-4">
        {t("modal.openChannel.description")}
      </p>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      {success && <Alert variant="success" className="mb-4">{success}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-strong mb-1">
            {t("modal.openChannel.nodePublicKey")}
          </label>
          <input
            type="text"
            value={nodePubkey}
            onChange={(e) => setNodePubkey(e.target.value)}
            placeholder="02f..."
            className={`${fieldClass} font-address`}
            required
            readOnly={!!node?.pubKey}
          />
          {node && (
            <p className="text-xs text-muted mt-1">
              {t("modal.openChannel.openingWith", { alias: node.alias })}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-strong mb-1">
              {t("modal.openChannel.localAmount")}
            </label>
            <input
              type="number"
              value={localFundingAmount}
              onChange={(e) => setLocalFundingAmount(e.target.value)}
              placeholder="1000000"
              className={fieldClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-strong mb-1">
              {t("modal.openChannel.pushToPeer")}
            </label>
            <input
              type="number"
              value={pushSat}
              onChange={(e) => setPushSat(e.target.value)}
              placeholder={t("modal.openChannel.optional")}
              className={fieldClass}
            />
          </div>
        </div>
        <div className="flex items-center">
          <input
            id="private-channel"
            type="checkbox"
            checked={privateChannel}
            onChange={(e) => setPrivateChannel(e.target.checked)}
            className="h-4 w-4 rounded border-panel-edge bg-input text-accent focus:ring-accent"
          />
          <label
            htmlFor="private-channel"
            className="ml-2 block text-sm text-foreground"
          >
            {t("modal.openChannel.privateLabel")}
          </label>
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-11 bg-accent text-accent-fg font-semibold py-3 px-4 rounded-lg hover:bg-accent-hover disabled:opacity-50 flex items-center justify-center transition touch-manipulation"
          >
            {loading ? (
              <>
                <Zap className="w-5 h-5 mr-2 animate-spin-smooth" />
                {t("modal.openChannel.submitting")}
              </>
            ) : (
              t("modal.openChannel.submit")
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
