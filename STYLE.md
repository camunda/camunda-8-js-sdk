# Code Style & Philosophy

This document describes the _implicit_ coding philosophy of this codebase — the
conventions that shape how control flow, iteration, and state are expressed in
`src/`. Most of these are **not enforced by a linter**; they are deliberate
authorial discipline. New code should read like the code already here.

> **In one line:** _Prefer expressions over statements; keep the happy path
> straight; make every exception deliberate._

The style is functional-leaning and immutability-first. Imperative constructs
(`let`, raw `for`/`while`, `if/else` branching) are treated as escape hatches
that must earn their place — and when used, they are kept narrow, localized, and
often annotated with a comment explaining why.

---

## 1. Immutable by default

- **`const` over `let`, always; never `var`.** In `src/` the ratio is roughly
  26:1 `const`:`let`, with zero `var`.
- **Push immutability into the type system** with `readonly`, `private readonly`,
  and `as const` rather than runtime freezing. (`Object.freeze` is intentionally
  absent.)
- **Mutation is rare and localized.** Compound-assignment and increment operators
  barely appear; `.push` is used for accumulation but in-place rewriting of shared
  state is avoided.

### When `let` is acceptable

`let` is an exception, not a default, and falls into three shapes:

1. **Definite-assignment across branches** — when the initializing logic is
   _multi-statement_ (a `try/catch`, a multi-arm `if`) and cannot be a single
   `const = expr`, declare a typed `let` and assign it **exactly once per branch**.
   These are morally `const`; TypeScript's definite-assignment analysis guarantees
   they are set before use.

   ```ts
   let effectiveAddress: string // ZeebeGrpcClient.ts
   let protocolBasedTLS: boolean | undefined
   if (hasProtocol) {
   	try {
   		const info = parseZeebeGrpcAddress(addr)
   		effectiveAddress = info.hostPort
   		protocolBasedTLS = info.isSecure
   	} catch {
   		effectiveAddress = fallback
   	}
   } else {
   	// ...assigned here instead
   }
   ```

2. **Genuine accumulators, counters, and flags** — e.g. `connectionErrorCount`,
   `doBackoff`, or a recursion accumulator `let taskTypes: string[] = []`. Prefer a
   short comment when the mutation is non-obvious (see `BpmnParser.ts`:
   `// mutated in the recursive function`).

3. **Lazy caches / memoization singletons** — module-level bindings assigned once
   on first use (e.g. `C8Logger.ts`).

---

## 2. Conditionals: guard first, branch in expressions

- **`if` is a one-armed guard that exits early** (`return` / `throw`), not a
  two-armed branch. Validate preconditions and bail so the happy path stays at the
  lowest indentation. In `src/`, ~85% of `if`s have no `else`.

  ```ts
  const methodName = methodMatch?.[1]
  if (!methodName) return line // guard, then continue on the straight path
  const targetLine = findMethodLine(targetFile, methodName)
  if (!targetLine) return line
  return line.replace(/.../, replacement)
  ```

- **Choose _values_ with expressions, not `if/else` assignment** — reach for the
  ternary (`?:`), nullish coalescing (`??`), short-circuit (`||`, `&&`), and
  optional chaining (`?.`):

  ```ts
  const targetFile = preferDist ? distPath : srcPath
  const cacheDir = dir ?? OAuthProvider.defaultTokenCache
  ```

- **No `switch`.** Multi-way logic is expressed with sequential guards or lookup
  objects/maps, never a `switch` statement. There are zero `switch` statements in
  `src/`.

---

## 3. Iteration: declarative first, imperative as an escape hatch

- **Prefer array methods** — `.map` / `.filter` / `.reduce` / `.forEach` /
  `.some` / `.every` — for transforming and collecting known collections. They
  outnumber imperative loops by roughly 3.5:1.

- **Reach for an imperative `for` only where array methods genuinely cannot**:

  - **Unknown-shape object-graph traversal**, usually recursive — `for (const k in
obj)` walking an arbitrary tree (`BpmnParser.ts`, `LosslessJsonParser.ts`),
    switching _back_ to `.forEach` for the known-array parts.
  - **Index-sensitive scanning** of strings/buffers — `for (let i = 0; …)` where
    the index itself matters (`OriginTracing.ts`, `QuerySubscription.ts`).
  - **Async-sequential or side-effecting** iteration — awaiting per item, or
    dispatching jobs; use `Promise.all` where the work is safely parallel.

- **`while` / `for await` are reserved for genuinely unbounded streams** — e.g. a
  `while (true)` poll-retry loop _inside an async generator_ that `yield`s then
  `break`s, consumed declaratively via `for await (const data of generator)`
  (`Subscription.ts`).

- **No `do…while`.** Same "no exotic constructs" discipline as no `switch`.

---

## 4. The unifying tell

The same instinct yields **zero `switch`, zero `do…while`, zero `var`, and zero
`Object.freeze`**. When the imperative escape hatch _is_ used — a mutable `let`, a
raw `for`, a `while (true)` — it is narrow, localized, and frequently annotated
with a comment explaining why. The result is a **straight, un-nested happy path
built from immutable values and pure transformations, with side effects and
mutation quarantined at the edges** (streams, caches, I/O).

---

## Not linter-enforced

These conventions are largely a matter of discipline: the ESLint config does not
set `prefer-const`, `no-var`, `no-else-return`, `no-param-reassign`, `max-depth`,
or `complexity` rules. Prettier handles layout only. Follow the philosophy because
it keeps the codebase coherent — not because a tool will catch you.
