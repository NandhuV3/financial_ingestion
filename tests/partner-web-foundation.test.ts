import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
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
import {
  findCompanyByTicker,
  filterCompanies,
  homeHoldings,
  mockCompanies,
} from "../apps/partner-web/src/features/company/mock/companies.ts";
import {
  CompanyDetailContent,
  CompanyDetailScreen,
} from "../apps/partner-web/src/features/company/CompanyDetailScreen.tsx";
import { getPartnerIntelligence } from "../apps/partner-web/src/features/company/api/partner-intelligence.api.ts";

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

  it("filters companies by category", () => {
    const results = filterCompanies(mockCompanies, "", "Cash Machines");

    assert.ok(results.length > 0);
    assert.ok(
      results.every((company) => company.category === "Cash Machines"),
      "Expected every result to match the selected category",
    );
  });

  it("links company list items to company routes", () => {
    const companies = mockCompanies.slice(0, 2);
    const markup = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(CompanyList, { companies })),
    );

    for (const company of companies) {
      assert.ok(
        markup.includes(`href="/company/${company.ticker}"`),
        `Expected ${company.name} list item to link to /company/${company.ticker}`,
      );
    }
  });
});

describe("partner web company story experience", () => {
  it("loads a company by ticker", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/company/MSFT"] },
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

    assert.ok(markup.includes("Microsoft"));
    assert.ok(markup.includes("Builds software and cloud infrastructure"));
  });

  it("handles an unknown ticker gracefully", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/company/UNKNOWN"] },
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

    assert.ok(markup.includes("Company not found"));
    assert.ok(markup.includes("UNKNOWN"));
  });

  it("renders back navigation to Explore", () => {
    const company = findCompanyByTicker("MSFT");
    assert.ok(company);

    const markup = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(CompanyDetailContent, { company })),
    );

    assert.ok(markup.includes("Back to Explore"));
    assert.ok(markup.includes('href="/explore"'));
  });

  it("shows the Story tab by default", () => {
    const company = findCompanyByTicker("MSFT");
    assert.ok(company);

    const markup = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(CompanyDetailContent, { company })),
    );

    assert.ok(markup.includes("If this were a shop in your neighbourhood"));
    assert.ok(markup.includes("What they sell"));
    assert.ok(markup.includes('aria-selected="true"'));
  });

  it("renders selected tab content", () => {
    const company = findCompanyByTicker("MSFT");
    assert.ok(company);

    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(CompanyDetailContent, { company, initialTab: "money" }),
      ),
    );

    assert.ok(markup.includes("Daily Sales"));
    assert.ok(markup.includes("Money In The Drawer"));
  });

  it("renders customers, trust, and forensics sections", () => {
    const company = findCompanyByTicker("MSFT");
    assert.ok(company);

    const customers = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(CompanyDetailContent, { company, initialTab: "customers" }),
      ),
    );
    const trust = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(CompanyDetailContent, { company, initialTab: "trust" }),
      ),
    );
    const forensics = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(CompanyDetailContent, { company, initialTab: "forensics" }),
      ),
    );

    assert.ok(customers.includes("Large companies"));
    assert.ok(customers.includes("Developers"));
    assert.ok(trust.includes("Would I trust these people"));
    assert.ok(trust.includes("Decision Style"));
    assert.ok(forensics.includes("Profits backed by cash"));
    assert.ok(forensics.includes("Security trust"));
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
