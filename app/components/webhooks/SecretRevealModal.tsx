"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Alert } from "../ui/Alert";
import { useLanguage } from "@/app/lib/language";

interface SecretRevealModalProps {
  signingSecret: string;
  onDone: () => void;
}

export const SecretRevealModal = ({
  signingSecret,
  onDone,
}: SecretRevealModalProps) => {
  const { t } = useLanguage();
  const [acknowledged, setAcknowledged] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle"
  );

  // Parent owns secret lifetime and must clear secretPayload on Done/unmount.
  useEffect(() => {
    return () => {
      setAcknowledged(false);
      setCopyStatus("idle");
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(signingSecret);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("failed");
    }
  };

  const handleDone = () => {
    if (!acknowledged) {
      return;
    }
    onDone();
  };

  return (
    <Modal
      title={t("webhooks.secret.title")}
      onClose={() => undefined}
      dismissible={false}
      className="max-w-lg"
      labelledBy="webhook-secret-title"
    >
      <Alert variant="warning" className="mb-4 text-left">
        {t("webhooks.secret.warning")}
      </Alert>

      <p className="block text-sm font-medium text-muted-strong mb-1">
        {t("webhooks.secret.label")}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="flex-1 break-all rounded-md border border-panel-edge bg-input px-3 py-2 text-sm text-accent font-address">
          {signingSecret}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-panel-edge bg-panel px-3 py-2 text-sm font-medium text-foreground hover:bg-panel-elevated"
        >
          {copyStatus === "copied" ? (
            <Check className="h-4 w-4 text-success" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
          {copyStatus === "copied" ? t("common.copied") : t("common.copy")}
        </button>
      </div>
      {copyStatus === "failed" && (
        <p className="mt-2 text-xs text-danger" role="status">
          {t("webhooks.secret.copyFailed")}
        </p>
      )}

      <div className="mt-5 flex items-start gap-2">
        <input
          id="webhook-secret-ack"
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-panel-edge bg-input text-accent focus:ring-accent"
        />
        <label htmlFor="webhook-secret-ack" className="text-sm text-foreground">
          {t("webhooks.secret.acknowledge")}
        </label>
      </div>

      <button
        type="button"
        onClick={handleDone}
        disabled={!acknowledged}
        className="mt-6 w-full min-h-11 rounded-lg bg-accent px-4 py-3 font-semibold text-accent-fg hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t("webhooks.secret.done")}
      </button>
    </Modal>
  );
};
