<div align="center">
<h1 align="center">Emittor</h1>
<h3>Small, evented state for React and Next.js</h3>
<h5>Zero providers. Minimal API. Works across components.</h5>

<p align="center">

![Next.js](https://img.shields.io/badge/Next.js-000000.svg?style&logo=Next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB.svg?style&logo=React&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?style&logo=TypeScript&logoColor=white)

</p>

![git-last-commit](https://img.shields.io/github/last-commit/programming-with-ia/emittor)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/programming-with-ia/emittor)
![GitHub top language](https://img.shields.io/github/languages/top/programming-with-ia/emittor)

![minified size](https://img.shields.io/bundlephobia/min/emittor)

[![NPM Version](https://img.shields.io/npm/v/emittor?logo=npm)](https://www.npmjs.com/package/emittor)
[![GitHub](https://img.shields.io/badge/emittor-161b22?logo=github)](https://github.com/programming-with-ia/emittor)

</div>

---

## Overview

Emittor is a tiny, evented state holder. It lets you share state across React components without context providers. It ships with:

- State + pub/sub core
- React hook `useEmittor`
- Pluggable middlewares via `.use(cb)` and `.use(factory, true)`
- Lifecycle: `onInit`, `init()`, `onDeinit`, `deinit()`
- Optional reducer factory to attach named actions to `em.reducers`

Bring batteries with the companion package `emittor-middlewares`. For advanced patterns (URL params, localStorage sync, debounce), see that README.

---

## Install

```sh
npm i emittor
# or
yarn add emittor
# or
pnpm add emittor
```

---

## Quick start

Create a dedicated module for your emittor. Do not create it inside a component.

```ts
// lib/counter.ts
import { createEmittor } from "emittor";

export const counter = createEmittor(0);
```

Use it in any client component.

```tsx
"use client";
import { useEmittor } from "emittor";
import { counter } from "../lib/counter";

export default function Counter() {
  const [count, setCount] = useEmittor(counter);
  return (
    <div>
      <button onClick={() => setCount((c) => c - 1)}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  );
}
```

Note: `useEmittor` calls `emittor.init()` once on mount.

---

## Middlewares (brief)

Use `.use()` to add middlewares. Factories run once and return a middleware. Keep side effects inside the middleware and call `next()` to continue.

- Need URL syncing, localStorage, or debounce? See `emittor-middlewares`.
- For custom middlewares, use this signature: `(next, em) => { /* side effect */; next(); }`.

```ts
// example: simple logger
counter.use((next, em) => {
  console.log("[counter]", em.getState());
  next();
});
```

---

## Reducers (named actions)

Attach named actions once using a reducer factory. They live on `em.reducers`.

```ts
// lib/counter.ts
import { createEmittor } from "emittor";

export const counter = createEmittor(0, {
  reducerFactory: (em) => ({
    increment(by: number = 1) { em.setState(em.state + by); },
    decrement(by: number = 1) { em.setState(em.state - by); },
    reset() { em.setState(em.defaultState); },
  }),
});
```

Use in components:

```tsx
"use client";
import { useEmittor } from "emittor";
import { counter } from "../lib/counter";

export default function ActionsExample() {
  const [count] = useEmittor(counter);
  return (
    <div>
      <div>{count}</div>
      <button onClick={() => counter.reducers.increment()}>+</button>
      <button onClick={() => counter.reducers.decrement()}>-</button>
      <button onClick={() => counter.reducers.reset()}>reset</button>
    </div>
  );
}
```

---

## Lifecycle: init and deinit

Register one-time setup in `onInit`. Return a cleanup function if needed. `useEmittor` calls `em.init()` for you.

```ts
// lib/theme.ts
import { createEmittor } from "emittor";

export const theme = createEmittor<"light" | "dark">("light");

theme.onInit((em) => {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const apply = () => em.setState(mq.matches ? "dark" : "light");
  apply();
  mq.addEventListener("change", apply);
  return () => mq.removeEventListener("change", apply);
});
```

---

## Multiple components, single source of truth

Any component using `useEmittor(em)` will update when `em.setState` is called anywhere.

```tsx
import { useEmittor } from "emittor";
import { counter } from "../lib/counter";

function View() {
  const [count] = useEmittor(counter);
  return <div>{count}</div>;
}

function Button() {
  return <button onClick={() => counter.setState(counter.state + 1)}>Add</button>;
}
```

---

## Other ways to read/write

```ts
counter.getState();
counter.setState(10);

counter.state;       // getter
counter.state = 10;  // setter (calls setState)
```

---

## React helpers

```ts
// useCreateEmittor: returns { state, emittor }
import { useCreateEmittor } from "emittor";

function LocalCounter() {
  const { state, emittor } = useCreateEmittor(0);
  return <button onClick={() => emittor.setState(state + 1)}>{state}</button>;
}
```

```ts
// useMotionEmittor: create and memoize an emittor (no subscription)
import { useMotionEmittor } from "emittor";

function Maker() {
  const em = useMotionEmittor({ open: false });
  return null;
}
```

---

## SSR and Next.js notes

- Create each emittor in its own module. Do not create inside a component.
- Use `"use client"` on components that call `useEmittor`.
- `useEmittor` calls `em.init()` on the client. Safe for Next.js App Router.

---

## API reference

### `Emittor<T, R>`

Properties

- `state: T` getter/setter
- `defaultState: T` initial state
- `reducers: R` actions from `reducerFactory` (optional)
- `emit` alias of `setState`
- `refresh` alias of `exec`

Constructor

- `new Emittor(initialState: T, options?: { match?: boolean; reducerFactory?: (em) => R })`
  - `match` (default true): skip updates when `next === current`

Core

- `setState(state: T): void`
- `getState(): T`
- `run(state: T): void` runs middleware chain then subscribers with provided state (does not change state)
- `exec(): void` runs middleware/subscribers with current state

Subscriptions

- `connect(cb: (state: T) => void): () => void`
- `disconnect(cb): void`

Middleware

- `use(cb: Middleware<T, R>): this`
- `use(factory: MiddlewareFactory<T, R>, true): this`

Lifecycle

- `onInit((em) => void | () => void): this`
- `init(force = false): void`
- `onDeinit(cb: () => void): void`
- `deinit(): void`

---

## Middlewares package

For URL param sync, localStorage sync, and debounced side effects, see:

- `emittor-middlewares` on npm
- The usage examples in its README

---

## License

MIT
