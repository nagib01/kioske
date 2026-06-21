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
- [x] `pages/admin/fila.tsx` (423 → ~135): extracted `useFilaLive` hook (adopts `useWebSocket` + `apiUrl`) + `admin/fila/{FilaMetrics,FilaTable}` components
- [x] `pages/admin/questionarios.tsx` (387 → ~65): extracted `useQuestionarios` hook (adopts `apiUrl`) + `admin/questionarios/{QuestionariosTable,PerguntaModal}` components
- [x] `pages/aluno/conta.tsx` (375 → ~145): extracted `useStudentAccount` hook (adopts `apiUrl`, keeps 401-refresh fetch) + `aluno/conta/{ProfileCard,ContaAulasTab,ContaNotificacoesTab,ChangePasswordModal}` components
- [x] remaining pages > 250 lines: [x] chamadas (→ `useMonitorQueue` + `monitor/{MesaGrid,CurrentCalled,WaitingList}`, completes 3-socket consolidation); [x] admin/servicos (→ `useServicos` + `admin/servicos/{ServicosTable,ServicoModal}`); [x] instructor/aulas (→ `useInstructorLessons` + `instructor/{LessonsTable,LessonFormModal}`); [x] admin/alunos/index (→ `useAlunosList` + `admin/alunos/{AlunosDashboard,AlunosFilters,AlunosTable}`)

## Phase 4 — Backend foundation
- [x] `src/config.ts` — read/validate all env once (zod)
- [x] Standardize on a single DB access pattern (`withDb`) + typed client (drop `db: any`)
- [x] Centralized error handling (`setErrorHandler` + `AppError`/`ERR` convention)
- [x] Remove dead code (Student legacy methods, `regras_triagem`) + dup schemas (`criarOpcaoSchemaAlt`)

**Phase 4 notes**
- `src/config.ts`: centralized, typed env config (with `corsOrigins()` + `validateConfig()`); reads env once with fallbacks and **does not throw at import** (keeps tests/tooling safe), hard checks run at server startup. Migrated `server.ts`, `logger.ts`, `qrCode.ts`, `EmailService.ts` off scattered `process.env`. (Used plain validation, not zod, to avoid an import-time throw.)
- Added typed `Db`/`QueryResult` in `shared/db.ts`; replaced `db: any` across all 7 model files. Full migration of the remaining manual/direct DB handlers onto `withDb` is left for Phase 5 (route-layer work).
- Added `AppError` + a global `setErrorHandler` in `server.ts` (additive safety net; existing explicit `reply.send` paths unchanged).
- Removed dead `StudentModel.{listarAulas,adicionarAula,removerAula}`, the created-then-dropped `regras_triagem` DDL, and the duplicate `criarOpcaoSchemaAlt` (now uses shared `criarOpcaoSchema`).

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
