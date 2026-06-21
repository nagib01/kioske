# Refactor Plan — Kioske

Incremental, **behavior-preserving** cleanup of the codebase. Each phase is a small,
independently verifiable unit. After each phase: run the gate, verify manually, commit.

## Decisions (locked)
- **Order:** Frontend first (P0–P3), then Backend (P4–P5), cross-cutting last (P6).
- **Data fetching:** lightweight custom `api.ts` client + `useApi` hook (no React Query).
- **Types:** centralize per-side now; shared FE/BE contracts package considered in P6.
- **Tooling:** warnings-first / non-blocking, then ratchet to strict in P6.

## Per-phase gate (every PR)
- [ ] `typecheck` passes (frontend + backend)
- [ ] `test` passes (frontend + backend)
- [ ] Manual smoke of the 5 domains (kioske / staff / monitor / aluno / landing) + clean-URL routing
- [ ] No behavior change

---

## Phase 0 — Guardrails & baseline
- [x] Fix vitest globals so `tsc --noEmit` is clean (frontend)
- [x] Add `.editorconfig` (root)
- [x] Add Prettier config + ignore (root)
- [x] Add ESLint config (frontend: next/core-web-vitals)
- [x] Add ESLint config (backend: typescript-eslint)
- [x] Add `typecheck` / `lint` / `format` scripts (frontend, backend, root)
- [x] Add CI workflow (typecheck → lint → test → build; lint non-blocking)
- [ ] (optional) husky + lint-staged pre-commit

## Phase 1 — Frontend shared foundation
- [x] `src/lib/api.ts` — single fetch client (base URL, JSON, error normalization, auth header)
- [x] `useApi` hook — kills copy-pasted loading/error state
- [x] `src/lib/auth.ts` + `useBackofficeAuth()` — replace 8+ header helpers & 47× `'backoffice_token'`
- [x] `src/types/*` — central domain types (Servico, Ticket, Student, Lesson, Car, User, Stats)
- [x] Tailwind theme tokens (`brand`, `brand-dark`, `surface`) replacing `#047857`/`#065f46`/`#F8FAFC`

**Phase 1 notes**
- Implemented `lib/auth.ts` as helper functions (`getBackofficeToken`, `backofficeHeaders`, `clearBackofficeSession`); migrated all 8 `getHeaders`/`getAuthHeaders` variants, the 6 duplicated `api()` helpers, and the 3 logout blocks.
- `apiFetch`/`useApi` are created and ready; broad **adoption** into pages (replacing the remaining raw `${NEXT_PUBLIC_API_URL}` fetches and inline loading/error state) happens file-by-file during **Phase 3** so each file is touched once.
- Inline duplicate `interface`/`type` declarations are migrated to `src/types` as each page is decomposed in **Phase 3**.

## Phase 2 — Frontend UI primitives & dedup
- [x] `components/ui/*`: Button, Input, Modal, DataTable, Spinner, Badge, Card, EmptyState
- [x] `Logo` / `AppHeader` component (dedupe 12× kiosk/aluno header markup)
- [x] Unify `BackofficeLayout` + `InstructorLayout` into a shared `SidebarLayout`
- [x] Collapse the 3 ad-hoc WebSocket impls onto `useRealtimeQueue`

**Phase 2 notes**
- `components/ui/*` created (additive); broad adoption happens during Phase 3 page cleanup.
- `Logo` created and adopted in the kiosk/aluno headers (conta, aluno/login, servicos, aluno ×3). The monitor header (`chamadas`) keeps its distinct style.
- `SidebarLayout` now backs both `BackofficeLayout` and `InstructorLayout` (identical shell extracted; inner markup unchanged).
- Created shared `hooks/useWebSocket.ts` (reconnecting socket) and migrated `useRealtimeQueue` onto it. The 3 page-level sockets (`backoffice`, `chamadas`, `fila`) are migrated to `useWebSocket` as those files are decomposed in **Phase 3** (avoids editing the god files twice).
- **Dev config fix:** `frontend/.env.local` now points `NEXT_PUBLIC_API_URL`/`WS_URL` at `localhost:3001` for local dev (was the production tunnel). File is gitignored, so this is a local-only change.

## Phase 3 — Frontend god-file decomposition (one page per PR)
- [x] `pages/backoffice.tsx` (622 → ~265): extracted `useBackofficeQueue` hook (adopts `useWebSocket` + `apiUrl`) and `backoffice/{StatsCards,QueueList,NewTicketModal}` components
- [x] `pages/admin/alunos/[id]/index.tsx` (471 → ~90): extracted `useStudentProfile` hook (adopts `apiUrl`) + `admin/aluno/{ProfileHeader,PerfilTab,TicketsTab,AulasTab,ContactosTab}` components
- [x] `pages/aluno.tsx` (495 → ~130): extracted `useKioskTriage` hook (adopts `apiUrl` + `useRealtimeQueue`) + `aluno/{ServicosGrid,KioskHeader,TicketCard}` components
- [ ] `pages/admin/fila.tsx` (405)
- [ ] `pages/admin/questionarios.tsx` (359)
- [ ] `pages/aluno/conta.tsx` (349)
- [ ] remaining pages > 250 lines (chamadas, admin/servicos, instructor/aulas, admin/alunos/index)

## Phase 4 — Backend foundation
- [ ] `src/config.ts` — read/validate all env once (zod)
- [ ] Standardize on a single DB access pattern (`withDb`) + typed client (drop `db: any`)
- [ ] Centralized error handling (`setErrorHandler` + `AppError`/`ERR` convention)
- [ ] Remove dead code (Student legacy methods, `regras_triagem`) + dup schemas (`criarOpcaoSchemaAlt`)

## Phase 5 — Backend layering & auth unification
- [ ] Extract `resolveEscolaId()` (×15), `notifyQueue()` (×3), `validate` preHandler (×30)
- [ ] Route-level auth via Fastify `preHandler` (replace ~40 inline guard calls)
- [ ] Unify staff + student auth on shared JWT plumbing
- [ ] Move inline SQL into models
- [ ] Split `student_auth.ts` (407) and `admin.ts` (311) into focused files

## Phase 6 — Contracts & ratchet (ongoing)
- [ ] Single source of truth for ports/URLs (today duplicated across `.env`, `server.js`, `next.config.js`, root scripts)
- [ ] Backfill tests around refactored modules (frontend tests are smoke-only today)
- [ ] Ratchet tooling to blocking; tighten tsconfig (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
- [ ] (optional) shared FE/BE contracts package
