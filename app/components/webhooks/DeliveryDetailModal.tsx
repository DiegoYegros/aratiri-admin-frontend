"use client";

import {
  apiCall,
  WebhookDeliveryResponse,
  WebhookEndpointResponse,
} from "@/app/lib/api";
import { useLanguage } from "@/app/lib/language";
import { Modal } from "../ui/Modal";
import { Alert } from "../ui/Alert";
import { useState } from "react";
import { Zap } from "lucide-react";
import {
  canRetryDelivery,
  deliveryStatusClass,
  formatTimestamp,
} from "./webhookFormat";

interface DeliveryDetailModalProps {
  delivery: WebhookDeliveryResponse;
  endpoints: WebhookEndpointResponse[];
  onClose: () => void;
  onRetried: (delivery: WebhookDeliveryResponse) => void;
}

export const DeliveryDetailModal = ({
  delivery,
  endpoints,
  onClose,
  onRetried,
}: DeliveryDetailModalProps) => {
  const { t, language } = useLanguage();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [confirmFailed, setConfirmFailed] = useState(false);

  const endpointName =
    endpoints.find((item) => item.id === delivery.endpointId)?.name ??
    delivery.endpointId;

  const runRetry = async () => {
    if (!canRetryDelivery(delivery.status) || retrying) {
      return;
    }
    setError("");
    setSuccess("");
    setConfirmFailed(false);
    setRetrying(true);
    try {
      await apiCall(`/admin/webhook-deliveries/${delivery.id}/retry`, {
        method: "POST",
      });
      setSuccess(t("webhooks.retry.success"));
      onRetried({ ...delivery, status: "PENDING" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("webhooks.errors.retry");
      setError(message);
    } finally {
      setRetrying(false);
    }
  };

  const handleRetry = () => {
    if (!confirmFailed) {
      setConfirmFailed(true);
      return;
    }
    void runRetry();
  };

  const rows: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: t("webhooks.detail.id"), value: delivery.id, mono: true },
    { label: t("webhooks.detail.eventId"), value: delivery.eventId, mono: true },
    { label: t("webhooks.detail.endpoint"), value: endpointName },
    {
      label: t("webhooks.detail.eventType"),
      value: delivery.eventType,
      mono: true,
    },
    { label: t("webhooks.detail.status"), value: delivery.status },
    {
      label: t("webhooks.detail.attempts"),
      value: String(delivery.attemptCount ?? 0),
    },
    {
      label: t("webhooks.detail.nextAttemptAt"),
      value: formatTimestamp(delivery.nextAttemptAt, language),
    },
    {
      label: t("webhooks.detail.responseStatus"),
      value:
        delivery.responseStatus != null
          ? String(delivery.responseStatus)
          : "—",
    },
    {
      label: t("webhooks.detail.lastError"),
      value: delivery.lastError || "—",
    },
    {
      label: t("webhooks.detail.createdAt"),
      value: formatTimestamp(delivery.createdAt, language),
    },
    {
      label: t("webhooks.detail.updatedAt"),
      value: formatTimestamp(delivery.updatedAt, language),
    },
    {
      label: t("webhooks.detail.deliveredAt"),
      value: formatTimestamp(delivery.deliveredAt, language),
    },
  ];

  return (
    <Modal
      title={t("webhooks.detail.title")}
      onClose={onClose}
      className="max-w-lg"
      labelledBy="webhook-delivery-detail-title"
    >
      {error && (
        <Alert variant="danger" className="mb-4 text-left">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}

      <dl className="space-y-3 text-sm bg-panel">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-1 gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3 border-b border-panel-edge pb-3 last:border-0"
          >
            <dt className="text-muted">{row.label}</dt>
            <dd
              className={`text-foreground break-all ${
                row.mono ? "font-address" : ""
              } ${
                row.label === t("webhooks.detail.status")
                  ? deliveryStatusClass(delivery.status)
                  : ""
              }`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {canRetryDelivery(delivery.status) && (
        <div className="mt-5 space-y-3">
          {confirmFailed && (
            <p className="text-sm text-muted">{t("webhooks.retry.confirmFailed")}</p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            {confirmFailed && (
              <button
                type="button"
                onClick={() => setConfirmFailed(false)}
                className="min-h-11 flex-1 rounded-lg border border-panel-edge px-4 py-3 text-sm font-medium hover:bg-panel-elevated"
              >
                {t("common.cancel")}
              </button>
            )}
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="min-h-11 flex-1 inline-flex items-center justify-center rounded-lg border border-panel-edge bg-panel px-4 py-3 text-sm font-semibold text-foreground hover:bg-panel-elevated disabled:opacity-50"
            >
              {retrying ? (
                <>
                  <Zap
                    className="mr-2 h-4 w-4 animate-calm-busy"
                    aria-hidden="true"
                  />
                  {t("webhooks.actions.retrying")}
                </>
              ) : confirmFailed ? (
                t("webhooks.actions.retry")
              ) : (
                t("webhooks.actions.retry")
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
