import React from "react";
import { Card } from "../../../components/ui/Card";
import type { MockCompany } from "../mock/companies";

interface MoneySectionProps {
  company: MockCompany;
}

const moneyItems = [
  ["Daily Sales", "Revenue", "dailySales"],
  ["What's Left After Costs", "Margin", "margin"],
  ["Loans To Expand", "Debt", "debt"],
  ["Money In The Drawer", "Cash Flow", "cashflow"],
] as const;

export function MoneySection({ company }: MoneySectionProps) {
  return (
    <section
      id="company-panel-money"
      role="tabpanel"
      aria-labelledby="company-tab-money"
      className="grid gap-3 sm:grid-cols-2"
    >
      {moneyItems.map(([label, subtitle, field]) => (
        <Card key={label} className="min-h-40">
          <p className="text-xs font-semibold uppercase tracking-wide text-partner-muted">{subtitle}</p>
          <h2 className="mt-2 text-lg font-semibold text-partner-ink">{label}</h2>
          <p className="mt-3 text-base leading-7 text-partner-muted">{company.money[field]}</p>
        </Card>
      ))}
    </section>
  );
}
