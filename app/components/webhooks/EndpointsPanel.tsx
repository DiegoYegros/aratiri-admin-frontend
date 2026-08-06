"use client";

import { useEffect, useState } from "react";
import {
  Edit3,
  FlaskConical,
  KeyRound,
  ListTree,
  PlusCircle,
  Server,
  Zap,
} from "lucide-react";
import {
  apiCall,
  WebhookEndpointResponse,
  WebhookSecretResponse,
} from "@/app/lib/api";
import { useLanguage } from "@/app/lib/language";
import { Alert } from "../ui/Alert";
import { IconButton } from "../ui/IconButton";
import { Modal } from "../ui/Modal";
import { EndpointFormModal } from "./EndpointFormModal";
import { SecretRevealModal } from "./SecretRevealModal";
import {
  formatEventTypesSummary,
  formatTimestamp,
  hasSigningSecret,
  truncateMiddle,
} from "./webhookFormat";

interface EndpointsPanelProps {
  endpoints: WebhookEndpointResponse[];
  loading: boolean;
  error: string;
  notice: string;
  onClearNotice: () => void;
  onRefresh: () => Promise<WebhookEndpointResponse[] | void>;
  onOpenDeliveries: (endpointId: string, eventType?: string) => void;
  onEndpointsChanged: () => Promise<WebhookEndpointResponse[] | void>;
  onSecretRevealChange?: (open: boolean) => void;
}

export const EndpointsPanel = ({
  endpoints,
  loading,
  error,
  notice,
  onClearNotice,
  onRefresh,
  onOpenDeliveries,
  onEndpointsChanged,
  onSecretRevealChange,
}: EndpointsPanelProps) => {
  const { t, language } = useLanguage();
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<WebhookEndpointResponse | null>(null);
  const [secretPayload, setSecretPayload] =
    useState<WebhookSecretResponse | null>(null);
  const [secretKind, setSecretKind] = useState<"create" | "rotate" | null>(
    null
  );
  const [rotateTarget, setRotateTarget] =
    useState<WebhookEndpointResponse | null>(null);
  const [rotating, setRotating] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [lastTestedId, setLastTestedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [showTestDeliveriesLink, setShowTestDeliveriesLink] = useState(false);

  useEffect(() => {
    onSecretRevealChange?.(Boolean(secretPayload));
  }, [secretPayload, onSecretRevealChange]);

  useEffect(() => {
    return () => {
      setSecretPayload(null);
      setSecretKind(null);
      onSecretRevealChange?.(false);
    };
  }, [onSecretRevealChange]);

  const openCreate = () => {
    setEditing(null);
    setFormMode("create");
    setActionError("");
    setActionSuccess("");
    setShowTestDeliveriesLink(false);
    onClearNotice();
  };

  const openEdit = (endpoint: WebhookEndpointResponse) => {
    setEditing(endpoint);
    setFormMode("edit");
    setActionError("");
    setActionSuccess("");
    setShowTestDeliveriesLink(false);
  };

  const handleCreated = (secret: WebhookSecretResponse) => {
    setFormMode(null);
    if (!hasSigningSecret(secret)) {
      setActionError(t("webhooks.errors.missingSecret"));
      void onEndpointsChanged();
      return;
    }
    setSecretKind("create");
    setSecretPayload(secret);
    void onEndpointsChanged();
  };

  const handleUpdated = (endpoint: WebhookEndpointResponse) => {
    setEditing(endpoint);
    void onEndpointsChanged();
  };

  const handleSecretDone = async () => {
    const kind = secretKind;
    setSecretPayload(null);
    setSecretKind(null);

    if (kind === "create") {
      onClearNotice();
      setShowTestDeliveriesLink(false);
      setActionSuccess(t("webhooks.secret.createdNotice"));
    } else if (kind === "rotate") {
      onClearNotice();
      setShowTestDeliveriesLink(false);
      setActionSuccess(t("webhooks.secret.rotatedNotice"));
    }

    await onEndpointsChanged();
  };

  const confirmRotate = async () => {
    if (!rotateTarget || rotating) {
      return;
    }
    setActionError("");
    setRotating(true);
    try {
      const response: WebhookSecretResponse = await apiCall(
        `/admin/webhooks/${rotateTarget.id}/rotate-secret`,
        { method: "POST" }
      );
      if (!hasSigningSecret(response)) {
        setActionError(t("webhooks.errors.missingSecret"));
        return;
      }
      setRotateTarget(null);
      setFormMode(null);
      setSecretKind("rotate");
      setSecretPayload(response);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("webhooks.errors.rotate");
      setActionError(message);
      setRotateTarget(null);
    } finally {
      setRotating(false);
    }
  };

  const handleTest = async (endpoint: WebhookEndpointResponse) => {
    if (testingId) {
      return;
    }
    setActionError("");
    setActionSuccess("");
    setShowTestDeliveriesLink(false);
    onClearNotice();
    setTestingId(endpoint.id);
    try {
      await apiCall(`/admin/webhooks/${endpoint.id}/test`, { method: "POST" });
      setLastTestedId(endpoint.id);
      setActionSuccess(t("webhooks.test.success"));
      setShowTestDeliveriesLink(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("webhooks.errors.test");
      setActionError(message);
    } finally {
      setTestingId(null);
    }
  };

  if (loading && endpoints.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <Server className="h-16 w-16 text-accent animate-calm-busy" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(error || actionError) && (
        <Alert variant="danger" className="text-left">
          {actionError || error}
        </Alert>
      )}
      {(notice || actionSuccess) && (
        <Alert variant="success" className="text-left">
          <span>{actionSuccess || notice}</span>
          {showTestDeliveriesLink && lastTestedId && (
            <>
              {" "}
              <button
                type="button"
                className="underline hover:text-foreground"
                onClick={() => onOpenDeliveries(lastTestedId, "webhook.test")}
              >
                {t("webhooks.actions.viewDeliveries")}
              </button>
            </>
          )}
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <button
            type="button"
            onClick={() => void onRefresh()}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-panel-edge bg-panel px-4 py-2 text-sm font-medium text-foreground hover:bg-panel-elevated"
          >
            <Zap
              className={`h-4 w-4 ${loading ? "animate-calm-busy text-accent" : "text-accent"}`}
              aria-hidden="true"
            />
            {t("common.refresh")}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
          >
            <PlusCircle className="h-5 w-5" aria-hidden="true" />
            {t("webhooks.actions.addEndpoint")}
          </button>
        </div>
      </div>

      {endpoints.length === 0 ? (
        <div className="rounded-lg border border-panel-edge bg-panel px-4 py-10 text-center">
          <p className="text-sm text-muted">{t("webhooks.empty.endpoints")}</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
          >
            <PlusCircle className="h-5 w-5" aria-hidden="true" />
            {t("webhooks.actions.addEndpoint")}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-panel-edge bg-panel">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-panel-edge text-muted">
              <tr>
                <th className="px-3 py-3 font-medium">{t("webhooks.table.name")}</th>
                <th className="px-3 py-3 font-medium">{t("webhooks.table.url")}</th>
                <th className="px-3 py-3 font-medium">
                  {t("webhooks.table.events")}
                </th>
                <th className="px-3 py-3 font-medium">{t("webhooks.table.state")}</th>
                <th className="px-3 py-3 font-medium">
                  {t("webhooks.table.lastSuccess")}
                </th>
                <th className="px-3 py-3 font-medium">
                  {t("webhooks.table.lastFailure")}
                </th>
                <th className="px-3 py-3 font-medium">
                  {t("webhooks.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint) => (
                <tr
                  key={endpoint.id}
                  className="border-b border-panel-edge last:border-0"
                >
                  <td className="px-3 py-3 align-middle font-medium">
                    {endpoint.name}
                  </td>
                  <td
                    className="px-3 py-3 align-middle font-address text-xs text-muted"
                    title={endpoint.url}
                  >
                    {truncateMiddle(endpoint.url)}
                  </td>
                  <td className="px-3 py-3 align-middle font-address text-xs">
                    {formatEventTypesSummary(endpoint.eventTypes ?? [])}
                  </td>
                  <td
                    className={`px-3 py-3 align-middle ${
                      endpoint.enabled ? "text-success" : "text-muted"
                    }`}
                  >
                    {endpoint.enabled
                      ? t("common.enabled")
                      : t("common.disabled")}
                  </td>
                  <td className="px-3 py-3 align-middle text-muted">
                    {formatTimestamp(endpoint.lastSuccessAt, language)}
                  </td>
                  <td className="px-3 py-3 align-middle text-muted">
                    {formatTimestamp(endpoint.lastFailureAt, language)}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <div className="flex items-center gap-1">
                      <IconButton
                        label={t("webhooks.actions.edit")}
                        onClick={() => openEdit(endpoint)}
                      >
                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                      <IconButton
                        label={t("webhooks.actions.test")}
                        onClick={() => void handleTest(endpoint)}
                        disabled={testingId === endpoint.id}
                      >
                        <FlaskConical
                          className={`h-4 w-4 ${
                            testingId === endpoint.id
                              ? "animate-calm-busy text-accent"
                              : ""
                          }`}
                          aria-hidden="true"
                        />
                      </IconButton>
                      <IconButton
                        label={t("webhooks.actions.viewDeliveries")}
                        onClick={() => onOpenDeliveries(endpoint.id)}
                      >
                        <ListTree className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                      <IconButton
                        label={t("webhooks.actions.rotate")}
                        onClick={() => {
                          setFormMode(null);
                          setRotateTarget(endpoint);
                        }}
                      >
                        <KeyRound className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formMode && !rotateTarget && !secretPayload && (
        <EndpointFormModal
          key={
            formMode === "edit" && editing
              ? `edit-${editing.id}`
              : "create-endpoint"
          }
          mode={formMode}
          endpoint={formMode === "edit" ? editing : null}
          onClose={() => setFormMode(null)}
          onCreated={handleCreated}
          onUpdated={handleUpdated}
          onRequestRotate={
            editing
              ? () => {
                  setFormMode(null);
                  setRotateTarget(editing);
                }
              : undefined
          }
        />
      )}

      {rotateTarget && !secretPayload && (
        <Modal
          title={t("webhooks.rotate.title")}
          onClose={() => {
            if (!rotating) {
              setRotateTarget(null);
            }
          }}
          dismissible={!rotating}
          className="max-w-md"
        >
          <p className="text-sm text-muted mb-6">
            {t("webhooks.rotate.confirm")}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setRotateTarget(null)}
              disabled={rotating}
              className="min-h-11 rounded-md border border-panel-edge px-4 py-2 text-sm font-medium hover:bg-panel-elevated disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={() => void confirmRotate()}
              disabled={rotating}
              className="min-h-11 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:bg-accent-hover disabled:opacity-50"
            >
              {rotating ? (
                <span className="inline-flex items-center gap-2">
                  <Zap className="h-4 w-4 animate-calm-busy" aria-hidden="true" />
                  {t("webhooks.actions.confirmRotate")}
                </span>
              ) : (
                t("webhooks.actions.confirmRotate")
              )}
            </button>
          </div>
        </Modal>
      )}

      {secretPayload && (
        <SecretRevealModal
          signingSecret={secretPayload.signingSecret}
          onDone={() => void handleSecretDone()}
        />
      )}
    </div>
  );
};
