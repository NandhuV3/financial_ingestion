import React from "react";
import type { BusinessHealth } from "../../company/mock/companies";

export type HealthFilter = BusinessHealth | null;

const healthFilters: Array<{ value: HealthFilter; label: string }> = [
  { value: null, label: "All" },
  { value: "improving", label: "Improving" },
  { value: "stable", label: "Stable" },
  { value: "weakening", label: "Weakening" },
];

interface HealthFilterChipsProps {
  selectedHealth: HealthFilter;
  onSelectHealth: (health: HealthFilter) => void;
}

export function HealthFilterChips({ selectedHealth, onSelectHealth }: HealthFilterChipsProps) {
  return (
    <div aria-label="Business health filters" className="flex gap-2 overflow-x-auto pb-1">
      {healthFilters.map((filter) => (
        <button
          key={filter.label}
          type="button"
          onClick={() => onSelectHealth(filter.value)}
          aria-pressed={selectedHealth === filter.value}
          className={[
            "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium",
            selectedHealth === filter.value
              ? "border-partner-accent bg-partner-accent text-white"
              : "border-partner-line bg-partner-surface text-partner-muted",
          ].join(" ")}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
