type Callback<T> = (state: T) => void;

export class Emittor<T> {
    private callbacks: Callback<T>[] = [];
    private _state: T;

    constructor(initialState: T) {
        this._state = initialState;
    }

    exec(): void {
        // Executes all callbacks with the current state
        this.run(this._state)

    } refresh = this.exec

    run(state: T): void {
        // Executes all callbacks with the state
        this.callbacks.forEach(callback => {
            callback(state);
        });
    }

    emit(state: T): void {
        // Set the new state if provided and execute callbacks
        this._state = state;
        this.exec();

    } setState = this.emit

    get state(): T {
        return this._state;
    }

    set state(nState: T) {
        this.emit(nState);
    }

    getState() {
        return this.state
    }

    disconnect(callback: Callback<T>): void {
        // Remove the specified callback from the list
        const index = this.callbacks.indexOf(callback);
        if (index !== -1) {
            this.callbacks.splice(index, 1);
        }
    }

    connect(callback: Callback<T>): void {
        // Add the callback to the list
        this.callbacks.push(callback);
    }
}

export function createEmittor<T>(state: T) {
    return new Emittor(state)
}

//* ---

type ReducerCallback<T> = (emittor: Emittor<T>) => unknown

export type Reducers<T, R extends string> = {
    [K in R]: ReducerCallback<T>
}

type ReducerEmittorCallback<R extends string> = {
    [K in R]: () => void
}


export class ReducerEmittor<T, R extends string> extends Emittor<T> {
    reducers: ReducerEmittorCallback<R>
    constructor(initState: T, reducers: Reducers<T, R>) {
        super(initState)
        this.reducers = {} as ReducerEmittorCallback<R>
        Object.entries(reducers).map(([name, callback]) => {
            this.reducers[name as R] = () => (callback as ReducerCallback<T>)(this)
        })
    }
}

export function createReducerEmittor<T, K extends string>(initState: T, reducers: Reducers<T, K>) {
    return new ReducerEmittor(initState, reducers)
}
