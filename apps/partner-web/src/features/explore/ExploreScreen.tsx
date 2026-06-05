import React, { useMemo, useState } from "react";
import { PageContainer } from "../../components/ui/PageContainer";
import {
  companyCategories,
  filterCompanies,
  mockCompanies,
  type CompanyCategory,
} from "../company/mock/companies";
import { CategoryChips } from "./components/CategoryChips";
import { CompanyList } from "./components/CompanyList";
import { ExploreSearch } from "./components/ExploreSearch";

export function ExploreScreen() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CompanyCategory | null>(null);

  const filteredCompanies = useMemo(
    () => filterCompanies(mockCompanies, searchTerm, selectedCategory),
    [searchTerm, selectedCategory],
  );

  return (
    <PageContainer>
      <div className="space-y-6">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-partner-muted">
            Explore businesses
          </p>
          <h1 className="text-3xl font-semibold tracking-normal text-partner-ink">
            Find companies you understand
          </h1>
          <p className="max-w-2xl text-base leading-7 text-partner-muted">
            Browse familiar businesses by what they do, who they serve, and why they matter.
          </p>
        </header>

        <ExploreSearch value={searchTerm} onChange={setSearchTerm} />
        <CategoryChips
          categories={companyCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <section aria-labelledby="company-list-heading" className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="company-list-heading" className="text-xl font-semibold text-partner-ink">
                Companies
              </h2>
              <p className="mt-1 text-sm text-partner-muted">
                {filteredCompanies.length} businesses found
              </p>
            </div>
          </div>
          <CompanyList companies={filteredCompanies} />
        </section>
      </div>
    </PageContainer>
  );
}
