import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * URL-backed state: `const [tab, setTab] = useSearchParamState('tab', 'systems')`.
 * Writes use replace so tab-flipping doesn't pollute history.
 */
export function useSearchParamState(key, defaultValue) {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) ?? defaultValue;

  const setValue = useCallback(
    (next) => {
      setParams(
        (prev) => {
          const copy = new URLSearchParams(prev);
          if (next === null || next === undefined || next === defaultValue) copy.delete(key);
          else copy.set(key, String(next));
          return copy;
        },
        { replace: true }
      );
    },
    [key, defaultValue, setParams]
  );

  return [value, setValue];
}
