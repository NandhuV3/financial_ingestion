import React from "react";

export type CompanyTabId = "story" | "customers" | "money" | "trust" | "forensics";

export const companyTabs: Array<{ id: CompanyTabId; label: string }> = [
  { id: "story", label: "Story" },
  { id: "customers", label: "Customers" },
  { id: "money", label: "Money" },
  { id: "trust", label: "Trust" },
  { id: "forensics", label: "Forensics" },
];

interface CompanyTabsProps {
  activeTab: CompanyTabId;
  onChange: (tab: CompanyTabId) => void;
}

export function CompanyTabs({ activeTab, onChange }: CompanyTabsProps) {
  return (
    <div role="tablist" aria-label="Company sections" className="flex gap-2 overflow-x-auto pb-1">
      {companyTabs.map((tab) => (
        <button
          key={tab.id}
          id={`company-tab-${tab.id}`}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`company-panel-${tab.id}`}
          onClick={() => onChange(tab.id)}
          className={[
            "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-partner-accent focus:ring-offset-2 focus:ring-offset-partner-paper",
            activeTab === tab.id
              ? "border-partner-accent bg-partner-accent text-white"
              : "border-partner-line bg-partner-surface text-partner-muted",
          ].join(" ")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
