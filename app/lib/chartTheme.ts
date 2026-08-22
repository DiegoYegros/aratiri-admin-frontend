import { LanguageCode } from "./language";

/**
 * Quiet Voltage chart theme. Single source of truth for recharts SVG props.
 * Hex values kept in sync with the tokens in app/globals.css (recharts needs
 * concrete strings, CSS variables are not usable here).
 */
export const CHART_COLORS = {
  accent: "#c9a227",
  accentHover: "#dbb43a",
  credit: "#5fad6e",
  debit: "#d16a6a",
  panelEdge: "#2c2b26",
  panelElevated: "#1a1916",
  muted: "#8c8a80",
  mutedStrong: "#b3b1a6",
  foreground: "#f0efe9",
} as const;

export const AXIS_TICK = { fill: CHART_COLORS.muted, fontSize: 12 };
export const AXIS_LINE = { stroke: CHART_COLORS.panelEdge };
export const GRID_PROPS = {
  stroke: CHART_COLORS.panelEdge,
  strokeDasharray: "3 3",
  vertical: false,
} as const;
export const CURSOR_STROKE = CHART_COLORS.panelEdge;

export const LEGEND_STYLE = { color: CHART_COLORS.mutedStrong };

export const getLocale = (language: LanguageCode): string =>
  language === "es" ? "es-ES" : "en-US";

/** Compact sat formatting for chart axes: 1.5B / 2.3M / 4.1k / 900. */
export const formatSatsCompact = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return value.toLocaleString();
};

/** Locale-aware sats rendering for tooltips/tables. */
export const formatSatsLocale = (value: number, language: LanguageCode): string =>
  value.toLocaleString(getLocale(language));

/** Locale-aware short date, e.g. en-US "Mar 12", es-ES "12 mar". */
export const formatShortDate = (
  isoDate: string,
  language: LanguageCode
): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat(getLocale(language), {
    month: "short",
    day: "numeric",
  }).format(date);
};
