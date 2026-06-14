import React, { useMemo, useState } from "react";
import { PageContainer } from "../../components/ui/PageContainer";
import {
  companyCategories,
  filterCompanies,
  mockCompanies,
  type CompanyCategory,
  type BusinessHealth,
} from "../company/mock/companies";
import { buildDiscoverySections } from "./utils/build-discovery-sections";
import { CategoryChips } from "./components/CategoryChips";
import { CompanyList } from "./components/CompanyList";
import { CompactCompanyRow } from "./components/CompactCompanyRow";
import { ExploreSearch } from "./components/ExploreSearch";
import { FeaturedCompanies } from "./components/FeaturedCompanies";
import { HealthFilterChips } from "./components/HealthFilterChips";
import type { DiscoveryCompanyCard } from "./types/discovery-company-card";

export function ExploreScreen() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CompanyCategory | null>(null);
  const [selectedHealth, setSelectedHealth] = useState<BusinessHealth | null>(null);

  const filteredCompanies = useMemo(
    () => filterCompanies(mockCompanies, searchTerm, selectedCategory)
      .filter((company) => !selectedHealth || company.businessHealth === selectedHealth),
    [searchTerm, selectedCategory, selectedHealth],
  );
  const sections = useMemo(
    () => buildDiscoverySections(filteredCompanies),
    [filteredCompanies],
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
        <HealthFilterChips
          selectedHealth={selectedHealth}
          onSelectHealth={setSelectedHealth}
        />

        <FeaturedCompanies companies={sections.featured} />
        <DiscoverySection
          title="High Conviction"
          description="Businesses with stronger owner conviction in the current discovery set."
          companies={sections.highConviction}
        />
        <DiscoverySection
          title="Watch Carefully"
          description="Businesses that deserve closer review before an owner builds conviction."
          companies={sections.watchCarefully}
        />
        <AllCompaniesSection
          description={`${sections.allCompanies.length} businesses found`}
          companies={sections.allCompanies}
        />
      </div>
    </PageContainer>
  );
}

function DiscoverySection({
  title,
  description,
  companies,
}: {
  title: string;
  description: string;
  companies: DiscoveryCompanyCard[];
}) {
  return (
    <section aria-labelledby={`${sectionId(title)}-heading`} className="space-y-3">
      <div>
        <h2 id={`${sectionId(title)}-heading`} className="text-xl font-semibold text-partner-ink">
          {title}
        </h2>
        <p className="mt-1 text-sm text-partner-muted">{description}</p>
      </div>
      <CompanyList companies={companies} />
    </section>
  );
}

function sectionId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function AllCompaniesSection({
  description,
  companies,
}: {
  description: string;
  companies: DiscoveryCompanyCard[];
}) {
  return (
    <section aria-labelledby="all-companies-heading" className="space-y-3">
      <div>
        <h2 id="all-companies-heading" className="text-xl font-semibold text-partner-ink">
          All Companies
        </h2>
        <p className="mt-1 text-sm text-partner-muted">{description}</p>
      </div>

      {companies.length === 0 ? (
        <p className="rounded-lg border border-dashed border-partner-line bg-partner-surface p-5 text-sm text-partner-muted">
          No companies match that search yet.
        </p>
      ) : (
        <div className="grid gap-2">
          {companies.map((company) => (
            <CompactCompanyRow key={company.ticker} company={company} />
          ))}
        </div>
      )}
    </section>
  );
}
