import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import { JSDOM } from "jsdom";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { routes } from "../apps/partner-web/src/app/router.tsx";
import { BottomNav } from "../apps/partner-web/src/layouts/BottomNav.tsx";
import {
  EXPLORE_ROUTE,
  HOME_ROUTE,
  LEARN_ROUTE,
  PORTFOLIO_ROUTE,
  PROFILE_ROUTE,
} from "../apps/partner-web/src/constants/routes.ts";
import { getPartnerCompany } from "../apps/partner-web/src/api/partner-api.ts";
import { HomeScreen } from "../apps/partner-web/src/features/home/HomeScreen.tsx";
import { CompanyList } from "../apps/partner-web/src/features/explore/components/CompanyList.tsx";
import { CompactCompanyRow } from "../apps/partner-web/src/features/explore/components/CompactCompanyRow.tsx";
import {
  buildDiscoverySections,
  mapMockCompanyToDiscoveryCard,
} from "../apps/partner-web/src/features/explore/utils/build-discovery-sections.ts";
import { PortfolioScreen } from "../apps/partner-web/src/features/portfolio/PortfolioScreen.tsx";
import {
  findCompanyByTicker,
  filterCompanies,
  homeHoldings,
  mockCompanies,
} from "../apps/partner-web/src/features/company/mock/companies.ts";
import { PORTFOLIO_HOLDINGS_KEY } from "../apps/partner-web/src/constants/local-storage.ts";
import { PARTNER_JOURNAL_ENTRIES_KEY } from "../apps/partner-web/src/constants/local-storage.ts";
import {
  CompanyDetailContent,
  CompanyDetailScreen,
} from "../apps/partner-web/src/features/company/CompanyDetailScreen.tsx";
import { getPartnerIntelligence } from "../apps/partner-web/src/features/company/api/partner-intelligence.api.ts";
import { mapPartnerCompanyToViewModel } from "../apps/partner-web/src/features/company/adapters/partner-company.adapter.ts";
import {
  usePartnerIntelligence,
  type UsePartnerIntelligenceResult,
} from "../apps/partner-web/src/features/company/hooks/usePartnerIntelligence.ts";
import type { PartnerCompanyIntelligence } from "../apps/partner-web/src/types/partner-domain.types.ts";
import type { PartnerCompanyViewModel } from "../apps/partner-web/src/features/company/types/partner-company-view-model.ts";
import type { PortfolioHolding } from "../apps/partner-web/src/features/portfolio/types.ts";
import type { PartnerJournalEntry } from "../apps/partner-web/src/features/journal/types.ts";
import {
  addPortfolioHolding,
  buildPortfolioHealthSummary,
  buildPortfolioSummary,
  updatePortfolioConviction,
  updatePortfolioNote,
  updatePortfolioReviewTimestamp,
} from "../apps/partner-web/src/features/portfolio/usePortfolio.ts";
import {
  addJournalEntry,
  countJournalEntriesByTicker,
  createJournalEntry,
  getJournalEntriesForTicker,
} from "../apps/partner-web/src/features/journal/useJournal.ts";

function setupDom() {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousNavigator = globalThis.navigator;
  const previousActEnvironment = (globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  }).IS_REACT_ACT_ENVIRONMENT;
  const dom = new JSDOM("<!doctype html><html><body><div id=\"root\"></div></body></html>", {
    url: "http://localhost:5173/",
  });

  globalThis.window = dom.window as unknown as Window & typeof globalThis;
  globalThis.document = dom.window.document;
  (globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  }).IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
  });

  return {
    container: dom.window.document.getElementById("root") as HTMLElement,
    cleanup() {
      globalThis.window = previousWindow;
      globalThis.document = previousDocument;
      Object.defineProperty(globalThis, "navigator", {
        value: previousNavigator,
        configurable: true,
      });
      (globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }).IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
      dom.window.close();
    },
  };
}

async function waitForCondition(condition: () => boolean): Promise<void> {
  for (let index = 0; index < 20; index += 1) {
    if (condition()) {
      return;
    }

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  throw new Error("Timed out waiting for hook state.");
}

function renderPartnerIntelligenceHook(ticker: string, filingDate?: string) {
  const dom = setupDom();
  const snapshots: UsePartnerIntelligenceResult[] = [];
  const root: Root = createRoot(dom.container);

  function HookProbe() {
    const result = usePartnerIntelligence(ticker, filingDate);
    snapshots.push(result);
    return null;
  }

  act(() => {
    root.render(React.createElement(HookProbe));
  });

  return {
    snapshots,
    latest() {
      return snapshots[snapshots.length - 1];
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      dom.cleanup();
    },
  };
}

function renderCompanyRoute(
  initialEntry: string,
  initialHoldings: PortfolioHolding[] = [],
  initialJournalEntries: PartnerJournalEntry[] = [],
) {
  const dom = setupDom();
  const root = createRoot(dom.container);

  dom.container.ownerDocument.defaultView!.localStorage.setItem(PORTFOLIO_HOLDINGS_KEY, JSON.stringify(initialHoldings));
  dom.container.ownerDocument.defaultView!.localStorage.setItem(
    PARTNER_JOURNAL_ENTRIES_KEY,
    JSON.stringify(initialJournalEntries),
  );

  act(() => {
    root.render(
      React.createElement(
        MemoryRouter,
        { initialEntries: [initialEntry] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: "/company/:ticker",
            element: React.createElement(CompanyDetailScreen),
          }),
        ),
      ),
    );
  });

  return {
    container: dom.container,
    text() {
      return dom.container.textContent ?? "";
    },
    clickButton(label: string) {
      const button = Array.from(dom.container.querySelectorAll("button"))
        .find((element) => element.textContent === label);

      assert.ok(button, `Expected button ${label} to exist`);

      act(() => {
        button.dispatchEvent(new dom.container.ownerDocument.defaultView!.MouseEvent("click", {
          bubbles: true,
        }));
      });
    },
    fillJournalField(label: string, value: string) {
      const textareas = Array.from(dom.container.querySelectorAll("textarea"));
      const labels = Array.from(dom.container.querySelectorAll("label"));
      const labelElement = labels.find((element) => element.textContent?.includes(label));

      assert.ok(labelElement, `Expected journal label ${label} to exist`);

      const textarea = textareas.find((element) => labelElement.contains(element));

      assert.ok(textarea, `Expected textarea for ${label} to exist`);

      act(() => {
        const valueSetter = Object.getOwnPropertyDescriptor(dom.container.ownerDocument.defaultView!.HTMLTextAreaElement.prototype, "value")?.set;
        valueSetter?.call(textarea, value);
        textarea.dispatchEvent(new dom.container.ownerDocument.defaultView!.Event("input", { bubbles: true }));
        textarea.dispatchEvent(new dom.container.ownerDocument.defaultView!.Event("change", { bubbles: true }));
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      dom.cleanup();
    },
  };
}

function renderPortfolioRoute(
  initialHoldings: PortfolioHolding[] = [],
  initialJournalEntries: PartnerJournalEntry[] = [],
) {
  const dom = setupDom();
  const root = createRoot(dom.container);

  dom.container.ownerDocument.defaultView!.localStorage.setItem(PORTFOLIO_HOLDINGS_KEY, JSON.stringify(initialHoldings));
  dom.container.ownerDocument.defaultView!.localStorage.setItem(
    PARTNER_JOURNAL_ENTRIES_KEY,
    JSON.stringify(initialJournalEntries),
  );

  act(() => {
    root.render(
      React.createElement(
        MemoryRouter,
        { initialEntries: [PORTFOLIO_ROUTE] },
        React.createElement(PortfolioScreen),
      ),
    );
  });

  return {
    container: dom.container,
    storage: dom.container.ownerDocument.defaultView!.localStorage,
    text() {
      return dom.container.textContent ?? "";
    },
    selectConviction(value: string) {
      const select = dom.container.querySelector("select");

      assert.ok(select, "Expected conviction select to exist");

      act(() => {
        select.value = value;
        select.dispatchEvent(new dom.container.ownerDocument.defaultView!.Event("change", { bubbles: true }));
      });
    },
    updateNote(value: string) {
      const textarea = dom.container.querySelector("textarea");

      assert.ok(textarea, "Expected ownership note textarea to exist");

      act(() => {
        const valueSetter = Object.getOwnPropertyDescriptor(dom.container.ownerDocument.defaultView!.HTMLTextAreaElement.prototype, "value")?.set;
        valueSetter?.call(textarea, value);
        textarea.dispatchEvent(new dom.container.ownerDocument.defaultView!.Event("input", { bubbles: true }));
        textarea.dispatchEvent(new dom.container.ownerDocument.defaultView!.Event("change", { bubbles: true }));
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      dom.cleanup();
    },
  };
}

function mockViewModel(ticker: string): PartnerCompanyViewModel {
  const company = findCompanyByTicker(ticker);
  assert.ok(company, `Expected mock company ${ticker} to exist`);

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

describe("partner web foundation", () => {
  it("defines placeholder routes for the foundation screens", () => {
    const paths = routes.map((route) => "path" in route ? route.path : "index");

    assert.deepEqual(paths, [
      "index",
      EXPLORE_ROUTE.slice(1),
      PORTFOLIO_ROUTE.slice(1),
      LEARN_ROUTE.slice(1),
      PROFILE_ROUTE.slice(1),
      "company/:ticker",
    ]);
  });

  it("renders bottom navigation links", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(BottomNav)),
    );

    for (const label of ["Home", "Explore", "Portfolio", "Learn", "Profile"]) {
      assert.ok(markup.includes(label), `Expected BottomNav to include ${label}`);
    }

    for (const href of [HOME_ROUTE, EXPLORE_ROUTE, PORTFOLIO_ROUTE, LEARN_ROUTE, PROFILE_ROUTE]) {
      assert.ok(markup.includes(`href="${href}"`), `Expected BottomNav to include ${href}`);
    }
  });

  it("fetches PartnerCompanyIntelligence through the API client", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async (input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : String(input);

      assert.equal(url, "http://127.0.0.1:4310/partner-intelligence/MSFT?filingDate=2026-04-29");

      return new Response(JSON.stringify({
        ticker: "MSFT",
        companyName: "Microsoft",
        asOfFilingDate: "2026-04-29",
        profile: {},
        summary: {},
        story: {},
        customers: [],
        money: {},
        trust: {},
        forensics: [],
        fiveQuestions: testFiveQuestions(),
        sources: [],
      }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    };

    try {
      const company = await getPartnerCompany("msft", "2026-04-29");
      assert.equal(company.ticker, "MSFT");
      assert.equal(company.companyName, "Microsoft");
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

describe("partner web home experience", () => {
  it("renders mock partner holdings", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(HomeScreen)),
    );

    assert.ok(markup.includes("Your Partner Portfolio"));

    for (const company of homeHoldings) {
      assert.ok(markup.includes(company.name), `Expected Home to include ${company.name}`);
      assert.ok(markup.includes(company.partnerSummary), `Expected Home to include summary for ${company.name}`);
    }
  });

  it("links holding cards to company routes", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(HomeScreen)),
    );

    for (const company of homeHoldings) {
      assert.ok(
        markup.includes(`href="/company/${company.ticker}"`),
        `Expected ${company.name} card to link to /company/${company.ticker}`,
      );
    }
  });
});

describe("partner web explore experience", () => {
  it("filters companies by search term", () => {
    const results = filterCompanies(mockCompanies, "visa", null);

    assert.equal(results.length, 1);
    assert.equal(results[0]?.ticker, "V");
  });

  it("searches Five Questions answers", () => {
    const results = filterCompanies(mockCompanies, "AI-related infrastructure adoption", null);

    assert.equal(results.length, 1);
    assert.equal(results[0]?.ticker, "MSFT");
  });

  it("filters companies by category", () => {
    const results = filterCompanies(mockCompanies, "", "Cash Machines");

    assert.ok(results.length > 0);
    assert.ok(
      results.every((company) => company.category === "Cash Machines"),
      "Expected every result to match the selected category",
    );
  });

  it("links company list items to company routes", () => {
    const companies = mockCompanies.slice(0, 2).map(mapMockCompanyToDiscoveryCard);
    const markup = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(CompanyList, { companies })),
    );

    for (const company of companies) {
      assert.ok(
        markup.includes(`href="${company.route}"`),
        `Expected ${company.name} list item to link to /company/${company.ticker}`,
      );
    }
  });

  it("renders compact company rows without repeated Five Questions content", () => {
    const company = mapMockCompanyToDiscoveryCard(mockCompanies[0]!);
    const markup = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(CompactCompanyRow, { company })),
    );

    assert.ok(markup.includes(company.name));
    assert.ok(markup.includes(company.category));
    assert.ok(markup.includes(company.tagline));
    assert.ok(markup.includes("Improving"));
    assert.ok(markup.includes("High Conviction"));
    assert.ok(markup.includes(`href="${company.route}"`));
    assert.ok(!markup.includes(company.primaryQuestion));
    assert.ok(!markup.includes(company.primaryAnswer));
  });

  it("builds owner-focused discovery sections", () => {
    const sections = buildDiscoverySections(mockCompanies);

    assert.equal(sections.featured.length, 3);
    assert.ok(sections.featured.every((company) => company.conviction === "High"));
    assert.ok(sections.highConviction.every((company) => company.conviction === "High"));
    assert.ok(sections.watchCarefully.length > 0);
    assert.ok(sections.watchCarefully.every((company) => company.businessHealth === "stable"));
    assert.equal(sections.allCompanies.length, mockCompanies.length);
    assert.equal(sections.allCompanies[0]?.primaryQuestion, "What does this company actually sell?");
    assert.match(sections.allCompanies[0]?.primaryAnswer ?? "", /Microsoft sells software/);
  });
});

describe("partner web company story experience", () => {
  const apiCompanyResponse: PartnerCompanyIntelligence = {
    ticker: "MSFT",
    companyName: "Microsoft API",
    asOfFilingDate: "2026-04-29",
    profile: {
      ticker: "MSFT",
      companyName: "Microsoft API",
      tagline: "API tagline for Microsoft.",
      whatTheyDo: "Runs business software and cloud tools.",
      whoTheyServe: "Businesses and developers.",
    },
    summary: {
      headline: "Microsoft API headline.",
      summary: "API view of Microsoft as a business partner.",
      businessHealth: "improving",
      conviction: "high",
    },
    health: {
      status: "improving",
      explanation: "Cloud and AI strengthened, while margins should be watched closely.",
      strengtheningAreas: [
        {
          title: "Cloud demand",
          explanation: "More customer activity is showing up around cloud services.",
        },
        {
          title: "AI adoption",
          explanation: "AI-related products are becoming more central to the business story.",
        },
      ],
      watchAreas: [
        {
          title: "Margin pressure",
          explanation: "Higher investment costs deserve owner attention.",
        },
      ],
      timeline: [
        {
          label: "Current Filing",
          filingDate: "2026-04-29",
          status: "improving",
        },
        {
          label: "Previous Filing",
          filingDate: "2026-01-28",
          status: "stable",
        },
      ],
    },
    story: {
      whatTheyDo: "API story sells software, cloud services, and developer tools.",
      whoBuys: "API customers include businesses and developers.",
      whyTheyWin: "API story says its tools are embedded in daily work.",
      whatCouldGoWrong: "API story warns about security and competition.",
    },
    customers: [
      {
        customerType: "API enterprise customers",
        whyTheyBuy: "Need dependable tools across many teams.",
      },
    ],
    money: {
      dailySales: {
        label: "Revenue",
        plainLanguageName: "Daily Sales",
        explanation: "API recurring software and cloud sales.",
      },
      whatsLeftAfterCosts: {
        label: "Margin",
        plainLanguageName: "What's Left After Costs",
        explanation: "API software can leave room after costs.",
      },
      loansToExpand: {
        label: "Debt",
        plainLanguageName: "Loans To Expand",
        explanation: "API borrowing remains manageable.",
      },
      moneyInTheDrawer: {
        label: "Cash Flow",
        plainLanguageName: "Money In The Drawer",
        explanation: "API renewals turn into steady cash.",
      },
      overallExplanation: "API cash explanation.",
    },
    trust: {
      managementQuality: "API leadership quality.",
      longTermThinking: "API long-term thinking.",
      capitalAllocation: "API decision style.",
      skinInTheGame: "API skin in the game.",
      confidence: "high",
      dataAvailability: "partial",
    },
    forensics: [
      {
        label: "API profits backed by cash",
        severity: "green",
        explanation: "API cash signal explanation.",
      },
    ],
    fiveQuestions: testFiveQuestions(),
    sources: [],
  };

  it("renders API data for a known ticker", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Response(JSON.stringify(apiCompanyResponse), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    const rendered = renderCompanyRoute("/company/MSFT");

    try {
      await waitForCondition(() => rendered.text().includes("Microsoft API"));

      assert.ok(rendered.text().includes("API tagline for Microsoft."));
      assert.ok(rendered.text().includes("API story sells software"));
      assert.ok(rendered.text().includes("Five Questions"));
      assert.ok(rendered.text().includes("What does this company actually sell?"));
      assert.ok(rendered.text().includes("It sells software and cloud services to businesses."));
      assert.ok(rendered.text().includes("Owner Thesis"));
      assert.ok(rendered.text().includes("Market Data Required"));
      assert.ok(rendered.text().includes(
        "Valuation analysis is unavailable because market-price data is not currently part of the research system.",
      ));
    } finally {
      rendered.unmount();
      globalThis.fetch = previousFetch;
    }
  });

  it("renders a calm loading state", () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Promise<Response>(() => undefined);

    const rendered = renderCompanyRoute("/company/MSFT");

    try {
      assert.ok(rendered.text().includes("Loading company story..."));
    } finally {
      rendered.unmount();
      globalThis.fetch = previousFetch;
    }
  });

  it("falls back to mock data when the API fails and mock data exists", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Response(JSON.stringify({ error: "Filing not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });

    const rendered = renderCompanyRoute("/company/MSFT");

    try {
      await waitForCondition(() => rendered.text().includes("Microsoft"));

      assert.ok(rendered.text().includes("Builds software and cloud infrastructure used by businesses worldwide."));
      assert.ok(rendered.text().includes("Neighborhood Analogy"));
      assert.ok(rendered.text().includes("If Microsoft were a shop in your neighbourhood"));
      assert.ok(rendered.text().includes("Five Questions"));
      assert.ok(rendered.text().includes("The next rupee most likely comes from cloud usage"));
      assert.ok(rendered.text().includes("Market Data Required"));
      assert.ok(rendered.text().includes(
        "Valuation analysis is unavailable because market-price data is not currently part of the research system.",
      ));
    } finally {
      rendered.unmount();
      globalThis.fetch = previousFetch;
    }
  });

  it("does not crash when fiveQuestions is missing", () => {
    const company = {
      ...mapPartnerCompanyToViewModel(apiCompanyResponse),
      fiveQuestions: undefined,
    };
    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(CompanyDetailContent, { company }),
      ),
    );

    assert.ok(markup.includes("Microsoft API"));
    assert.equal(markup.includes("Five Questions"), false);
  });

  it("shows a generic error when the API fails and no mock data exists", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Response(JSON.stringify({ error: "Ticker not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });

    const rendered = renderCompanyRoute("/company/UNKNOWN");

    try {
      await waitForCondition(() => rendered.text().includes("We couldn't load this business right now."));

      assert.ok(rendered.text().includes("Please try again later."));
      assert.ok(rendered.container.innerHTML.includes('href="/explore"'));
    } finally {
      rendered.unmount();
      globalThis.fetch = previousFetch;
    }
  });

  it("renders dashboard sections from an API-backed view model", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Response(JSON.stringify(apiCompanyResponse), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    const rendered = renderCompanyRoute("/company/MSFT");

    try {
      await waitForCondition(() => rendered.text().includes("Microsoft API"));

      assert.ok(rendered.text().includes("BUSINESS"));
      assert.ok(rendered.text().includes("API enterprise customers"));
      assert.ok(rendered.text().includes("Need dependable tools across many teams."));
      assert.ok(rendered.text().includes("ECONOMICS"));
      assert.ok(rendered.text().includes("Daily Sales"));
      assert.ok(rendered.text().includes("QUALITY"));
      assert.ok(rendered.text().includes("Decision Style"));
    } finally {
      rendered.unmount();
      globalThis.fetch = previousFetch;
    }
  });

  it("renders the business health dashboard from API-backed data", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Response(JSON.stringify(apiCompanyResponse), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    const rendered = renderCompanyRoute("/company/MSFT");

    try {
      await waitForCondition(() => rendered.text().includes("Microsoft API"));

      assert.ok(rendered.text().includes("Business Health"));
      assert.ok(rendered.text().includes("Health: Improving"));
      assert.ok(rendered.text().includes("Getting Stronger"));
      assert.ok(rendered.text().includes("Cloud demand"));
      assert.ok(rendered.text().includes("More customer activity"));
      assert.ok(rendered.text().includes("Watch Closely"));
      assert.ok(rendered.text().includes("Margin pressure"));
      assert.ok(rendered.text().includes("Higher investment costs"));
      assert.ok(rendered.text().includes("Business Direction Over Time"));
      assert.ok(rendered.text().includes("Previous Filing"));

      assert.ok(
        rendered.text().indexOf("Business Health") < rendered.text().indexOf("BUSINESS"),
        "Expected Business Health to render before the BUSINESS group",
      );
    } finally {
      rendered.unmount();
      globalThis.fetch = previousFetch;
    }
  });

  it("does not render promoted business health when health data is unavailable", () => {
    const company = {
      ...mockViewModel("MSFT"),
      health: {
        status: "",
        explanation: "",
        strengtheningAreas: [],
        watchAreas: [],
        timeline: [],
      },
    };

    const markup = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(CompanyDetailContent, { company })),
    );

    assert.equal(markup.includes("Business Health"), false);
    assert.equal(markup.includes("Business health is not available yet."), false);
    assert.ok(markup.includes("BUSINESS"));
  });

  it("handles unknown ticker behavior without raw errors", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => {
      throw new Error("network unavailable");
    };

    const rendered = renderCompanyRoute("/company/UNKNOWN");

    try {
      await waitForCondition(() => rendered.text().includes("We couldn't load this business right now."));

      assert.equal(rendered.text().includes("network unavailable"), false);
    } finally {
      rendered.unmount();
      globalThis.fetch = previousFetch;
    }
  });

  it("renders back navigation to Explore", () => {
    const company = mockViewModel("MSFT");

    const markup = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(CompanyDetailContent, { company })),
    );

    assert.ok(markup.includes("Back to Explore"));
    assert.ok(markup.includes('href="/explore"'));
  });

  it("renders the business group by default", () => {
    const company = mockViewModel("MSFT");

    const markup = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(CompanyDetailContent, { company })),
    );

    assert.ok(markup.includes("BUSINESS"));
    assert.ok(markup.includes("Neighborhood Analogy"));
    assert.ok(markup.includes("If Microsoft were a shop in your neighbourhood"));
    assert.ok(markup.includes("What They Sell"));
  });

  it("renders economics content in the stacked dashboard", () => {
    const company = mockViewModel("MSFT");

    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(CompanyDetailContent, { company }),
      ),
    );

    assert.ok(markup.includes("ECONOMICS"));
    assert.ok(markup.includes("Daily Sales"));
    assert.ok(markup.includes("Money In The Drawer"));
  });

  it("renders customers, trust, and forensics in the stacked dashboard", () => {
    const company = mockViewModel("MSFT");

    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(CompanyDetailContent, { company }),
      ),
    );

    assert.ok(markup.includes("Large companies"));
    assert.ok(markup.includes("Developers"));
    assert.ok(markup.includes("QUALITY"));
    assert.ok(markup.includes("Would I trust these people"));
    assert.ok(markup.includes("Decision Style"));
    assert.ok(markup.includes("Profits backed by cash"));
    assert.ok(markup.includes("Security trust"));
  });

  it("adds API-backed companies to the local portfolio and prevents duplicates", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Response(JSON.stringify(apiCompanyResponse), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    const rendered = renderCompanyRoute("/company/MSFT");

    try {
      await waitForCondition(() => rendered.text().includes("Microsoft API"));
      rendered.clickButton("Add To Portfolio");
      rendered.clickButton("Added To Portfolio");

      const holdings = JSON.parse(window.localStorage.getItem(PORTFOLIO_HOLDINGS_KEY) ?? "[]") as PortfolioHolding[];

      assert.equal(holdings.length, 1);
      assert.equal(holdings[0]?.ticker, "MSFT");
      assert.equal(holdings[0]?.companyName, "Microsoft API");
      assert.equal(holdings[0]?.conviction, "medium");
      assert.equal(holdings[0]?.businessHealth, "improving");
    } finally {
      rendered.unmount();
      globalThis.fetch = previousFetch;
    }
  });

  it("updates last reviewed timestamp when opened from portfolio", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Response(JSON.stringify(apiCompanyResponse), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    const rendered = renderCompanyRoute("/company/MSFT?fromPortfolio=1", [{
      ticker: "MSFT",
      companyName: "Microsoft",
      addedAt: "2026-06-01T00:00:00.000Z",
      conviction: "medium",
    }]);

    try {
      await waitForCondition(() => {
        const holdings = JSON.parse(window.localStorage.getItem(PORTFOLIO_HOLDINGS_KEY) ?? "[]") as PortfolioHolding[];

        return Boolean(holdings[0]?.lastReviewedAt);
      });

      const holdings = JSON.parse(window.localStorage.getItem(PORTFOLIO_HOLDINGS_KEY) ?? "[]") as PortfolioHolding[];

      assert.equal(holdings[0]?.ticker, "MSFT");
      assert.ok(holdings[0]?.lastReviewedAt);
    } finally {
      rendered.unmount();
      globalThis.fetch = previousFetch;
    }
  });

  it("collapses the partner journal by default", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Response(JSON.stringify(apiCompanyResponse), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    const rendered = renderCompanyRoute("/company/MSFT");

    try {
      await waitForCondition(() => rendered.text().includes("Partner Journal"));

      assert.ok(rendered.text().includes("Capture how your understanding of this business evolves over time."));
      assert.ok(rendered.text().includes("Add Notes ▼"));
      assert.equal(rendered.text().includes("My Understanding"), false);
      assert.equal(rendered.text().includes("Save Journal Entry"), false);
    } finally {
      rendered.unmount();
      globalThis.fetch = previousFetch;
    }
  });

  it("expands the partner journal inline", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Response(JSON.stringify(apiCompanyResponse), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    const rendered = renderCompanyRoute("/company/MSFT");

    try {
      await waitForCondition(() => rendered.text().includes("Partner Journal"));
      rendered.clickButton("Add Notes ▼");

      assert.ok(rendered.text().includes("Hide Notes ▲"));
      assert.ok(rendered.text().includes("My Understanding"));
      assert.ok(rendered.text().includes("Why I Have Conviction"));
      assert.ok(rendered.text().includes("Concerns"));
      assert.ok(rendered.text().includes("What I Want To Learn Next"));
      assert.ok(rendered.text().includes("Save Journal Entry"));
    } finally {
      rendered.unmount();
      globalThis.fetch = previousFetch;
    }
  });

  it("creates journal entries from the company page and shows most recent history first", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Response(JSON.stringify(apiCompanyResponse), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    const oldEntry = createJournalEntry("MSFT", {
      understanding: "Older understanding.",
      convictionReason: "Older conviction.",
      concerns: "Older concern.",
      nextQuestion: "Older question.",
    }, "2026-06-01T00:00:00.000Z");
    const rendered = renderCompanyRoute("/company/MSFT", [], [oldEntry]);

    try {
      await waitForCondition(() => rendered.text().includes("Partner Journal"));
      rendered.clickButton("Add Notes ▼");

      rendered.fillJournalField("My Understanding", "Microsoft makes money primarily through software subscriptions and cloud infrastructure.");
      rendered.fillJournalField("Why I Have Conviction", "Strong ecosystem and enterprise adoption.");
      rendered.fillJournalField("Concerns", "Cloud competition.");
      rendered.fillJournalField("What I Want To Learn Next", "How dependent is Azure growth on AI demand?");
      rendered.clickButton("Save Journal Entry");

      await waitForCondition(() => {
        const entries = JSON.parse(window.localStorage.getItem(PARTNER_JOURNAL_ENTRIES_KEY) ?? "[]") as PartnerJournalEntry[];
        return entries.length === 2;
      });

      const entries = JSON.parse(window.localStorage.getItem(PARTNER_JOURNAL_ENTRIES_KEY) ?? "[]") as PartnerJournalEntry[];

      assert.equal(entries[0]?.ticker, "MSFT");
      assert.equal(entries[0]?.understanding, "Microsoft makes money primarily through software subscriptions and cloud infrastructure.");
      assert.ok(rendered.text().includes("Cloud competition."));
      assert.ok(rendered.text().indexOf("Microsoft makes money primarily") < rendered.text().indexOf("Older understanding."));
    } finally {
      rendered.unmount();
      globalThis.fetch = previousFetch;
    }
  });
});

describe("partner journal local state", () => {
  it("creates entries, filters by company, and orders history newest first", () => {
    const older = createJournalEntry("MSFT", {
      understanding: "Older Microsoft thought.",
      convictionReason: "",
      concerns: "",
      nextQuestion: "",
    }, "2026-06-01T00:00:00.000Z");
    const newer = createJournalEntry("MSFT", {
      understanding: "Newer Microsoft thought.",
      convictionReason: "",
      concerns: "",
      nextQuestion: "",
    }, "2026-06-07T00:00:00.000Z");
    const apple = createJournalEntry("AAPL", {
      understanding: "Apple thought.",
      convictionReason: "",
      concerns: "",
      nextQuestion: "",
    }, "2026-06-08T00:00:00.000Z");
    const entries = addJournalEntry(addJournalEntry([older], apple), newer);
    const microsoftEntries = getJournalEntriesForTicker(entries, "msft");
    const counts = countJournalEntriesByTicker(entries);

    assert.equal(microsoftEntries.length, 2);
    assert.equal(microsoftEntries[0]?.understanding, "Newer Microsoft thought.");
    assert.equal(counts.MSFT, 2);
    assert.equal(counts.AAPL, 1);
  });
});

describe("partner web portfolio experience", () => {
  const baseHolding: PortfolioHolding = {
    ticker: "MSFT",
    companyName: "Microsoft",
    addedAt: "2026-06-01T00:00:00.000Z",
    conviction: "medium",
  };

  it("prevents duplicate portfolio additions", () => {
    const holdings = addPortfolioHolding([baseHolding], {
      ticker: "msft",
      companyName: "Microsoft",
      addedAt: "2026-06-02T00:00:00.000Z",
      conviction: "medium",
    });

    assert.equal(holdings.length, 1);
    assert.equal(holdings[0]?.addedAt, baseHolding.addedAt);
  });

  it("updates conviction, ownership notes, reviewed timestamp, and summary counts", () => {
    const reviewed = updatePortfolioReviewTimestamp([baseHolding], "MSFT", "2026-06-06T00:00:00.000Z");
    const withConviction = updatePortfolioConviction(reviewed, "MSFT", "high");
    const withNote = updatePortfolioNote(withConviction, "MSFT", "Strong cloud business. Want to understand Azure better.");
    const summary = buildPortfolioSummary(withNote);

    assert.equal(withNote[0]?.conviction, "high");
    assert.equal(withNote[0]?.ownershipNote, "Strong cloud business. Want to understand Azure better.");
    assert.equal(withNote[0]?.lastReviewedAt, "2026-06-06T00:00:00.000Z");
    assert.equal(summary.businesses, 1);
    assert.equal(summary.highConviction, 1);
  });

  it("builds portfolio health summary counts", () => {
    const summary = buildPortfolioHealthSummary([
      { ...baseHolding, ticker: "MSFT", businessHealth: "improving" },
      { ...baseHolding, ticker: "AAPL", companyName: "Apple", businessHealth: "stable" },
      { ...baseHolding, ticker: "AMZN", companyName: "Amazon", businessHealth: "needs_attention" },
    ]);

    assert.equal(summary.improving, 1);
    assert.equal(summary.stable, 1);
    assert.equal(summary.needsAttention, 1);
  });

  it("renders the empty portfolio state with an Explore action", () => {
    const rendered = renderPortfolioRoute();

    try {
      assert.ok(rendered.text().includes("You have not added any businesses yet."));
      assert.ok(rendered.text().includes("Explore companies and add businesses"));
      assert.ok(rendered.container.innerHTML.includes('href="/explore"'));
    } finally {
      rendered.unmount();
    }
  });

  it("renders holdings, summary counts, conviction controls, notes, journal counts, and review links", () => {
    const journalEntry = createJournalEntry("MSFT", {
      understanding: "Microsoft journal thought.",
      convictionReason: "",
      concerns: "",
      nextQuestion: "",
    }, "2026-06-07T00:00:00.000Z");
    const rendered = renderPortfolioRoute([{
      ...baseHolding,
      conviction: "high",
      ownershipNote: "Strong cloud business.",
      lastReviewedAt: new Date().toISOString(),
    }], [journalEntry]);

    try {
      assert.ok(rendered.text().includes("Partner Portfolio"));
      assert.ok(rendered.text().includes("Businesses"));
      assert.ok(rendered.text().includes("High Conviction"));
      assert.ok(rendered.text().includes("Recently Reviewed"));
      assert.ok(rendered.text().includes("Journal Entries"));
      assert.ok(rendered.text().includes("Improving Businesses"));
      assert.ok(rendered.text().includes("Stable Businesses"));
      assert.ok(rendered.text().includes("Needs Attention"));
      assert.ok(rendered.text().includes("Microsoft"));
      assert.ok(rendered.text().includes("Health: Improving"));
      assert.ok(rendered.text().includes("Conviction: high"));
      assert.ok(rendered.text().includes("Journal Entries: 1"));
      assert.ok(rendered.text().includes("Reviewed today"));
      assert.ok(rendered.container.innerHTML.includes('href="/company/MSFT?fromPortfolio=1"'));
    } finally {
      rendered.unmount();
    }
  });

  it("persists conviction and ownership note edits from the Portfolio screen", () => {
    const rendered = renderPortfolioRoute([baseHolding]);

    try {
      rendered.selectConviction("high");
      rendered.updateNote("Strong cloud business. Want to understand Azure better.");

      const holdings = JSON.parse(rendered.storage.getItem(PORTFOLIO_HOLDINGS_KEY) ?? "[]") as PortfolioHolding[];

      assert.equal(holdings[0]?.conviction, "high");
      assert.equal(holdings[0]?.ownershipNote, "Strong cloud business. Want to understand Azure better.");
    } finally {
      rendered.unmount();
    }
  });
});

describe("partner intelligence feature api", () => {
  const validPartnerResponse = {
    ticker: "MSFT",
    companyName: "Microsoft",
    asOfFilingDate: "2026-04-29",
    profile: {},
    summary: {},
    story: {},
    customers: [],
    money: {},
    trust: {},
    forensics: [],
    fiveQuestions: testFiveQuestions(),
    sources: [],
  };

  it("fetches Partner Intelligence successfully", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async (input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : String(input);
      assert.equal(url, "http://127.0.0.1:4310/partner-intelligence/MSFT");

      return new Response(JSON.stringify(validPartnerResponse), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    try {
      const result = await getPartnerIntelligence("msft");

      assert.equal(result.ticker, "MSFT");
      assert.equal(result.companyName, "Microsoft");
    } finally {
      globalThis.fetch = previousFetch;
    }
  });

  it("adds filingDate as a query parameter", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async (input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : String(input);
      assert.equal(url, "http://127.0.0.1:4310/partner-intelligence/MSFT?filingDate=2026-04-29");

      return new Response(JSON.stringify(validPartnerResponse), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    try {
      await getPartnerIntelligence("MSFT", "2026-04-29");
    } finally {
      globalThis.fetch = previousFetch;
    }
  });

  it("normalizes invalid responses", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Response(JSON.stringify({ ticker: "MSFT" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    try {
      await assert.rejects(
        () => getPartnerIntelligence("MSFT"),
        { message: "Partner Intelligence response was invalid." },
      );
    } finally {
      globalThis.fetch = previousFetch;
    }
  });

  it("normalizes HTTP errors", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Response(JSON.stringify({ error: "Filing not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });

    try {
      await assert.rejects(
        () => getPartnerIntelligence("MSFT", "2026-01-01"),
        { message: "Filing not found", status: 404 },
      );
    } finally {
      globalThis.fetch = previousFetch;
    }
  });

  it("normalizes network failures", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => {
      throw new Error("network unavailable");
    };

    try {
      await assert.rejects(
        () => getPartnerIntelligence("MSFT"),
        { message: "network unavailable" },
      );
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

describe("partner company adapter", () => {
  const partnerIntelligence: PartnerCompanyIntelligence = {
    ticker: "MSFT",
    companyName: "Microsoft",
    asOfFilingDate: "2026-04-29",
    profile: {
      ticker: "MSFT",
      companyName: "Microsoft",
      tagline: "Builds software and cloud infrastructure.",
      whatTheyDo: "Runs business software and cloud tools.",
      whoTheyServe: "Businesses and developers.",
    },
    summary: {
      headline: "Microsoft continues building durable cloud demand.",
      summary: "The company remains focused on cloud and AI infrastructure.",
      businessHealth: "improving",
      conviction: "high",
    },
    health: {
      status: "improving",
      explanation: "Cloud and AI strengthened, while margins should be watched closely.",
      strengtheningAreas: [
        {
          title: "Cloud demand",
          explanation: "More customer activity is showing up around cloud services.",
        },
        {
          title: "AI adoption",
          explanation: "AI-related products are becoming more central to the business story.",
        },
      ],
      watchAreas: [
        {
          title: "Margin pressure",
          explanation: "Higher investment costs deserve owner attention.",
        },
      ],
      timeline: [
        {
          label: "Current Filing",
          filingDate: "2026-04-29",
          status: "improving",
        },
      ],
    },
    story: {
      whatTheyDo: "Sells software, cloud services, and developer tools.",
      whoBuys: "Businesses, developers, schools, and governments.",
      whyTheyWin: "Its tools are deeply embedded in daily work.",
      whatCouldGoWrong: "Security incidents or cloud competition could weaken trust.",
    },
    customers: [
      {
        customerType: "Large companies",
        whyTheyBuy: "Need reliable tools across many teams.",
      },
    ],
    money: {
      dailySales: {
        label: "Revenue",
        plainLanguageName: "Daily Sales",
        explanation: "Recurring software and cloud sales.",
      },
      whatsLeftAfterCosts: {
        label: "Margin",
        plainLanguageName: "What's Left After Costs",
        explanation: "Software can leave meaningful room after costs.",
      },
      loansToExpand: {
        label: "Debt",
        plainLanguageName: "Loans To Expand",
        explanation: "Borrowing is modest compared with business size.",
      },
      moneyInTheDrawer: {
        label: "Cash Flow",
        plainLanguageName: "Money In The Drawer",
        explanation: "Renewals turn into steady cash.",
      },
      overallExplanation: "A cash-generative business.",
    },
    trust: {
      managementQuality: "Experienced leadership with a platform mindset.",
      longTermThinking: "Invests for long-term cloud and AI demand.",
      capitalAllocation: "Balances investment with shareholder returns.",
      skinInTheGame: "Leadership incentives are tied to company performance.",
      confidence: "high",
      dataAvailability: "partial",
    },
    forensics: [
      {
        label: "Profits backed by cash",
        severity: "green",
        explanation: "The business regularly turns sales into cash.",
      },
    ],
    fiveQuestions: testFiveQuestions(),
    sources: [],
  };

  it("maps the happy path PartnerCompanyIntelligence contract", () => {
    const viewModel = mapPartnerCompanyToViewModel(partnerIntelligence);

    assert.equal(viewModel.name, "Microsoft");
    assert.equal(viewModel.ticker, "MSFT");
    assert.equal(viewModel.tagline, "Builds software and cloud infrastructure.");
    assert.equal(viewModel.businessHealth, "improving");
    assert.equal(viewModel.conviction, "high");
    assert.equal(viewModel.health?.status, "improving");
    assert.deepEqual(viewModel.health?.strengtheningAreas.map((area) => area.title), ["Cloud demand", "AI adoption"]);
    assert.deepEqual(viewModel.health?.watchAreas.map((area) => area.title), ["Margin pressure"]);
    assert.equal(viewModel.health?.timeline[0]?.label, "Current Filing");
    assert.equal(viewModel.story.whatTheySell, "Sells software, cloud services, and developer tools.");
    assert.equal(viewModel.customers[0]?.segment, "Large companies");
    assert.equal(viewModel.money.dailySales, "Recurring software and cloud sales.");
    assert.equal(viewModel.money.margin, "Software can leave meaningful room after costs.");
    assert.equal(viewModel.trust.decisionStyle, "Balances investment with shareholder returns.");
    assert.equal(viewModel.forensics[0]?.title, "Profits backed by cash");
    assert.equal(viewModel.forensics[0]?.status, "green");
  });

  it("preserves empty arrays for empty API sections", () => {
    const viewModel = mapPartnerCompanyToViewModel({
      ...partnerIntelligence,
      customers: [],
      forensics: [],
    });

    assert.deepEqual(viewModel.customers, []);
    assert.deepEqual(viewModel.forensics, []);
  });

  it("uses safe defaults for partial responses", () => {
    const partialResponse = {
      ticker: "MSFT",
      companyName: "Microsoft",
      profile: {},
      story: {},
      money: {},
      trust: {},
    } as PartnerCompanyIntelligence;

    const viewModel = mapPartnerCompanyToViewModel(partialResponse);

    assert.equal(viewModel.name, "Microsoft");
    assert.equal(viewModel.ticker, "MSFT");
    assert.equal(viewModel.tagline, "");
    assert.equal(viewModel.story.whatTheySell, "");
    assert.deepEqual(viewModel.customers, []);
    assert.equal(viewModel.money.cashflow, "");
    assert.equal(viewModel.trust.skinInTheGame, "");
    assert.deepEqual(viewModel.forensics, []);
  });
});

describe("usePartnerIntelligence", () => {
  const validPartnerResponse: PartnerCompanyIntelligence = {
    ticker: "MSFT",
    companyName: "Microsoft",
    asOfFilingDate: "2026-04-29",
    profile: {
      ticker: "MSFT",
      companyName: "Microsoft",
      tagline: "Builds software and cloud infrastructure.",
      whatTheyDo: "Runs business software and cloud tools.",
      whoTheyServe: "Businesses and developers.",
    },
    summary: {
      headline: "Microsoft continues building durable cloud demand.",
      summary: "The company remains focused on cloud and AI infrastructure.",
      businessHealth: "improving",
      conviction: "high",
    },
    story: {
      whatTheyDo: "Sells software, cloud services, and developer tools.",
      whoBuys: "Businesses, developers, schools, and governments.",
      whyTheyWin: "Its tools are deeply embedded in daily work.",
      whatCouldGoWrong: "Security incidents or cloud competition could weaken trust.",
    },
    customers: [
      {
        customerType: "Large companies",
        whyTheyBuy: "Need reliable tools across many teams.",
      },
    ],
    money: {
      dailySales: {
        label: "Revenue",
        plainLanguageName: "Daily Sales",
        explanation: "Recurring software and cloud sales.",
      },
      whatsLeftAfterCosts: {
        label: "Margin",
        plainLanguageName: "What's Left After Costs",
        explanation: "Software can leave meaningful room after costs.",
      },
      loansToExpand: {
        label: "Debt",
        plainLanguageName: "Loans To Expand",
        explanation: "Borrowing is modest compared with business size.",
      },
      moneyInTheDrawer: {
        label: "Cash Flow",
        plainLanguageName: "Money In The Drawer",
        explanation: "Renewals turn into steady cash.",
      },
      overallExplanation: "A cash-generative business.",
    },
    trust: {
      managementQuality: "Experienced leadership with a platform mindset.",
      longTermThinking: "Invests for long-term cloud and AI demand.",
      capitalAllocation: "Balances investment with shareholder returns.",
      skinInTheGame: "Leadership incentives are tied to company performance.",
      confidence: "high",
      dataAvailability: "partial",
    },
    forensics: [
      {
        label: "Profits backed by cash",
        severity: "green",
        explanation: "The business regularly turns sales into cash.",
      },
    ],
    fiveQuestions: testFiveQuestions(),
    sources: [],
  };

  it("exposes loading state on initial render", () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Promise<Response>(() => undefined);

    const rendered = renderPartnerIntelligenceHook("MSFT");

    try {
      assert.equal(rendered.latest()?.loading, true);
      assert.equal(rendered.latest()?.data, null);
      assert.equal(rendered.latest()?.error, null);
    } finally {
      rendered.unmount();
      globalThis.fetch = previousFetch;
    }
  });

  it("fetches successfully and applies the adapter mapping", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Response(JSON.stringify(validPartnerResponse), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    const rendered = renderPartnerIntelligenceHook("msft");

    try {
      await waitForCondition(() => rendered.latest()?.loading === false);

      assert.equal(rendered.latest()?.error, null);
      assert.equal(rendered.latest()?.data?.name, "Microsoft");
      assert.equal(rendered.latest()?.data?.story.whatTheySell, "Sells software, cloud services, and developer tools.");
      assert.equal(rendered.latest()?.data?.money.dailySales, "Recurring software and cloud sales.");
    } finally {
      rendered.unmount();
      globalThis.fetch = previousFetch;
    }
  });

  it("updates state after success", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Response(JSON.stringify(validPartnerResponse), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    const rendered = renderPartnerIntelligenceHook("MSFT", "2026-04-29");

    try {
      await waitForCondition(() => rendered.latest()?.data !== null);

      assert.equal(rendered.latest()?.loading, false);
      assert.equal(rendered.latest()?.error, null);
      assert.equal(rendered.latest()?.data?.ticker, "MSFT");
    } finally {
      rendered.unmount();
      globalThis.fetch = previousFetch;
    }
  });

  it("sets error state on failure", async () => {
    const previousFetch = globalThis.fetch;

    globalThis.fetch = async () => new Response(JSON.stringify({ error: "Filing not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });

    const rendered = renderPartnerIntelligenceHook("MSFT");

    try {
      await waitForCondition(() => rendered.latest()?.loading === false);

      assert.equal(rendered.latest()?.data, null);
      assert.equal(rendered.latest()?.error?.message, "Filing not found");
      assert.equal(rendered.latest()?.error?.status, 404);
    } finally {
      rendered.unmount();
      globalThis.fetch = previousFetch;
    }
  });

  it("aborts the request on unmount", async () => {
    const previousFetch = globalThis.fetch;
    let capturedSignal: AbortSignal | undefined;

    globalThis.fetch = async (_input: string | URL | Request, init?: RequestInit) => {
      capturedSignal = init?.signal ?? undefined;

      return new Promise<Response>((_resolve, reject) => {
        capturedSignal?.addEventListener("abort", () => {
          reject(new Error("aborted"));
        });
      });
    };

    const rendered = renderPartnerIntelligenceHook("MSFT");

    try {
      assert.equal(rendered.latest()?.loading, true);
      rendered.unmount();

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      assert.equal(capturedSignal?.aborted, true);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

function testFiveQuestions() {
  return {
    business: {
      question: "What does this company actually sell?",
      answer: "It sells software and cloud services to businesses.",
      confidence: "high" as const,
      evidence: ["business_description", "products", "customers"],
      status: "answered" as const,
    },
    growth: {
      question: "Where does the next rupee come from?",
      answer: "Growth comes from cloud usage and software subscriptions.",
      confidence: "medium" as const,
      evidence: ["revenue_drivers", "strategic_priorities"],
      status: "answered" as const,
    },
    trust: {
      question: "Can the story be trusted?",
      answer: "The story depends on execution and risk signals.",
      confidence: "medium" as const,
      evidence: ["risks", "forensics", "business_health"],
      status: "answered" as const,
    },
    valuation: {
      question: "Is the story already too expensive?",
      answer: "Valuation analysis requires market-price data which is not currently available.",
      confidence: "low" as const,
      evidence: [],
      status: "insufficient_data" as const,
    },
    holdThesis: {
      question: "Why would I hold it and what would change that?",
      answer: "An owner might hold while the business remains healthy and would revisit if risks weaken conviction.",
      confidence: "medium" as const,
      evidence: ["business_health", "growth_question", "trust_question"],
      status: "answered" as const,
    },
  };
}
