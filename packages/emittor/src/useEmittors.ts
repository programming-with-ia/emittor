import { useState, useEffect } from "react";
import { EmittorOptions, Reducers } from "./types";
import { createEmittor } from "./createEmittor";

export function useMotionEmittor<T, R extends Reducers>(
  initialState: T,
  options?: EmittorOptions<T, R>,
) {
  // @ts-ignore
  const [emittor] = useState(() => createEmittor(initialState, options));
  return emittor;
}

export function useCreateEmittor<T, R extends Reducers>(
  initialState: T,
  options?: EmittorOptions<T, R>,
) {
  const emittor = useMotionEmittor(initialState, options);
  const [state, setState] = useState(emittor.state);

  useEffect(() => {
    const updateState = (newState: T) => setState(newState);
    emittor.connect(updateState);
    return () => emittor.disconnect(updateState);
  }, [emittor]);

  return { state, emittor };
}
