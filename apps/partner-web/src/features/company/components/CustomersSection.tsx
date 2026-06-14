import React from "react";
import { Card } from "../../../components/ui/Card";
import type { PartnerCompanyViewModel } from "../types/partner-company-view-model";

interface CustomersSectionProps {
  company: PartnerCompanyViewModel;
}

export function CustomersSection({ company }: CustomersSectionProps) {
  return (
    <section
      id="company-panel-customers"
      aria-label="Customers"
    >
      <Card className="divide-y divide-partner-line p-5">
        {company.customers.map((customer) => (
          <article key={customer.segment} className="py-4 first:pt-0 last:pb-0">
            <h3 className="text-base font-semibold text-partner-ink">{customer.segment}</h3>
            <p className="mt-2 text-base leading-7 text-partner-muted">{customer.whyTheyBuy}</p>
          </article>
        ))}
      </Card>
    </section>
  );
}
