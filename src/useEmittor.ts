"use client";
import { useEffect, useState } from "react";
import { Emittor } from "./createEmittor";

function isFunc<T>(value: unknown): value is (state: T) => T {
  return typeof value === "function";
}

export const useEmittor = <T>(
  emittor: Emittor<T>,
  defaultValue?: T | (() => T)
): [T, (state: T | ((state: T) => T)) => void] => {
  const [state, setState] = useState<T>(() => {
    // Initialize state with the emittor state or the default value
    if (defaultValue !== undefined && emittor.state === undefined) {
      const initial = isFunc<T>(defaultValue) ? defaultValue() : defaultValue;
      emittor.emit(initial);
      return initial;
    }
    return emittor.state;
  });

  const setValue = (newState: T | ((state: T) => T)) => {
    const updatedState = isFunc<T>(newState) ? newState(state) : newState;
    emittor.emit(updatedState);
  };

  // useEffect(() => {
  //     // Emit default value if the emittor state is undefined (only set in emit)
  //     if (defaultValue !== undefined && emittor.state === undefined) {
  //         console.log("defaultValue", defaultValue)
  //         const initial = isFunc<T>(defaultValue) ? defaultValue() : defaultValue;
  //         emittor.emit(initial);
  //     }
  // }, [defaultValue, emittor]);

  useEffect(() => {
    const updateState = (newState: T) => setState(() => newState);
    emittor.connect(updateState);

    return () => {
      emittor.disconnect(updateState);
    };
  }, [emittor]);

  return [state, setValue];
};
