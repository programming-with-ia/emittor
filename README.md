<div align="center">
<h1 align="center">Emittor</h1>
<h3>State Manager for 'ReactJs | NextJs'</h3>
<h5>◦ Developed with the software and tools below.</h5>

<p align="center">
<img src="https://img.shields.io/badge/Next.js-000000.svg?style&logo=Next.js&logoColor=white" alt="Next.js" />
<img src="https://img.shields.io/badge/React-61DAFB.svg?style&logo=React&logoColor=black" alt="React" />
<img src="https://img.shields.io/badge/TypeScript-3178C6.svg?style&logo=TypeScript&logoColor=white" alt="TypeScript" />
</p>
<img src="https://img.shields.io/github/license/immiProgrammer/emittor?style&color=5D6D7E" alt="GitHub license" />
<img src="https://img.shields.io/github/last-commit/immiProgrammer/emittor?style&color=5D6D7E" alt="git-last-commit" />
<img src="https://img.shields.io/github/commit-activity/m/immiProgrammer/emittor?style&color=5D6D7E" alt="GitHub commit activity" />
<img src="https://img.shields.io/github/languages/top/immiProgrammer/emittor?style&color=5D6D7E" alt="GitHub top language" />
</div>

---

## 📍 Overview

The custom emittor approach for state management in React offers a convenient way to manage and share states across multiple components without the need to wrap them with providers. By utilizing event-driven architecture, this method simplifies the handling of state updates, making it easy to work with event handlers and propagate changes throughout the application. With this approach, components can subscribe to state changes directly, ensuring seamless communication and synchronization between different parts of the UI. Additionally, it eliminates the boilerplate code associated with provider-based state management solutions, providing a more lightweight and flexible alternative for managing application state.

---

## 🚀 Getting Started

Install the package with npm:

```sh
npm install emittor
```

or yarn:

```sh
yarn add emittor
```

or pnpm:

```sh
pnpm add emittor
```

---

## 📖 Usage

First Create `Emittor` in separate file `/lib/emittor.ts`

```ts
import { createEmittor } from 'emittor'

export const countEmittor = createEmittor(0)
```

then:  
connect State with `Emittor` in client Components

```tsx
"use client";
import { countEmittor } from "./lib/emittor";

function Page() {
    // connect State with `Emittor` in client Components and use like useState Hook
    const [count, setCount] = useEmittor(countEmittor)
    ...
}
```

This adjusted code snippet provides a simple and easy-to-understand usage example of the `emittor` package. It demonstrates using the `useEmittor` hook to manage state, similar to how `useState` is used in React.

> **Warning** </br>
> Always create an emittor in a separate file</br>
> Because in development mode, the whole file will be rendered again. That can cause unexpected bugs.

.

> **Note** </br>
> create emittor anywhere in your project like [`createContext`](https://react.dev/reference/react/createContext) in React. </br>
> and import `Emittor` where use or link (in components and other places)

</br>

Also, use a method that can change only the state without re-rendering this component when the state is changed.

```tsx
"use client";

import { countEmittor } from "./lib/emittor"

function Page() {
  return (
    <button onClick={()=>countEmittor.setState(countEmittor.state+1)}>Add</button>
  )
}

export default Page
```

</br>

## Emittor In Multiple Components

The emittor package enables automatic state synchronization across React components. By simply integrating emittor, any component subscribing to state changes will update whenever the state changes anywhere in the application. This eliminates the need for manual state passing or provider wrapping, streamlining development and enhancing component responsiveness.

```tsx
import { useEmittor } from "emittor"
import { countEmittor } from "./lib/emittor"

function Page(){
    return(
        <>
          <View />
          <Button/>
        </>
    )
}

// This component only re-renders when the state is changed.
function View(){
    const [count, setCount] = useEmittor(countEmittor)
    return(
        <div>
            {count}
        </div>
    )
}

function Button() {
  return (
    <button onClick={()=>countEmittor.setState(countEmittor.state+1)}>Add</button>
  )
}

export default Page
```

</br>

### Other Usage

You can also use the emitter in event listeners or other functions to modify state.

```ts
countEmittor.getState()
countEmittor.setState(10)
// also use use directly
countEmittor.state
countEmittor.state = 10
```

It will re-render those components where that emitter is used.
</br>

## Usage of `ReducerEmittor`

First Create `ReducerEmittor` in separate file `/lib/emittor.ts`

```ts
import { createReducerEmittor } from "emittor"

export const countREmittor = createReducerEmittor(0, {
    increment: e=> {
        e.setState(e.state+1)
    },
    decrement: e=> {
        e.setState(e.state-1)
    }
})
```

then use like this

```tsx
"use client";
import { useEmittor } from "emittor"
import { countREmittor } from "./lib/emittor";

export default function Page() {
  const [count, setCount] = useEmittor(countREmittor)

  return (
    <div className="flex gap-8">
      <button className="bg-slate-700 p-3">
          {count}
      </button>
      <button className="bg-slate-700 p-3" onClick={()=>countREmittor.reducers.increment()}>
        +
      </button>
      <button className="bg-slate-700 p-3" onClick={()=>countREmittor.reducers.decrement()}>
        -
      </button>
    </div>
  );
}
```

</br>

---

</br>

you can also use `Emittor` like `ReducerEmittor`
</br>
in `/lib/emittor.ts`

```ts
import { createEmittor } from "emittor"

const emittor = createEmittor(0)

function increment(by:number){
    emittor.setState(emittor.state+by)
}

function decrement(by:number){
    emittor.setState(emittor.state-by)
}

export const countEmittor = {
    emittor,
    increment,
    decrement
}
```

use in Component

```tsx
"use client";
import { useEmittor } from "emittor"
import { countEmittor } from "./lib/emittor";

export default function Page() {
  const [count, setCount] = useEmittor(countEmittor.emittor)

  return (
    <div className="flex gap-8">
      <button className="bg-slate-700 p-3" onClick={()=>setCount(count+1)}>
          {count}
      </button>
      <button className="bg-slate-700 p-3" onClick={()=>countEmittor.increment(10)}>
        +
      </button>
      <button className="bg-slate-700 p-3" onClick={()=>countEmittor.decrement(5)}>
        -
      </button>
    </div>
  );
}
```

---

## 🤝 Contributing

Contributions are always welcome! Please follow these steps:

1. Fork the project repository. This creates a copy of the project on your account that you can modify without affecting the original project.
2. Clone the forked repository to your local machine using a Git client like Git or GitHub Desktop.
3. Create a new branch with a descriptive name (e.g., `new-feature-branch` or `bugfix-issue-123`).

      ```sh
      git checkout -b new-feature-branch
      ```

4. Make changes to the project's codebase.
5. Commit your changes to your local branch with a clear commit message that explains the changes you've made.

      ```sh
      git commit -m 'Implemented new feature.'
      ```

6. Push your changes to your forked repository on GitHub using the following command

      ```sh
      git push origin new-feature-branch
      ```

7. Create a new pull request to the original project repository. In the pull request, describe the changes you've made and why they're necessary.
   The project maintainers will review your changes and provide feedback or merge them into the main branch.

---

## 📄 License

This project is licensed under the `ℹ️ MIT` License.

---
