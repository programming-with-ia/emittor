import type {
  Callback,
  MiddlewareFactory,
  Middleware,
  EmittorOptions,
  Reducers,
  InitCallback,
} from "./types";

/**
 * Small evented state holder.
 * - setState updates state and runs middleware, then subscribers.
 * - use adds middleware. Factories run once to create a middleware.
 * - onInit registers one-time setup callbacks (optional cleanup).
 * - deinit runs all registered cleanups.
 */
export class Emittor<T, R extends Reducers = {}> {
  private callbacks: Callback<T>[] = [];
  private initCallbacks: InitCallback<T, R>[] = [];

  private _state: T;
  public defaultState: T;
  private options: EmittorOptions<T, R>;
  public reducers: R;

  private middlewares: Middleware<T, R>[] = [];

  // Aliases for external API parity
  public emit: Emittor<T, R>["setState"];
  public refresh: Emittor<T, R>["exec"];

  private deinitCallbacks: (() => void)[] = [];
  private initRan = false;

  constructor(initialState: T, options?: EmittorOptions<T, R>) {
    this._state = initialState;
    this.defaultState = initialState;
    this.options = options;

    this.emit = this.setState;
    this.refresh = this.exec;

    // Optional reducer factory
    // @ts-ignore
    this.reducers = options?.reducerFactory?.(this);
  }

  // Update state and notify
  setState(state: T): void {
    if ((this.options?.match ?? true) && state == this._state) return;
    this._state = state;
    this.exec();
  }

  // Trigger middleware + subscribers with current state
  exec(): void {
    this.run(this._state);
  }

  // Register middleware. If isFactory, call once to get the middleware.
  use(cb: Middleware<T, R>, isFactory?: false): this;
  use(cb: MiddlewareFactory<T, R>, isFactory: true): this;
  use(
    cb: Middleware<T, R> | MiddlewareFactory<T, R>,
    isFactory: boolean = false,
  ): this {
    const mw = isFactory
      ? (cb as MiddlewareFactory<T, R>)(this)
      : (cb as Middleware<T, R>);
    this.middlewares.push(mw);
    return this;
  }

  // Run middleware chain; then call subscribers
  run(state: T) {
    let idx = -1;

    const mwRunner = (i: number) => {
      if (i <= idx) throw new Error("next() called multiple times");
      idx = i;

      if (i < this.middlewares.length) {
        this.middlewares[i]!(() => mwRunner(i + 1), this);
      } else {
        this.callbacks.forEach((cb) => cb(state));
      }
    };

    mwRunner(0);
  }

  get state(): T {
    return this._state;
  }

  set state(nState: T) {
    this.setState(nState);
  }

  getState() {
    return this.state;
  }

  // Subscribe to state pushes
  connect(callback: Callback<T>): () => void {
    this.callbacks.push(callback);
    return () => this.disconnect(callback);
  }

  // Unsubscribe
  disconnect(callback: Callback<T>): void {
    const idx = this.callbacks.indexOf(callback);
    if (idx !== -1) this.callbacks.splice(idx, 1);
  }

  // Register an init callback. It may return a cleanup.
  onInit(callback: InitCallback<T, R>): this {
    this.initCallbacks.push(callback);
    return this;
  }

  // Run init callbacks once unless forced.
  init(force = false): void {
    if (this.initRan && !force) return;

    for (const fn of [...this.initCallbacks]) {
      try {
        const maybeDeinit = fn(this);
        if (typeof maybeDeinit === "function") {
          this.onDeinit(maybeDeinit);
        }
      } catch (err) {
        console.error("[Emitter:init] callback error:", err);
      }
    }

    this.initRan = true;
  }

  // Register a cleanup
  onDeinit(cb: () => void) {
    this.deinitCallbacks.push(cb);
  }

  // Run all cleanups
  deinit() {
    this.deinitCallbacks.forEach((cb) => cb());
  }
}

// Helper to construct an Emittor
export function createEmittor<T, R extends Reducers>(
  initialState: T,
  options?: EmittorOptions<T, R>,
) {
  return new Emittor<T, R>(initialState, options);
}
