import { PARTNER_JOURNAL_KEY } from "../constants/local-storage";
import { useLocalStorageState } from "./useLocalStorageState";

export function usePartnerJournal() {
  return useLocalStorageState<Record<string, string>>(PARTNER_JOURNAL_KEY, {});
}
