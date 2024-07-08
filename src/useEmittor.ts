"use client";
import { useEffect, useRef, useState } from "react";
import { Emittor } from './createEmittor';

export const useEmittor = <T>(emittor: Emittor<T>): [T, ((state: T | ((state: T) => T)) => void)] => {
    const [state, setState] = useState(emittor.state);

    const setValue = (state: T | ((state: T) => T)) => {
        let newState = state as T

        if (state instanceof Function) {
            newState = state(emittor.state)
        }
        emittor.emit(newState)
    }

    useEffect(() => {
        emittor.connect(setState);

        // Disconnect on unmount
        return () => {
            emittor.disconnect(setState);
        };
    }, [emittor]); // Run effect again if emittor changes

    return [state, setValue]
}
