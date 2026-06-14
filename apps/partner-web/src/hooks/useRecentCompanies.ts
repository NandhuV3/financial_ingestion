import { RECENT_COMPANIES_KEY } from "../constants/local-storage";
import { useLocalStorageState } from "./useLocalStorageState";

export function useRecentCompanies() {
  return useLocalStorageState<string[]>(RECENT_COMPANIES_KEY, []);
}
