export type BusinessHealth = "improving" | "stable" | "weakening";
export type ConvictionLevel = "High" | "Medium" | "Watch";

export type CompanyCategory =
  | "Everyday Brands"
  | "B2B Workhorses"
  | "Founder-led"
  | "Turnarounds"
  | "Cash Machines";

export interface MockCompany {
  id: string;
  ticker: string;
  name: string;
  tagline: string;
  category: CompanyCategory;
  partnerSummary: string;
  businessHealth: BusinessHealth;
  conviction: ConvictionLevel;
  neighbourhoodExplanation: string;
}

export const companyCategories: CompanyCategory[] = [
  "Everyday Brands",
  "B2B Workhorses",
  "Founder-led",
  "Turnarounds",
  "Cash Machines",
];

export const mockCompanies: MockCompany[] = [
  {
    id: "microsoft",
    ticker: "MSFT",
    name: "Microsoft",
    tagline: "Builds software and cloud infrastructure used by businesses worldwide.",
    category: "B2B Workhorses",
    partnerSummary: "Microsoft helps companies run, build, and secure their digital work.",
    businessHealth: "improving",
    conviction: "High",
    neighbourhoodExplanation:
      "If Microsoft were a shop in your neighbourhood, it would be the office supply store, power grid, and workshop that many businesses rely on every day.",
  },
  {
    id: "apple",
    ticker: "AAPL",
    name: "Apple",
    tagline: "Designs devices, services, and software that anchor daily digital life.",
    category: "Everyday Brands",
    partnerSummary: "Apple keeps customers close through products people use repeatedly.",
    businessHealth: "stable",
    conviction: "High",
    neighbourhoodExplanation:
      "If Apple were a shop in your neighbourhood, it would be the trusted design studio where people return for tools they use all day.",
  },
  {
    id: "costco",
    ticker: "COST",
    name: "Costco",
    tagline: "Runs membership warehouses built around value, trust, and repeat visits.",
    category: "Everyday Brands",
    partnerSummary: "Costco earns loyalty by keeping the customer bargain clear and consistent.",
    businessHealth: "stable",
    conviction: "High",
    neighbourhoodExplanation:
      "If Costco were a shop in your neighbourhood, it would be the warehouse club families trust for reliable value on the essentials.",
  },
  {
    id: "visa",
    ticker: "V",
    name: "Visa",
    tagline: "Operates payment rails used whenever money moves digitally.",
    category: "Cash Machines",
    partnerSummary: "Visa benefits from the steady shift from cash to digital payments.",
    businessHealth: "improving",
    conviction: "High",
    neighbourhoodExplanation:
      "If Visa were a shop in your neighbourhood, it would be the toll road used every time money moves digitally.",
  },
  {
    id: "adobe",
    ticker: "ADBE",
    name: "Adobe",
    tagline: "Makes creative and document tools used by professionals and teams.",
    category: "B2B Workhorses",
    partnerSummary: "Adobe sells important creative tools into workflows that are hard to replace.",
    businessHealth: "stable",
    conviction: "Medium",
    neighbourhoodExplanation:
      "If Adobe were a shop in your neighbourhood, it would be the studio that creators and office teams visit to finish polished work.",
  },
  {
    id: "netflix",
    ticker: "NFLX",
    name: "Netflix",
    tagline: "Builds a global entertainment service with recurring customer relationships.",
    category: "Turnarounds",
    partnerSummary: "Netflix is working to turn a large audience into durable entertainment economics.",
    businessHealth: "improving",
    conviction: "Medium",
    neighbourhoodExplanation:
      "If Netflix were a shop in your neighbourhood, it would be the theater subscription people keep because there is always something new to watch.",
  },
  {
    id: "amazon",
    ticker: "AMZN",
    name: "Amazon",
    tagline: "Runs commerce, logistics, advertising, and cloud infrastructure at scale.",
    category: "Founder-led",
    partnerSummary: "Amazon combines customer convenience with infrastructure businesses built for scale.",
    businessHealth: "improving",
    conviction: "High",
    neighbourhoodExplanation:
      "If Amazon were a shop in your neighbourhood, it would be the everything store with its own delivery network and a power room for other businesses.",
  },
  {
    id: "nvidia",
    ticker: "NVDA",
    name: "Nvidia",
    tagline: "Designs chips and platforms that power accelerated computing and AI systems.",
    category: "Founder-led",
    partnerSummary: "Nvidia sells the picks and shovels for companies building modern AI infrastructure.",
    businessHealth: "improving",
    conviction: "Watch",
    neighbourhoodExplanation:
      "If Nvidia were a shop in your neighbourhood, it would be the specialist supplier every builder visits before starting advanced technology projects.",
  },
];

export const homeHoldings = mockCompanies.slice(0, 3);

export function filterCompanies(
  companies: MockCompany[],
  searchTerm: string,
  selectedCategory?: CompanyCategory | null,
): MockCompany[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return companies.filter((company) => {
    const matchesSearch = normalizedSearch.length === 0
      || company.name.toLowerCase().includes(normalizedSearch)
      || company.ticker.toLowerCase().includes(normalizedSearch)
      || company.tagline.toLowerCase().includes(normalizedSearch);

    const matchesCategory = !selectedCategory || company.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });
}
