export const HOME_ROUTE = "/";
export const EXPLORE_ROUTE = "/explore";
export const PORTFOLIO_ROUTE = "/portfolio";
export const LEARN_ROUTE = "/learn";
export const PROFILE_ROUTE = "/profile";
export const COMPANY_ROUTE = "/company/:ticker";

export function companyRoute(ticker: string): string {
  return `/company/${ticker.trim().toUpperCase()}`;
}
