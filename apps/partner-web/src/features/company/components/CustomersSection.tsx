import React from "react";
import { Card } from "../../../components/ui/Card";
import type { MockCompany } from "../mock/companies";

interface CustomersSectionProps {
  company: MockCompany;
}

export function CustomersSection({ company }: CustomersSectionProps) {
  return (
    <section
      id="company-panel-customers"
      role="tabpanel"
      aria-labelledby="company-tab-customers"
      className="grid gap-3"
    >
      {company.customers.map((customer) => (
        <Card key={customer.segment}>
          <h2 className="text-lg font-semibold text-partner-ink">{customer.segment}</h2>
          <p className="mt-2 text-base leading-7 text-partner-muted">{customer.whyTheyBuy}</p>
        </Card>
      ))}
    </section>
  );
}
