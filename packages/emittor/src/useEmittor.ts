"use client";

import { useEffect, useState } from "react";
import type { Emittor } from "./createEmittor";
import type { Reducers } from "./types";

function isFunc<T>(value: unknown): value is (state: T) => T {
  return typeof value === "function";
}

export const useEmittor = <T, R extends Reducers>(
  emittor: Emittor<T, R>,
): [T, (state: T | ((state: T) => T)) => void] => {
  const [state, setState] = useState<T>(() => {
    return emittor.state; // i think it's not enough
  });

  const setValue = (newState: T | ((state: T) => T)) => {
    const updatedState = isFunc<T>(newState) ? newState(state) : newState;
    emittor.emit(updatedState);
  };

  useEffect(() => {
    const updateState = (newState: T) => setState(() => newState);
    updateState(emittor.state);
    emittor.connect(updateState);
    emittor.init();
    return () => {
      emittor.disconnect(updateState);
    };
  }, [emittor]);

  return [state, setValue];
};
