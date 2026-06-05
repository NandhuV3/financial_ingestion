import React from "react";
import { PageContainer } from "../../components/ui/PageContainer";
import { homeHoldings } from "../company/mock/companies";
import { PartnerHoldingCard } from "./components/PartnerHoldingCard";
import { TodayStrip } from "./components/TodayStrip";

export function HomeScreen() {
  return (
    <PageContainer>
      <div className="space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-partner-muted">
            Long-term ownership
          </p>
          <h1 className="text-3xl font-semibold tracking-normal text-partner-ink">
            Your Partner Portfolio
          </h1>
          <p className="max-w-2xl text-base leading-7 text-partner-muted">
            A calm place to understand the businesses you want to own like a partner.
          </p>
        </header>

        <TodayStrip />

        <section aria-labelledby="holdings-heading" className="space-y-4">
          <div>
            <h2 id="holdings-heading" className="text-xl font-semibold text-partner-ink">
              Partner Holdings
            </h2>
            <p className="mt-1 text-sm leading-6 text-partner-muted">
              Three businesses to revisit through an ownership lens.
            </p>
          </div>
          <div className="grid gap-4">
            {homeHoldings.map((company) => (
              <PartnerHoldingCard key={company.id} company={company} />
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
