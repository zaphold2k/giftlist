# Code Style Guide

Coding standards for this codebase: Next.js 16 (App Router) + TypeScript +
Tailwind v4 + Prisma/SQLite + Auth.js.

Project context, established conventions and known pitfalls live in
`AGENTS.md`; this document covers *how code is written*, not *how the app
works*. When the two overlap, `AGENTS.md` wins on domain specifics.

## 1. Principles

- **Production ready by default.** No placeholder logic, mock data, dead
  code, or debug scaffolding on `main`. Anything knowingly incomplete gets
  `// TODO(username): <what is missing and why it wasn't done now>` — never
  a bare `// TODO`.
- **Debuggable over clever.** Prefer code that is easy to step through
  during an incident. No chained ternaries, no deep one-liners, no implicit
  control flow where a plain multi-line version reads the same.
- **Explicit over implicit.** No hidden side effects, no silently swallowed
  errors. Every failure path is visible in the code.
- **Consistency over preference.** If the codebase already solves something
  a certain way, follow it. Do not introduce a second convention for
  something that already has one.

## 2. Language

- Identifiers, comments, JSDoc, and commit messages: **English**.
- User-facing strings (UI copy, `zod` validation messages, domain error
  messages surfaced to the user): **Spanish**, matching the existing
  product copy. `throw new Error("No autorizado")` is correct; the message
  is UI-facing text, not a developer comment.
- Never mix the two inside one sentence.

## 3. Formatting

The repo has no Prettier config; formatting is enforced by convention and
must be kept uniform. Match the surrounding file exactly:

- Double quotes, semicolons, 2-space indentation, trailing commas in
  multi-line literals.
- Keep logic lines under ~90 columns. Long literal Tailwind class strings
  are the documented exception — they are never wrapped or split, because
  Tailwind v4 only scans literal strings (see §8).
- Break long function signatures one parameter per line, closing paren on
  its own line (see `reserve()` in `app/l/[slug]/actions.ts`).
- Every change must leave the file formatted. Never ship a mixed commit of
  reformatting plus behavior — split them.
- If Prettier is ever added to the repo, its output becomes the source of
  truth and this section reduces to "run the formatter".

Before committing, code must pass all three:

```
npx tsc --noEmit
npm run lint
npm run build
```

## 4. TypeScript

- `strict` is on and stays on. Never weaken `tsconfig.json` to make code
  compile.
- No `any`. Use `unknown` and narrow it (`error instanceof X`, type
  guards), or write the real type. The one accepted cast idiom is the
  documented `globalThis as unknown as { prisma?: PrismaClient }` pattern
  in `lib/prisma.ts`.
- No non-null assertions (`!`) to silence the compiler; handle the
  `null`/`undefined` branch or prove it away with a guard.
- No `@ts-ignore`. `// @ts-expect-error: <technical reason>` only when the
  underlying issue is understood and unfixable at the source.
- Prefer `type` aliases for data shapes and unions. Exported server-action
  state types are explicit and named (`FormState`, `ReserveState`).
- Exported functions declare their return type; local helpers may rely on
  inference.
- Import from the path alias `@/*` for anything outside the current
  directory. The generated Prisma client is imported from
  `@/app/generated/prisma/client` — **never** from `@prisma/client`.

## 5. Naming

- `camelCase` for variables and functions, `PascalCase` for types and React
  components, `SCREAMING_SNAKE_CASE` for module-level configuration
  constants (`DEFAULT_CATEGORIES`, `CATEGORY_COLORS`).
- Names say what the value *is*, not its type (`giftReservation`, not
  `data` or `reservationObj`).
- Booleans and predicates read as assertions: `isTurnstileConfigured`,
  `isRetryableError`, `hasOwner`.
- Authorization helpers keep the `require*` prefix — the prefix signals
  "throws if not allowed" (`requireSession`, `requireOwnedList`).
- No domain-word abbreviations (`reservation`, not `resv`). Well-known
  short forms are fine: `id`, `url`, `db`, `tx`.

## 6. Comments

- Comments explain **why**, never **what**. A comment restating the code is
  noise and must be deleted.
- Write one only when the code cannot carry the reasoning by itself: a
  concurrency or ordering constraint, a library/platform quirk, a
  single-use-token rule, a business rule not derivable from the schema.
  `lib/reservations.ts`, `lib/with-retry.ts` and
  `components/reservation-form.tsx` are the reference examples.
- Vague comments are banned: `// fix this`, `// hack`, `// magic`,
  `// important`. State the concrete technical reason instead.
- JSDoc block (`/** ... */`) for a function whose *contract* needs
  explaining (concurrency guarantees, invariants). Line comments (`//`) for
  a local decision at the point it's made.
- No commented-out code — git already keeps the history.

## 7. Functions and structure

- One function, one job. If a function needs a comment to separate its
  "phases", split it into named helpers.
- Guard clauses and early returns over nested `if` pyramids: validate,
  authorize, then do the work.
- Business logic that touches concurrency, retries, or authorization lives
  in `lib/`, not inline in a server action or component. Server actions
  orchestrate: parse → authorize → call `lib/` → revalidate → return state.
- Components live in `components/` and are exported by name
  (`export function CategoryBadge({...})`); props are typed inline in the
  signature unless the shape is reused elsewhere.
- Route-specific server actions stay in that route segment's `actions.ts`.

## 8. React / Next.js (App Router)

> Next.js 16 differs from older versions in APIs and conventions. When
> unsure, read `node_modules/next/dist/docs/` before writing code — do not
> rely on memory of earlier releases.

- Server Components by default. `"use client"` only where interactivity or
  browser APIs are genuinely needed, and pushed to the smallest possible
  leaf component.
- Async request APIs are awaited: `await headers()`, `await params`.
- Server actions declare `"use server"` at the top of the file, take
  `(_prev, formData)` for `useActionState`, and return a typed state object
  (`{ error?: string }`) rather than throwing at the user.
- Every server action validates input with a `zod` schema from
  `lib/validation.ts` before touching the database. Server actions are
  reachable by direct POST — route protection is not authorization.
- Every action or page touching a list or its items goes through
  `requireOwnedList` / `requireOwnedItem` (`lib/authz.ts`). Never compare
  `GiftList.parentId` by hand; access is membership in `GiftListAdmin`.
- After a mutation, call `revalidatePath` for every affected route.
- **Any input that must be submitted — including hidden ones — has to be
  nested inside its `<form>`.** An input outside the form silently never
  submits (this exact bug shipped once with the category color picker).

## 9. Tailwind CSS

- Utility classes in JSX; `style={}` only for values computed at runtime.
- **Never build class names dynamically** (`` `bg-${color}-100` ``).
  Tailwind v4 scans source for literal strings and will not emit the class.
  Map variants to complete literal strings in a `Record<string, string>`,
  as in `lib/categories.ts`.
- A class list repeated across elements becomes a module-level constant
  (`const inputClass = "..."` in `components/reservation-form.tsx`) or a
  component — not a custom CSS class.
- The app is light-mode only (`color-scheme: light` in `app/globals.css`);
  colors are hardcoded assuming a light background. Do not add ad-hoc
  `dark:` variants — real dark mode means auditing every component.

## 10. Error handling

- Expected domain failures are modeled as named `Error` subclasses in
  `lib/` (`ReservationFullError`, `TurnstileError`), thrown from the domain
  function and caught with `instanceof` at the server-action boundary,
  where they become a friendly `{ error }` state. Unrecognized errors are
  **re-thrown**, never mapped to a generic message.
- Never swallow an error silently. An empty `catch {}` is allowed only for
  a fire-and-forget call whose failure is genuinely irrelevant, and only
  with a comment saying why (the `PRAGMA journal_mode=WAL` call in
  `lib/prisma.ts` is the single sanctioned case).
- Nothing internal reaches the client: no stack traces, no raw Prisma error
  messages, no secrets or tokens in returned state or logs.
- Error text shown to a user is Spanish, specific, and actionable.

## 11. Prisma / database

- All access goes through `prisma` from `@/lib/prisma`. No raw SQL string
  concatenation; `$queryRaw` only via tagged templates and only when the
  query API genuinely cannot express it, with a comment stating why.
- Select explicitly (`select` / `include`) — do not fetch whole rows out of
  convenience.
- **Read-count-decide-write must be atomic.** Wrap it in
  `prisma.$transaction(...)` plus `withRetry()` (`lib/with-retry.ts`); a
  check followed by a separate write is a race condition, not a guard.
- For uniqueness, the database constraint is the guard: a `findFirst`
  pre-check exists only to produce a nicer message, and the `create` /
  `update` must still catch `P2002`.
- Schema changes go through Prisma Migrate. Migrations that need a data
  backfill are generated with `--create-only` and hand-edited (SQLite
  rebuilds the whole table on column changes — see the
  `list_scoped_categories` and `item_links` migrations for the pattern).
  Never hand-edit the SQLite file.
- Run `npx prisma generate` explicitly after editing
  `prisma/schema.prisma`; `migrate dev` does not reliably regenerate the
  client in this environment.

## 12. Security

- Validate and re-authorize on the server for every request; a hidden
  client-side control is not access control.
- A list's `slug` is the only credential a guest carries — always verify
  that the item being acted on belongs to the list of that slug.
- The guest IP for anti-bot checks comes from `cf-connecting-ip`, not
  `x-forwarded-for` (a client can forge the latter outside Cloudflare).
- Never log or return secrets, tokens, session cookies, or password hashes.
- Optional integrations stay opt-in and fully gated on their env var (see
  `isTurnstileConfigured()`); the app must work unchanged when unset.

## 13. Verification

"It compiles" is not verification.

- `npx tsc --noEmit`, `npm run lint`, `npm run build` and `npm run
  test:coverage` are the minimum bar, not the finish line. All four run in
  CI (`verify` and `test` jobs — see `ROADMAP.md`).
- Unit/integration tests live in `tests/`, mirroring `lib/` (e.g.
  `tests/lib/reservations.test.ts`), and run against a disposable SQLite in
  `os.tmpdir()` (`tests/helpers/db.ts`) — never against `dev.db`.
  Concurrency-sensitive changes get a real parallel test, not just a
  sequential one (see `tests/lib/reservations.test.ts`).
- Behavior changes that touch UI or full request flows are additionally
  verified against the running app — real login, real click-through,
  screenshot, console errors — with ad-hoc Playwright scripts kept in the
  scratchpad, not committed. Automated tests do not replace this for
  UI-facing changes.
- Kill dev servers by explicit PID (`ps aux | grep "next dev"`); a zombie
  dev server keeps serving from its own `dev.db` file descriptor and
  produces phantom results.

## 14. Git and documentation

- One logical change per commit. Formatting-only diffs never ride along
  with behavioral changes.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org):
  `<type>[optional scope]: <description>`, in English and imperative mood.
  Types in use: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`,
  `ci`, `chore`. A breaking change is marked with `!` after the type
  (`feat!:`) and explained in the body.
  This is not cosmetic: `release-please` derives the semver bump and the
  `CHANGELOG.md` entry directly from these types — see `ROADMAP.md`.
- The body explains *why* whenever the diff doesn't make it obvious.
- **`AGENTS.md` is updated in the same commit as the feature it describes**,
  not as a cleanup pass afterwards. **`CHANGELOG.md` is never edited by
  hand** — `release-please` generates it from commit messages on the release
  PR; a manual edit conflicts with that PR.
- Never commit generated or local artifacts: `dev.db*`, `.env`,
  `*.tsbuildinfo`, `.next/`, `app/generated/prisma`. They are covered by
  `.gitignore` — keep it that way.
