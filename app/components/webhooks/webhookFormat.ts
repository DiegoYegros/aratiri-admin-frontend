import type { LanguageCode } from "@/app/lib/language";

export const formatTimestamp = (
  value: string | null | undefined,
  language: LanguageCode
): string => {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(language === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const truncateMiddle = (value: string, max = 42): string => {
  if (value.length <= max) {
    return value;
  }
  const keep = Math.max(8, Math.floor((max - 1) / 2));
  return `${value.slice(0, keep)}…${value.slice(-keep)}`;
};

export const formatEventTypesSummary = (types: string[]): string => {
  const sorted = [...types].sort();
  if (sorted.length === 0) {
    return "—";
  }
  if (sorted.length <= 2) {
    return sorted.join(", ");
  }
  return `${sorted.slice(0, 2).join(", ")} +${sorted.length - 2}`;
};

export const deliveryStatusClass = (status: string): string => {
  switch (status) {
    case "SUCCEEDED":
      return "text-success";
    case "FAILED":
      return "text-danger";
    case "PENDING":
      return "text-pending";
    default:
      return "text-muted";
  }
};

/** Retry is only supported for FAILED deliveries (not PENDING/SUCCEEDED). */
export const canRetryDelivery = (status: string): boolean => status === "FAILED";

export const hasSigningSecret = (
  secret: { signingSecret?: string | null } | null | undefined
): boolean => Boolean(secret?.signingSecret?.trim());
