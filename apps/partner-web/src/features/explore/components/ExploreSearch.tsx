import React from "react";

interface ExploreSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExploreSearch({ value, onChange }: ExploreSearchProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="company-search" className="text-sm font-medium text-partner-ink">
        Search companies
      </label>
      <input
        id="company-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by company, ticker, or what they do"
        className="min-h-12 w-full rounded-lg border border-partner-line bg-partner-surface px-4 text-base text-partner-ink outline-none focus:border-partner-accent focus:ring-2 focus:ring-partner-accent/20"
      />
    </div>
  );
}
