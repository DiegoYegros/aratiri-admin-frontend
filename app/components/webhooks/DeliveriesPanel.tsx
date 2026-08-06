"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Server, Zap } from "lucide-react";
import {
  apiCall,
  WEBHOOK_DELIVERY_STATUSES,
  WebhookDeliveryResponse,
  WebhookDeliveryStatus,
  WebhookEndpointResponse,
} from "@/app/lib/api";
import { useLanguage } from "@/app/lib/language";
import { Alert } from "../ui/Alert";
import { IconButton } from "../ui/IconButton";
import { Modal } from "../ui/Modal";
import { DeliveryDetailModal } from "./DeliveryDetailModal";
import {
  canRetryDelivery,
  deliveryStatusClass,
  formatTimestamp,
  truncateMiddle,
} from "./webhookFormat";

const selectClass =
  "min-h-11 w-full rounded-lg border border-panel-edge bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

const EVENT_TYPE_DEBOUNCE_MS = 350;

export interface DeliveryFilters {
  endpointId: string;
  status: WebhookDeliveryStatus | "";
  eventType: string;
}

interface DeliveriesPanelProps {
  endpoints: WebhookEndpointResponse[];
  filters: DeliveryFilters;
  onFiltersChange: (filters: DeliveryFilters) => void;
  /** When false, skip network refresh (panel may stay mounted while hidden). */
  active?: boolean;
}

export const DeliveriesPanel = ({
  endpoints,
  filters,
  onFiltersChange,
  active = true,
}: DeliveriesPanelProps) => {
  const { t, language } = useLanguage();
  const [deliveries, setDeliveries] = useState<WebhookDeliveryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<WebhookDeliveryResponse | null>(
    null
  );
  const [retryConfirm, setRetryConfirm] =
    useState<WebhookDeliveryResponse | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const requestIdRef = useRef(0);
  const [eventTypeDraft, setEventTypeDraft] = useState(filters.eventType);

  const commitEventType = useCallback(
    (value: string) => {
      if (value === filters.eventType) {
        return;
      }
      onFiltersChange({ ...filters, eventType: value });
    },
    [filters, onFiltersChange]
  );

  // Keep local draft in sync when parent filters change (e.g. openDeliveries).
  useEffect(() => {
    setEventTypeDraft(filters.eventType);
  }, [filters.eventType]);

  // Debounce eventType text filter; selects remain immediate via onFiltersChange.
  useEffect(() => {
    if (eventTypeDraft === filters.eventType) {
      return;
    }
    const timer = window.setTimeout(() => {
      commitEventType(eventTypeDraft);
    }, EVENT_TYPE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [eventTypeDraft, filters.eventType, commitEventType]);

  const fetchDeliveries = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.endpointId) {
        params.set("endpointId", filters.endpointId);
      }
      if (filters.status) {
        params.set("status", filters.status);
      }
      if (filters.eventType.trim()) {
        params.set("eventType", filters.eventType.trim());
      }
      params.set("limit", "100");

      const query = params.toString();
      const data: WebhookDeliveryResponse[] = await apiCall(
        `/admin/webhook-deliveries${query ? `?${query}` : ""}`
      );
      if (requestId !== requestIdRef.current) {
        return;
      }
      setDeliveries(Array.isArray(data) ? data : []);
      setHasLoadedOnce(true);
    } catch (err: unknown) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      const message =
        err instanceof Error
          ? `${t("webhooks.errors.fetchDeliveries")} ${err.message}`
          : t("webhooks.errors.fetchDeliveries");
      setError(message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [filters, t]);

  useEffect(() => {
    if (!active) {
      return;
    }
    void fetchDeliveries();
  }, [active, fetchDeliveries]);

  const endpointName = (endpointId: string) =>
    endpoints.find((item) => item.id === endpointId)?.name ??
    truncateMiddle(endpointId, 18);

  const queueRetry = async (delivery: WebhookDeliveryResponse) => {
    if (!canRetryDelivery(delivery.status) || retryingId) {
      return;
    }
    setError("");
    setNotice("");
    setRetryingId(delivery.id);
    try {
      await apiCall(`/admin/webhook-deliveries/${delivery.id}/retry`, {
        method: "POST",
      });
      setNotice(t("webhooks.retry.success"));
      setDeliveries((prev) =>
        prev.map((item) =>
          item.id === delivery.id ? { ...item, status: "PENDING" } : item
        )
      );
      if (selected?.id === delivery.id) {
        setSelected({ ...delivery, status: "PENDING" });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("webhooks.errors.retry");
      setError(message);
    } finally {
      setRetryingId(null);
      setRetryConfirm(null);
    }
  };

  const handleRetryClick = (delivery: WebhookDeliveryResponse) => {
    setRetryConfirm(delivery);
  };

  const filtersActive = Boolean(
    filters.endpointId || filters.status || filters.eventType.trim()
  );

  if (loading && !hasLoadedOnce) {
    return (
      <div className="flex justify-center py-16">
        <Server className="h-16 w-16 text-accent animate-calm-busy" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="danger" className="text-left">
          {error}
        </Alert>
      )}
      {notice && <Alert variant="success">{notice}</Alert>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            htmlFor="webhook-filter-endpoint"
            className="mb-1 block text-xs font-medium text-muted-strong"
          >
            {t("webhooks.filters.endpoint")}
          </label>
          <select
            id="webhook-filter-endpoint"
            className={selectClass}
            value={filters.endpointId}
            onChange={(e) =>
              onFiltersChange({ ...filters, endpointId: e.target.value })
            }
          >
            <option value="">{t("webhooks.filters.all")}</option>
            {endpoints.map((endpoint) => (
              <option key={endpoint.id} value={endpoint.id}>
                {endpoint.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="webhook-filter-status"
            className="mb-1 block text-xs font-medium text-muted-strong"
          >
            {t("webhooks.filters.status")}
          </label>
          <select
            id="webhook-filter-status"
            className={selectClass}
            value={filters.status}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                status: e.target.value as DeliveryFilters["status"],
              })
            }
          >
            <option value="">{t("webhooks.filters.all")}</option>
            {WEBHOOK_DELIVERY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="webhook-filter-event"
            className="mb-1 block text-xs font-medium text-muted-strong"
          >
            {t("webhooks.filters.eventType")}
          </label>
          <input
            id="webhook-filter-event"
            type="text"
            className={`${selectClass} font-address`}
            value={eventTypeDraft}
            onChange={(e) => setEventTypeDraft(e.target.value)}
            onBlur={() => commitEventType(eventTypeDraft)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitEventType(eventTypeDraft);
              }
            }}
            placeholder={t("webhooks.filters.eventTypePlaceholder")}
            autoComplete="off"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => void fetchDeliveries()}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-panel-edge bg-panel px-4 py-2 text-sm font-medium text-foreground hover:bg-panel-elevated"
          >
            <Zap
              className={`h-4 w-4 ${loading ? "animate-calm-busy text-accent" : "text-accent"}`}
              aria-hidden="true"
            />
            {t("common.refresh")}
          </button>
        </div>
      </div>

      {deliveries.length === 0 ? (
        <div className="rounded-lg border border-panel-edge bg-panel px-4 py-10 text-center">
          <p className="text-sm text-muted">
            {filtersActive
              ? t("webhooks.empty.deliveriesFiltered")
              : t("webhooks.empty.deliveries")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-panel-edge bg-panel">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-panel-edge text-muted">
              <tr>
                <th className="px-3 py-3 font-medium">{t("webhooks.table.when")}</th>
                <th className="px-3 py-3 font-medium">
                  {t("webhooks.table.endpoint")}
                </th>
                <th className="px-3 py-3 font-medium">
                  {t("webhooks.table.event")}
                </th>
                <th className="px-3 py-3 font-medium">
                  {t("webhooks.table.status")}
                </th>
                <th className="px-3 py-3 font-medium">
                  {t("webhooks.table.attempts")}
                </th>
                <th className="px-3 py-3 font-medium">{t("webhooks.table.http")}</th>
                <th className="px-3 py-3 font-medium">
                  {t("webhooks.table.error")}
                </th>
                <th className="px-3 py-3 font-medium">
                  {t("webhooks.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((delivery) => (
                <tr
                  key={delivery.id}
                  className="border-b border-panel-edge last:border-0 hover:bg-panel-elevated/40"
                >
                  <td className="px-3 py-3 align-middle text-muted whitespace-nowrap">
                    {formatTimestamp(delivery.createdAt, language)}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    {endpointName(delivery.endpointId)}
                  </td>
                  <td className="px-3 py-3 align-middle font-address text-xs">
                    {delivery.eventType}
                  </td>
                  <td
                    className={`px-3 py-3 align-middle font-medium ${deliveryStatusClass(delivery.status)}`}
                  >
                    {delivery.status}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    {delivery.attemptCount ?? 0}
                  </td>
                  <td className="px-3 py-3 align-middle text-muted">
                    {delivery.responseStatus ?? "—"}
                  </td>
                  <td
                    className="px-3 py-3 align-middle text-muted max-w-[12rem] truncate"
                    title={delivery.lastError ?? undefined}
                  >
                    {delivery.lastError
                      ? truncateMiddle(delivery.lastError, 36)
                      : "—"}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="text-sm text-accent underline-offset-2 hover:underline px-2 py-1"
                        onClick={() => setSelected(delivery)}
                      >
                        {t("webhooks.actions.details")}
                      </button>
                      {canRetryDelivery(delivery.status) && (
                        <IconButton
                          label={t("webhooks.actions.retry")}
                          onClick={() => handleRetryClick(delivery)}
                          disabled={retryingId === delivery.id}
                        >
                          <RotateCcw
                            className={`h-4 w-4 ${
                              retryingId === delivery.id
                                ? "animate-calm-busy text-accent"
                                : ""
                            }`}
                            aria-hidden="true"
                          />
                        </IconButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DeliveryDetailModal
          delivery={selected}
          endpoints={endpoints}
          onClose={() => setSelected(null)}
          onRetried={(updated) => {
            setSelected(updated);
            setDeliveries((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            );
            setNotice(t("webhooks.retry.success"));
          }}
        />
      )}

      {retryConfirm && (
        <Modal
          title={t("webhooks.actions.retry")}
          onClose={() => setRetryConfirm(null)}
          className="max-w-md"
        >
          <p className="text-sm text-muted mb-6">
            {t("webhooks.retry.confirmFailed")}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setRetryConfirm(null)}
              className="min-h-11 rounded-md border border-panel-edge px-4 py-2 text-sm font-medium hover:bg-panel-elevated"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={() => void queueRetry(retryConfirm)}
              className="min-h-11 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
            >
              {t("webhooks.actions.retry")}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
