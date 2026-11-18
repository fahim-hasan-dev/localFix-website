"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

function tabFromLocation<T extends string>(
  allowed: readonly T[],
  fallback: T,
  param: string,
): T {
  const raw = new URLSearchParams(window.location.search).get(param);
  return raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

/** Keeps a tab key in the query string so a reload stays on the same tab. */
export function useUrlTab<T extends string>(
  allowed: readonly T[],
  fallback: T,
  param = "tab",
): [T, (next: T | ((current: T) => T)) => void] {
  const [value, setValue] = useState<T>(fallback);
  const valueRef = useRef(value);
  valueRef.current = value;
  const allowedKey = allowed.join("\0");

  useLayoutEffect(() => {
    const list = allowedKey.split("\0") as T[];
    const apply = () => setValue(tabFromLocation(list, fallback, param));
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, [allowedKey, fallback, param]);

  const setTab = useCallback(
    (next: T | ((current: T) => T)) => {
      const resolved = typeof next === "function" ? next(valueRef.current) : next;
      setValue(resolved);
      const url = new URL(window.location.href);
      if (resolved === fallback) url.searchParams.delete(param);
      else url.searchParams.set(param, resolved);
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    },
    [fallback, param],
  );

  return [value, setTab];
}
