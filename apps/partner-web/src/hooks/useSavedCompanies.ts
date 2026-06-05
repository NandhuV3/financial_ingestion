import { SAVED_COMPANIES_KEY } from "../constants/local-storage";
import { useLocalStorageState } from "./useLocalStorageState";

export function useSavedCompanies() {
  return useLocalStorageState<string[]>(SAVED_COMPANIES_KEY, []);
}
