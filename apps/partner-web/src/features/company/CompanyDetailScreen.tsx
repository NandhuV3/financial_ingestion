import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { PageContainer } from "../../components/ui/PageContainer";
import { EXPLORE_ROUTE } from "../../constants/routes";
import { logger } from "../../lib/logger/logger";
import { CompanyHeader } from "./components/CompanyHeader";
import { CompanyTabs, type CompanyTabId } from "./components/CompanyTabs";
import { CustomersSection } from "./components/CustomersSection";
import { ForensicsSection } from "./components/ForensicsSection";
import { MoneySection } from "./components/MoneySection";
import { StorySection } from "./components/StorySection";
import { TrustSection } from "./components/TrustSection";
import { usePartnerIntelligence } from "./hooks/usePartnerIntelligence";
import { findCompanyByTicker, type MockCompany } from "./mock/companies";
import type { PartnerCompanyViewModel } from "./types/partner-company-view-model";
import { usePortfolio } from "../portfolio/usePortfolio";

interface CompanyDetailContentProps {
  company: PartnerCompanyViewModel;
  initialTab?: CompanyTabId;
  onAddToPortfolio?: () => void;
  isInPortfolio?: boolean;
}

function mapMockCompanyToViewModel(company: MockCompany): PartnerCompanyViewModel {
  return {
    name: company.name,
    ticker: company.ticker,
    tagline: company.tagline,
    neighbourhoodExplanation: company.neighbourhoodExplanation,
    businessHealth: company.businessHealth,
    conviction: company.conviction,
    story: company.story,
    customers: company.customers,
    money: company.money,
    trust: company.trust,
    forensics: company.forensics,
  };
}

function CompanyLoadingState() {
  return (
    <PageContainer>
      <Card>
        <p className="text-base leading-7 text-partner-muted">Loading company story...</p>
      </Card>
    </PageContainer>
  );
}

function CompanyErrorState() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <Link
          to={EXPLORE_ROUTE}
          className="inline-flex min-h-11 items-center rounded-md text-sm font-medium text-partner-accent focus:outline-none focus:ring-2 focus:ring-partner-accent focus:ring-offset-2 focus:ring-offset-partner-paper"
        >
          Back to Explore
        </Link>
        <Card>
          <h1 className="text-3xl font-semibold tracking-normal text-partner-ink">
            We couldn't load this business right now.
          </h1>
          <p className="mt-3 text-base leading-7 text-partner-muted">Please try again later.</p>
        </Card>
      </div>
    </PageContainer>
  );
}

export function CompanyDetailContent({
  company,
  initialTab = "story",
  onAddToPortfolio,
  isInPortfolio,
}: CompanyDetailContentProps) {
  const [activeTab, setActiveTab] = useState<CompanyTabId>(initialTab);

  return (
    <PageContainer>
      <div className="space-y-6">
        <CompanyHeader
          company={company}
          onAddToPortfolio={onAddToPortfolio}
          isInPortfolio={isInPortfolio}
        />
        <CompanyTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "story" && <StorySection company={company} />}
        {activeTab === "customers" && <CustomersSection company={company} />}
        {activeTab === "money" && <MoneySection company={company} />}
        {activeTab === "trust" && <TrustSection company={company} />}
        {activeTab === "forensics" && <ForensicsSection company={company} />}
      </div>
    </PageContainer>
  );
}

export function CompanyDetailScreen() {
  const { ticker = "" } = useParams();
  const [searchParams] = useSearchParams();
  const normalizedTicker = ticker.trim().toUpperCase();
  const { data, loading, error } = usePartnerIntelligence(normalizedTicker);
  const { addHolding, hasHolding, markReviewed } = usePortfolio();
  const reviewMarkedRef = useRef(false);
  const mockCompany = useMemo(() => findCompanyByTicker(normalizedTicker), [normalizedTicker]);
  const mockViewModel = useMemo(
    () => mockCompany ? mapMockCompanyToViewModel(mockCompany) : null,
    [mockCompany],
  );
  const company = data ?? (error ? mockViewModel : null);
  const dataSource = data ? "api" : error && mockViewModel ? "mock" : error ? "error" : "loading";

  useEffect(() => {
    logger.info("Company detail data source selected", {
      ticker: normalizedTicker,
      data_source: dataSource,
    });
  }, [normalizedTicker, dataSource]);

  useEffect(() => {
    reviewMarkedRef.current = false;
  }, [normalizedTicker]);

  useEffect(() => {
    if (!reviewMarkedRef.current && searchParams.get("fromPortfolio") === "1" && hasHolding(normalizedTicker)) {
      reviewMarkedRef.current = true;
      markReviewed(normalizedTicker);
    }
  }, [hasHolding, markReviewed, normalizedTicker, searchParams]);

  if (loading) {
    return <CompanyLoadingState />;
  }

  if (!company) {
    return <CompanyErrorState />;
  }

  return (
    <CompanyDetailContent
      company={company}
      onAddToPortfolio={() => addHolding({
        ticker: company.ticker,
        companyName: company.name,
      })}
      isInPortfolio={hasHolding(company.ticker)}
    />
  );
}
