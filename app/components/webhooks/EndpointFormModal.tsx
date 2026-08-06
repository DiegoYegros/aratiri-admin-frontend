"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import {
  apiCall,
  CreateWebhookEndpointRequest,
  UpdateWebhookEndpointRequest,
  WEBHOOK_EVENT_TYPES,
  WebhookEndpointResponse,
  WebhookSecretResponse,
} from "@/app/lib/api";
import { useLanguage } from "@/app/lib/language";
import { Modal } from "../ui/Modal";
import { Alert } from "../ui/Alert";

const fieldClass =
  "w-full px-4 py-2.5 bg-input border border-panel-edge rounded-lg text-foreground placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition touch-manipulation";

interface EndpointFormModalProps {
  mode: "create" | "edit";
  endpoint?: WebhookEndpointResponse | null;
  onClose: () => void;
  onCreated: (secret: WebhookSecretResponse) => void;
  onUpdated: (endpoint: WebhookEndpointResponse) => void;
  onRequestRotate?: () => void;
}

export const EndpointFormModal = ({
  mode,
  endpoint,
  onClose,
  onCreated,
  onUpdated,
  onRequestRotate,
}: EndpointFormModalProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState(endpoint?.name ?? "");
  const [url, setUrl] = useState(endpoint?.url ?? "");
  const [enabled, setEnabled] = useState(endpoint?.enabled ?? true);
  const [eventTypes, setEventTypes] = useState<string[]>(
    endpoint?.eventTypes ? [...endpoint.eventTypes] : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const toggleEventType = (eventType: string) => {
    setEventTypes((prev) =>
      prev.includes(eventType)
        ? prev.filter((item) => item !== eventType)
        : [...prev, eventType]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (eventTypes.length === 0) {
      setError(t("webhooks.form.eventsRequired"));
      return;
    }

    const body: CreateWebhookEndpointRequest | UpdateWebhookEndpointRequest = {
      name: name.trim(),
      url: url.trim(),
      eventTypes,
      enabled,
    };

    setLoading(true);
    try {
      if (mode === "create") {
        const response: WebhookSecretResponse = await apiCall(
          "/admin/webhooks",
          {
            method: "POST",
            body: JSON.stringify(body),
          }
        );
        onCreated(response);
        return;
      }

      if (!endpoint) {
        return;
      }

      const updated: WebhookEndpointResponse = await apiCall(
        `/admin/webhooks/${endpoint.id}`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        }
      );
      setSuccess(t("webhooks.form.saved"));
      onUpdated(updated);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("webhooks.errors.save");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        mode === "create"
          ? t("webhooks.form.createTitle")
          : t("webhooks.form.editTitle")
      }
      onClose={onClose}
      className="max-w-xl"
      labelledBy="webhook-endpoint-form-title"
    >
      <p className="text-sm text-muted mb-4">{t("webhooks.form.helper")}</p>

      {error && (
        <Alert variant="danger" className="mb-4 text-left">
          {error}
        </Alert>
      )}
      {success && mode === "edit" && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="webhook-endpoint-name"
            className="block text-sm font-medium text-muted-strong mb-1"
          >
            {t("webhooks.form.name")}
          </label>
          <input
            id="webhook-endpoint-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            required
            autoComplete="off"
            autoFocus
          />
        </div>

        <div>
          <label
            htmlFor="webhook-endpoint-url"
            className="block text-sm font-medium text-muted-strong mb-1"
          >
            {t("webhooks.form.url")}
          </label>
          <input
            id="webhook-endpoint-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={`${fieldClass} font-address`}
            required
            autoComplete="off"
            placeholder="https://"
          />
        </div>

        <div className="flex items-start gap-2">
          <input
            id="webhook-endpoint-enabled"
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-panel-edge bg-input text-accent focus:ring-accent"
          />
          <div>
            <label
              htmlFor="webhook-endpoint-enabled"
              className="block text-sm text-foreground"
            >
              {t("webhooks.form.enabled")}
            </label>
            <p className="text-xs text-muted mt-1">
              {t("webhooks.form.enabledHelper")}
            </p>
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-muted-strong">
            {t("webhooks.form.events")}
          </legend>
          <p className="text-xs text-muted mt-1 mb-3">
            {t("webhooks.form.eventsHelper")}
          </p>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {WEBHOOK_EVENT_TYPES.map((eventType) => {
              const inputId = `webhook-event-${eventType}`;
              return (
                <label
                  key={eventType}
                  htmlFor={inputId}
                  className="flex items-center gap-3 rounded-md border border-panel-edge bg-panel-elevated px-3 py-2 text-sm"
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={eventTypes.includes(eventType)}
                    onChange={() => toggleEventType(eventType)}
                    className="h-4 w-4 rounded border-panel-edge bg-input text-accent focus:ring-accent"
                  />
                  <span className="font-address text-foreground">
                    {eventType}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-11 bg-accent text-accent-fg font-semibold py-3 px-4 rounded-lg hover:bg-accent-hover disabled:opacity-50 flex items-center justify-center transition touch-manipulation"
        >
          {loading ? (
            <>
              <Zap className="w-5 h-5 mr-2 animate-calm-busy" aria-hidden="true" />
              {mode === "create"
                ? t("webhooks.actions.creating")
                : t("webhooks.actions.saving")}
            </>
          ) : mode === "create" ? (
            t("webhooks.actions.create")
          ) : (
            t("webhooks.actions.save")
          )}
        </button>
      </form>

      {mode === "edit" && onRequestRotate && (
        <button
          type="button"
          onClick={onRequestRotate}
          className="mt-4 w-full text-sm text-danger hover:underline"
        >
          {t("webhooks.actions.rotate")}
        </button>
      )}
    </Modal>
  );
};
