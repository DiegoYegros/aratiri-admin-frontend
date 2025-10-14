"use client";

import { Check, ClipboardCopy, LucideIcon } from "lucide-react";
import { useState } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
}

export const StatCard = ({ title, value, icon: Icon }: StatCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isString = typeof value === "string";
  const TRUNCATE_LENGTH = 10;
  const isLong = isString && value.length > TRUNCATE_LENGTH;

  const toggleExpansion = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLong) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center group relative">
      <div className="p-2 bg-gray-700 rounded-md mr-4 self-start">
        <Icon className="w-6 h-6 text-yellow-400" />
      </div>
      <div className="overflow-hidden">
        <p className="text-sm text-gray-400">{title}</p>
        {isLong && !isExpanded ? (
          <p className="text-xl font-bold">
            <span>{value.substring(0, 7)}</span>
            <button
              onClick={toggleExpansion}
              className="text-yellow-400 hover:text-yellow-300 ml-1"
              title="Expand"
            >
              ...
            </button>
          </p>
        ) : (
          <p
            className={`text-xl font-bold ${
              isLong ? "break-all cursor-pointer" : ""
            }`}
            onClick={isLong ? toggleExpansion : undefined}
            title={isLong ? "Click to collapse" : ""}
          >
            {value}
          </p>
        )}
      </div>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1 bg-gray-700 rounded-md text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check size={16} className="text-green-500" />
        ) : (
          <ClipboardCopy size={16} />
        )}
      </button>
    </div>
  );
};