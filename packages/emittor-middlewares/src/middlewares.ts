// -------------------------
// Built-in middlewares
// -------------------------

import type { MiddlewareFactory, Middleware, Emittor, Reducers } from "emittor";
import debounce from "lodash.debounce";
import { observeUrl } from "window-change-events/url";
import { observeStorage } from "window-change-events/localstorage";
export { observeUrl, observeStorage };
/**
 * Return value if defined, otherwise fallback.
 * Simple helper to keep option defaults tidy.
 */
function withFallback<T extends (...args: any[]) => any>(
  value: T | undefined,
  fallback: T,
): T {
  return value ?? fallback;
}

export type DebounceOptions = {
  wait?: number;
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
};

/**
 * Debounces a callback that receives the emittor, then calls next().
 * Useful for rate-limiting effects that react to state changes.
 */
export const middlewareDebounce = <T, R extends Reducers>(
  callback: (em: Emittor<T, R>) => void,
  options: DebounceOptions = {},
): Middleware<T, R> => {
  const wait = options.wait ?? 0;

  const debounced = debounce(callback, wait, {
    leading: options.leading,
    trailing: options.trailing ?? true,
    maxWait: options.maxWait,
  });

  // em.onDeinit(() => debounced.cancel()); //*later: when use MiddlewareFactory

  return (next, em) => {
    debounced(em);
    next();
  };
};

/**
 * Sync state <-> localStorage for multi-tab scenarios.
 * - Reads on init and on storage events.
 * - Writes after local state changes (debounced).
 * - Guards prevent loops and race conditions.
 */
export function updateMiddlewareLocalStorage<T, R extends Reducers>(
  key: string,
  opts: {
    wait?: number;
    serialize?: (v: T) => string | null;
    deserialize?: (s: string | null) => string | undefined;
    afterDeserialize: (s: string | undefined, em: Emittor<T, R>) => T;
  },
): MiddlewareFactory<T, R> {
  const wait = opts?.wait ?? 0;

  const serialize = withFallback(opts?.serialize, (v) => JSON.stringify(v));
  const deserialize = withFallback(opts?.deserialize, (s) =>
    s != undefined ? JSON.parse(s) : undefined,
  );

  return (em) => {
    // Guard flags/timers for loop and race control.
    let disableValueUpdateUntil = 0; // Ignore storage events until this timestamp
    let valueUpdateTimeout: NodeJS.Timeout | undefined;
    let skipNextStorageWrite = false;
    let skipNextValueUpdate = false;

    // Pull from localStorage and push into emittor when valid and changed.
    const updateValueFromStorage = () => {
      const raw = window.localStorage.getItem(key);
      const value = opts.afterDeserialize(deserialize(raw), em);

      if (em.getState() !== value) {
        skipNextStorageWrite = true;
        em.setState(value);
      }
    };

    em.onInit(() => {
      try {
        // Start listening to storage changes; ensure cleanup.
        const off = observeStorage();
        em.onDeinit(() => {
          off();
          debouncedUpdateStorage.cancel();
          if (valueUpdateTimeout) {
            clearTimeout(valueUpdateTimeout);
            valueUpdateTimeout = undefined;
          }
        });

        // Initial sync from storage.
        updateValueFromStorage();

        // Apply external changes (other tabs) safely.
        const storageChangeHandler = (e: StorageEvent) => {
          if (e.key !== key || e.newValue === null) {
            return;
          }

          if (skipNextValueUpdate) {
            skipNextValueUpdate = false;
            return;
          }

          if (valueUpdateTimeout) {
            clearTimeout(valueUpdateTimeout);
            valueUpdateTimeout = undefined;
          }

          // If we just wrote locally, delay handling to avoid clobbering.
          if (disableValueUpdateUntil > Date.now()) {
            valueUpdateTimeout = setTimeout(
              updateValueFromStorage,
              disableValueUpdateUntil - Date.now(),
            );
            return;
          }

          updateValueFromStorage();
        };

        window.addEventListener("storage", storageChangeHandler);
        em.onDeinit(() =>
          window.removeEventListener("storage", storageChangeHandler),
        );
      } catch (err) {
        console.warn("emittor.middlewareLocalStorage: init read failed", err);
      }
    });

    // Push current state to localStorage if changed.
    const updateStorage = () => {
      try {
        const serializedValue = serialize(em.getState());
        const currentValue = window.localStorage.getItem(key);

        if (currentValue === serializedValue) {
          return;
        }

        if (serializedValue === null) {
          window.localStorage.removeItem(key);
        } else {
          // Prevent echo back into state from our own write.
          skipNextValueUpdate = true;
          window.localStorage.setItem(key, serializedValue);
        }
      } catch (err) {
        console.warn("emittor.middlewareLocalStorage: write failed", err);
      }
    };

    const debouncedUpdateStorage = debounce(updateStorage, wait);

    return (next) => {
      next(); // Apply state first.

      if (skipNextStorageWrite) {
        skipNextStorageWrite = false;
        return;
      }

      // Briefly ignore incoming storage events to avoid race conditions.
      disableValueUpdateUntil = Date.now() + wait + 100;
      debouncedUpdateStorage();
    };
  };
}

/**
 * Sync state <-> URL search param.
 * - Reads on init and on urlchange.
 * - Writes after local state changes (debounced).
 * - Uses flags/timers to avoid URL <-> state feedback loops.
 */
export function updateMiddlewareSearchParam<T, R extends Reducers>(
  param: string,
  opts: {
    wait?: number;
    encode?: (v: T) => string | null;
    decode?: (s: string | null) => string | undefined;
    removeOnInvalid?: boolean;
    afterDecode: (s: string | undefined, em: Emittor<T, R>) => T;
    // skipEmpty?: boolean;
    // initValidator?: (s: any) => s is T;
  },
): MiddlewareFactory<T, R> {
  // Options and Defaults
  const wait = opts?.wait ?? 0;

  const encode = withFallback(opts?.encode, (s) =>
    encodeURIComponent(String(s)),
  );
  const decode = withFallback(opts?.decode, (s) =>
    s == null ? undefined : decodeURIComponent(s),
  );

  // const initValidator =
  //   opts?.initValidator ??
  //   (((s) => true) as NonNullable<NonNullable<typeof opts>["initValidator"]>);

  // const afterDecode =
  //   opts?.afterDecode ??
  //   (((v) => v as T) satisfies NonNullable<
  //     NonNullable<typeof opts>["afterDecode"]
  //   >);
  const afterDecode = opts.afterDecode;

  // const setSearchParamValue = () => null;

  // const skipEmpty = opts?.skipEmpty ?? true;

  return (em) => {
    // Internal State for Loop Prevention
    let disableValueUpdateUntil = 0; // ignore url changes until this time
    let valueUpdateTimeout: NodeJS.Timeout | undefined = undefined; // deferred check
    let skipNextUrlWrite = false; // state came from URL
    let skipNextValueUpdate = false; // URL came from our write

    /**
     * Pull param from URL, decode/validate, and update emittor if changed.
     */
    const updateValueFromUrl = () => {
      const url = new URL(window.location.href);
      const raw = url.searchParams.get(param);
      const value = afterDecode(decode(raw), em);

      // Only update state if it's different, to avoid unnecessary re-renders.
      if (em.getState() !== value) {
        // Mark as URL-originated to avoid writing back immediately.
        skipNextUrlWrite = true;
        em.setState(value);
      }
    };

    em.onInit(() => {
      try {
        // Initialize listeners and perform the initial state synchronization.
        const off = observeUrl();
        em.onDeinit(() => {
          // Clean up all resources when the emittor is destroyed.
          off();
          debouncedUpdateUrl.cancel();
          if (valueUpdateTimeout) {
            clearTimeout(valueUpdateTimeout);
            valueUpdateTimeout = undefined;
          }
        });

        // Initial sync from URL.
        updateValueFromUrl();

        const urlChangeHandler = (e: Event) => {
          // If this URL change was caused by our own updateUrl function,
          // reset the flag and ignore the event.
          if (skipNextValueUpdate) {
            skipNextValueUpdate = false;
            return;
          }

          if (valueUpdateTimeout) {
            clearTimeout(valueUpdateTimeout);
            valueUpdateTimeout = undefined;
          }

          // If we just scheduled a URL write, delay reacting to incoming change.
          if (disableValueUpdateUntil > Date.now()) {
            valueUpdateTimeout = setTimeout(
              updateValueFromUrl,
              disableValueUpdateUntil - Date.now(),
            );
            return;
          }
          updateValueFromUrl();
        };

        window.addEventListener("urlchange", urlChangeHandler);
        em.onDeinit(() =>
          window.removeEventListener("urlchange", urlChangeHandler),
        );
      } catch (err) {
        console.warn("emittor.middlewareSearchParam: init read failed", err);
      }
    });

    /**
     * Push current state into the URL param (debounced).
     */
    const updateUrl = () => {
      try {
        const url = new URL(window.location.href);
        const encodedValue = encode(em.getState());
        const currentValue = url.searchParams.get(param);

        // Optimization: Don't modify the URL if the value is already correct.
        if (currentValue === encodedValue) {
          return;
        }

        if (encodedValue === null) {
          url.searchParams.delete(param);
        } else {
          url.searchParams.set(param, encodedValue);
        }

        // Set this flag to true so our own `urlChangeHandler` knows to ignore
        // the event that `replaceState` will trigger.
        skipNextValueUpdate = true;
        window.history.replaceState(window.history.state, "", url.toString());
      } catch (err) {
        console.warn("emittor.middlewareSearchParam: update failed", err);
      }
    };

    const debouncedUpdateUrl = debounce(updateUrl, wait);

    return (next) => {
      next();

      // If state came from URL, do not write it back.
      if (skipNextUrlWrite) {
        skipNextUrlWrite = false;
        return;
      }

      // For local changes, schedule URL update and ignore urlchange briefly.
      disableValueUpdateUntil = Date.now() + wait + 100;
      debouncedUpdateUrl();
    };
  };
}
