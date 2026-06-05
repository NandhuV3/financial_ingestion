import { USER_PREFERENCES_KEY } from "../constants/local-storage";
import { useLocalStorageState } from "./useLocalStorageState";

export type UserPreferences = {
  learningLevel: "beginner" | "comfortable";
  colorTheme: "system" | "light" | "dark";
};

export function useUserPreferences() {
  return useLocalStorageState<UserPreferences>(USER_PREFERENCES_KEY, {
    learningLevel: "beginner",
    colorTheme: "system",
  });
}
