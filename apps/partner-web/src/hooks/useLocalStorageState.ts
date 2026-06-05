import { useCallback, useState } from "react";
import { safeParseJson } from "../lib/storage/safe-parse-json";

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => safeParseJson<T>(window.localStorage.getItem(key), initialValue));

  const updateValue = useCallback((nextValue: T) => {
    setValue(nextValue);
    window.localStorage.setItem(key, JSON.stringify(nextValue));
  }, [key]);

  return [value, updateValue] as const;
}
