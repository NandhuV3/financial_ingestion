import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
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
