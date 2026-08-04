"use client";

import { useLanguage } from "@/app/lib/language";

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  /**
   * Render a single label line above the series rows (e.g. the X-axis value).
   * Returns raw React node; must be memoized by the caller when expensive.
   */
  labelRenderer?: (label: string | number) => string;
  /** Format a single series value. Defaults to locale sats. */
  valueRenderer?: (entry: TooltipEntry, index: number) => string;
}

export const ChartTooltip = ({
  active,
  payload,
  label,
  labelRenderer,
  valueRenderer,
}: ChartTooltipProps) => {
  const { language } = useLanguage();

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formatValue = (entry: TooltipEntry, index: number): string => {
    if (valueRenderer) {
      return valueRenderer(entry, index);
    }
    const value = entry.value;
    if (typeof value === "number") {
      return value.toLocaleString(language === "es" ? "es-ES" : "en-US");
    }
    return String(value ?? "");
  };

  return (
    <div className="bg-panel-elevated border border-panel-edge rounded-lg px-3 py-2 text-sm shadow-none">
      {label !== undefined && label !== "" && labelRenderer ? (
        <p className="text-muted mb-1">{labelRenderer(label)}</p>
      ) : null}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div
            key={`${entry.dataKey ?? entry.name ?? index}-${index}`}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-1.5 text-muted">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: entry.color || "#c9a227",
                }}
              />
              <span>{String(entry.name ?? "")}</span>
            </span>
            <span className="font-amount text-foreground">
              {formatValue(entry, index)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
