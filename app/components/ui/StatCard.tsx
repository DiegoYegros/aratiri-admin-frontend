"use client";

import { Check, ClipboardCopy, LucideIcon } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/app/lib/language";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  unit?: string;
}

export const StatCard = ({ title, value, icon: Icon, unit }: StatCardProps) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayValue = String(value);
  const TRUNCATE_LENGTH = 10;
  const isLong = displayValue.length > TRUNCATE_LENGTH;
  const isNumericLike = typeof value === "number" || Boolean(unit);
  const valueClass = isNumericLike || isLong ? "font-amount" : "";

  const toggleExpansion = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLong) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = unit ? `${displayValue} ${unit}` : displayValue;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-panel p-4 rounded-lg border border-panel-edge flex items-center group relative">
      <div className="p-2 bg-panel-elevated rounded-md mr-4 self-start">
        <Icon className="w-6 h-6 text-accent" />
      </div>
      <div className="overflow-hidden">
        <p className="text-sm text-muted">{title}</p>
        {isLong && !isExpanded ? (
          <p className={`text-xl font-bold ${valueClass}`}>
            <span>{displayValue.substring(0, 7)}</span>
            <button
              onClick={toggleExpansion}
              className="text-accent hover:text-accent-hover ml-1"
              title={t("statCard.expand")}
            >
              ...
            </button>
            {unit && <span className="text-lg ml-1 text-muted">{unit}</span>}
          </p>
        ) : (
          <p
            className={`text-xl font-bold ${valueClass} ${
              isLong ? "break-all cursor-pointer" : ""
            }`}
            onClick={isLong ? toggleExpansion : undefined}
            title={isLong ? t("statCard.collapse") : ""}
          >
            {displayValue}
            {unit && <span className="text-lg ml-1 text-muted">{unit}</span>}
          </p>
        )}
      </div>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1 bg-panel-elevated rounded-md text-muted opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
        title={t("statCard.copy")}
      >
        {copied ? (
          <Check size={16} className="text-success" />
        ) : (
          <ClipboardCopy size={16} />
        )}
      </button>
    </div>
  );
};
