type Callback<T> = (state: T) => void;

type EmittorOptions = { 
    match?: boolean
}

export class Emittor<T> {
    private callbacks: Callback<T>[] = [];
    private _state: T;
    public setState: Callback<T>;
    public emit: Callback<T>

    constructor(initialState: T, options:EmittorOptions  = { match: true }) {
        this._state = initialState;
        if (options.match) {
            this.emit = this.setState = this.setMatchState.bind(this);
        } else {
            this.emit = this.setState = this.setOnlyState.bind(this);
        }
    }

    setOnlyState(state: T){
        this._state = state
        this.exec()
    }

    setMatchState(state: T){
        if (state == this._state)return
        this.setOnlyState(state)
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

    get state(): T {
        return this._state;
    }

    set state(nState: T) {
        this.setState(nState);
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

export function createEmittor<T>(state: T, options?:EmittorOptions) {
    return new Emittor(state, options)
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
    constructor(initState: T, reducers: Reducers<T, R>, options?:EmittorOptions) {
        super(initState, options)
        this.reducers = {} as ReducerEmittorCallback<R>
        Object.entries(reducers).map(([name, callback]) => {
            this.reducers[name as R] = () => (callback as ReducerCallback<T>)(this)
        })
    }
}

export function createReducerEmittor<T, K extends string>(initState: T, reducers: Reducers<T, K>, options?:EmittorOptions) {
    return new ReducerEmittor(initState, reducers, options)
}
