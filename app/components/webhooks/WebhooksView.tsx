"use client";

import { useCallback, useEffect, useState } from "react";
import { Webhook } from "lucide-react";
import { apiCall, WebhookEndpointResponse } from "@/app/lib/api";
import { useLanguage } from "@/app/lib/language";
import { DeliveriesPanel, DeliveryFilters } from "./DeliveriesPanel";
import { EndpointsPanel } from "./EndpointsPanel";

type WebhooksMode = "endpoints" | "deliveries";

const defaultFilters = (): DeliveryFilters => ({
  endpointId: "",
  status: "",
  eventType: "",
});

interface WebhooksViewProps {
  onSecretRevealChange?: (open: boolean) => void;
}

export const WebhooksView = ({
  onSecretRevealChange,
}: WebhooksViewProps) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<WebhooksMode>("endpoints");
  const [endpoints, setEndpoints] = useState<WebhookEndpointResponse[]>([]);
  const [loadingEndpoints, setLoadingEndpoints] = useState(true);
  const [endpointsError, setEndpointsError] = useState("");
  const [notice, setNotice] = useState("");
  const [deliveryFilters, setDeliveryFilters] =
    useState<DeliveryFilters>(defaultFilters);
  const [secretRevealOpen, setSecretRevealOpen] = useState(false);

  const handleSecretRevealChange = useCallback(
    (open: boolean) => {
      setSecretRevealOpen(open);
      onSecretRevealChange?.(open);
    },
    [onSecretRevealChange]
  );

  const loadEndpoints = useCallback(async () => {
    setEndpointsError("");
    setLoadingEndpoints(true);
    try {
      const data: WebhookEndpointResponse[] = await apiCall("/admin/webhooks");
      const list = (Array.isArray(data) ? data : []).map((item) => ({
        id: item.id,
        name: item.name,
        url: item.url,
        eventTypes: Array.isArray(item.eventTypes) ? item.eventTypes : [],
        enabled: Boolean(item.enabled),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        lastSuccessAt: item.lastSuccessAt ?? null,
        lastFailureAt: item.lastFailureAt ?? null,
      }));
      setEndpoints(list);
      return list;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? `${t("webhooks.errors.fetchEndpoints")} ${err.message}`
          : t("webhooks.errors.fetchEndpoints");
      setEndpointsError(message);
      return [];
    } finally {
      setLoadingEndpoints(false);
    }
  }, [t]);

  useEffect(() => {
    void loadEndpoints();
  }, [loadEndpoints]);

  // Clear app-level nav lock if this view unmounts while secret was open.
  useEffect(() => {
    return () => {
      onSecretRevealChange?.(false);
    };
  }, [onSecretRevealChange]);

  const openDeliveries = (endpointId: string, eventType?: string) => {
    if (secretRevealOpen) {
      return;
    }
    setDeliveryFilters({
      endpointId,
      status: "",
      eventType: eventType ?? "",
    });
    setMode("deliveries");
  };

  return (
    <main className="flex-grow overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <header>
          <div className="flex items-center gap-3">
            <Webhook className="h-8 w-8 text-accent" aria-hidden="true" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold">
                {t("webhooks.title")}
              </h1>
              <p className="mt-1 text-sm text-muted">{t("webhooks.subtitle")}</p>
            </div>
          </div>
        </header>

        <div
          className="flex items-center gap-6 border-b border-panel-edge"
          aria-label={t("webhooks.title")}
        >
          {(
            [
              ["endpoints", t("webhooks.modes.endpoints")],
              ["deliveries", t("webhooks.modes.deliveries")],
            ] as const
          ).map(([key, label]) => {
            const active = mode === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                disabled={secretRevealOpen && key !== mode}
                onClick={() => {
                  if (!secretRevealOpen) {
                    setMode(key);
                  }
                }}
                className={`relative pb-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? "text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {label}
                {active && (
                  <span
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-accent"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className={mode === "endpoints" ? "block" : "hidden"}>
          <EndpointsPanel
            endpoints={endpoints}
            loading={loadingEndpoints}
            error={endpointsError}
            notice={notice}
            onClearNotice={() => setNotice("")}
            onRefresh={loadEndpoints}
            onOpenDeliveries={openDeliveries}
            onEndpointsChanged={loadEndpoints}
            onSecretRevealChange={handleSecretRevealChange}
          />
        </div>
        <div className={mode === "deliveries" ? "block" : "hidden"}>
          <DeliveriesPanel
            endpoints={endpoints}
            filters={deliveryFilters}
            onFiltersChange={setDeliveryFilters}
            active={mode === "deliveries"}
          />
        </div>
      </div>
    </main>
  );
};
