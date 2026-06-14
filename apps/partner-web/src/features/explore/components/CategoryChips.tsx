import React from "react";
import type { CompanyCategory } from "../../company/mock/companies";

interface CategoryChipsProps {
  categories: CompanyCategory[];
  selectedCategory: CompanyCategory | null;
  onSelectCategory: (category: CompanyCategory | null) => void;
}

export function CategoryChips({ categories, selectedCategory, onSelectCategory }: CategoryChipsProps) {
  return (
    <div aria-label="Company categories" className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={[
          "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium",
          selectedCategory === null
            ? "border-partner-accent bg-partner-accent text-white"
            : "border-partner-line bg-partner-surface text-partner-muted",
        ].join(" ")}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onSelectCategory(category)}
          aria-pressed={selectedCategory === category}
          className={[
            "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium",
            selectedCategory === category
              ? "border-partner-accent bg-partner-accent text-white"
              : "border-partner-line bg-partner-surface text-partner-muted",
          ].join(" ")}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
