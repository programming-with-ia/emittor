"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { Emittor } from "./createEmittor";
import type { Reducers } from "./types";

export function isFunc<T>(value: unknown): value is (state: T) => T {
  return typeof value === "function";
}

export const useEmittor = <T, R extends Reducers>(
  emittor: Emittor<T, R>,
): [T, (state: T | ((state: T) => T)) => void] => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      // emittor.connect expects (newState: T) => void, but onStoreChange
      // ignores the arg — it just tells React to re-check getSnapshot
      emittor.connect(onStoreChange as any);
      return () => emittor.disconnect(onStoreChange as any);
    },
    [emittor],
  );

  const getSnapshot = useCallback(() => emittor.state, [emittor]);

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Run emittor init callbacks on mount (idempotent via initRan flag)
  useEffect(() => {
    emittor.init();
  }, [emittor]);

  const setValue = useCallback(
    (newState: T | ((prev: T) => T)) => {
      // Read from emittor.state (source of truth), not stale React state
      const updated = isFunc<T>(newState) ? newState(emittor.state) : newState;
      emittor.emit(updated);
    },
    [emittor],
  );

  return [state, setValue];
};
