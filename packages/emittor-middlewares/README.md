# emittor-middlewares

Batteries for the [`emittor`](https://www.npmjs.com/package/emittor) state library.

- Debounce effects while state changes
- Sync state with `localStorage` (multi-tab)
- Sync state with URL search params

All middlewares are small and tree-shakeable. Use on the client (React/Next.js).

## Install

```sh
npm i emittor emittor-middlewares
# or
yarn add emittor emittor-middlewares
# or
pnpm add emittor emittor-middlewares
```

You must run in a browser environment for the storage and URL middlewares.

## Usage

### 1) Debounce side effects

Run a callback after state changes, but debounce it. Good for analytics, drafts, or rate-limited APIs.

```ts
import { createEmittor } from "emittor";
import { middlewareDebounce } from "emittor-middlewares";

export const search = createEmittor("");

search.use(
  middlewareDebounce((em) => {
    // called after em state changes, debounced by 300ms
    console.log("searching for:", em.getState());
  }, { wait: 300 })
);
```

Options:

```ts
type DebounceOptions = {
  wait?: number;      // default 0
  leading?: boolean;  // default false
  trailing?: boolean; // default true
  maxWait?: number;
};
```

### 2) Sync with localStorage

Keeps state in sync with `localStorage` across tabs. It reads on init, writes after changes (debounced), listens to `storage` events, and avoids loops.

```ts
import { createEmittor } from "emittor";
import { updateMiddlewareLocalStorage } from "emittor-middlewares";

type Settings = { theme: "light" | "dark" };

export const settings = createEmittor<Settings>({ theme: "light" });

settings.use(
  updateMiddlewareLocalStorage<Settings>("settings", {
    wait: 150,
    afterDeserialize(value, em) {
      if (value && (value as any).theme === "dark") return { theme: "dark" };
      if (value && (value as any).theme === "light") return { theme: "light" };
      return em.defaultState;
    },
    // serialize?: (v) => JSON.stringify(v),
    // deserialize?: (s) => (s != null ? JSON.parse(s) : undefined),
  }),
  true
);
```

### 3) Sync with a URL search param

Mirrors state in `?param=value`. Reads on init and `urlchange`, writes after local changes (debounced), and prevents feedback loops.

```ts
import { createEmittor } from "emittor";
import { updateMiddlewareSearchParam } from "emittor-middlewares";

export const page = createEmittor(1);

page.use(
  updateMiddlewareSearchParam<number>("page", {
    wait: 100,
    afterDecode(decoded, em) {
      const n = Number(decoded);
      return Number.isFinite(n) && n > 0 ? n : em.defaultState;
    },
    // encode?: (v) => encodeURIComponent(String(v)),
    // decode?: (s) => (s == null ? undefined : decodeURIComponent(s)),
  }),
  true
);
```

## API

### `middlewareDebounce(callback, options?) => Middleware`

Debounce a callback that receives the emittor, then calls `next()`.

### `updateMiddlewareLocalStorage(key, opts) => MiddlewareFactory`

Sync state with `localStorage`.

- `key: string`
- `opts.wait?: number` debounce ms (default 0)
- `opts.serialize?: (v: T) => string | null` default `JSON.stringify`
- `opts.deserialize?: (s: string | null) => any` default `JSON.parse` when not null
- `opts.afterDeserialize: (value: any, em) => T` final transform/guard

### `updateMiddlewareSearchParam(param, opts) => MiddlewareFactory`

Sync state with a URL search parameter.

- `param: string`
- `opts.wait?: number` debounce ms (default 0)
- `opts.encode?: (v: T) => string | null` default `encodeURIComponent(String(v))`
- `opts.decode?: (s: string | null) => string | undefined` default `decodeURIComponent` or `undefined`
- `opts.afterDecode: (value: string | undefined, em) => T` final transform/guard

## Notes

- Client-only. Create emittors in modules, not inside component render.
- `useEmittor` calls `em.init()` automatically; unsubscribe happens on unmount.
- Call `em.deinit()` if you manage lifecycle manually.

## License

MIT
