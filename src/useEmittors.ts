import { useState, useEffect } from "react";
import { createEmittor, type EmittorOptions } from "./createEmittor";

export function useMotionEmittor<T>(initialState: T, options?: EmittorOptions) {
  const [emittor] = useState(() => createEmittor(initialState, options));
  return emittor;
}

export function useCreateEmittor<T>(initialState: T, options?: EmittorOptions) {
  const emittor = useMotionEmittor(initialState, options);
  const [state, setState] = useState(emittor.state);

  useEffect(() => {
    const updateState = (newState: T) => setState(newState);
    emittor.connect(updateState);
    return () => emittor.disconnect(updateState);
  }, [emittor]);

  return { state, emittor };
}
