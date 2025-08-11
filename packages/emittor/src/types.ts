import type { Emittor } from "./createEmittor";

// Extract state type from an Emittor
export type EmittorOf<E> = E extends Emittor<infer U> ? U : never;

// Subscriber signature
export type Callback<T> = (state: T) => void;

// init callback. May return a cleanup.
export type InitCallback<T, R extends Reducers> = (
  emittor: Emittor<T, R>,
) => undefined | void | (() => void);

// Named functions exposed on em.reducers
export type Reducers = Record<string, (...args: any[]) => any>;

// Builds the reducers object once
export type ReducerFactory<T, R extends Reducers> = (em: Emittor<T, {}>) => R;

export type EmittorOptions<T, R extends Reducers> = {
  // If true (default), drop identical state
  match?: boolean;
  // Optional reducers factory
  reducerFactory?: ReducerFactory<T, R>;
} | undefined;

// Middleware: next composes, em gives context
export type Middleware<T, R extends Reducers> = (
  next: () => void,
  em: Emittor<T, R>,
) => void;

// Factory that returns a middleware
export type MiddlewareFactory<T, R extends Reducers> = (
  em: Emittor<T, R>,
) => Middleware<T, R>;
