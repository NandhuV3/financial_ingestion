import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { PageContainer } from "../../components/ui/PageContainer";
import { EXPLORE_ROUTE } from "../../constants/routes";
import { CompanyHeader } from "./components/CompanyHeader";
import { CompanyTabs, type CompanyTabId } from "./components/CompanyTabs";
import { CustomersSection } from "./components/CustomersSection";
import { ForensicsSection } from "./components/ForensicsSection";
import { MoneySection } from "./components/MoneySection";
import { StorySection } from "./components/StorySection";
import { TrustSection } from "./components/TrustSection";
import { findCompanyByTicker, type MockCompany } from "./mock/companies";

interface CompanyDetailContentProps {
  company: MockCompany;
  initialTab?: CompanyTabId;
}

export function CompanyDetailContent({ company, initialTab = "story" }: CompanyDetailContentProps) {
  const [activeTab, setActiveTab] = useState<CompanyTabId>(initialTab);

  return (
    <PageContainer>
      <div className="space-y-6">
        <CompanyHeader company={company} />
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
  const company = findCompanyByTicker(ticker);

  if (!company) {
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
            <h1 className="text-3xl font-semibold tracking-normal text-partner-ink">Company not found</h1>
            <p className="mt-3 text-base leading-7 text-partner-muted">
              We do not have a mock company story for {ticker.toUpperCase() || "that ticker"} yet.
            </p>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return <CompanyDetailContent company={company} />;
}
