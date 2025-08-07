# CRUSH.md

Build/test/typecheck
- Root: Bun + TypeScript monorepo; Vue client and Bun server.
- Server (apps/server)
  - Install: bun install
  - Dev: bun run dev
  - Start: bun run start
  - Typecheck: bun run typecheck
  - Test: bun test
  - Test single file/name: bun test apps/server/src/<file>.test.ts -t "test name"
- Client (apps/client)
  - Install: bun install
  - Dev: bun run dev (Vite)
  - Build: bun run build
  - Preview: bun run preview
  - Typecheck: bunx vue-tsc --noEmit
- System test helper: scripts/test-system.sh

Editor/AI rules
- Cursor: apps/server/.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc → Prefer Bun over Node/npm/yarn/pnpm/vite; use bun test/install/run, Bun.serve, bun:sqlite; avoid express/ws/dotenv.

Code style
- Imports: ESM only ("type": "module"); group std/lib, third-party, then local; side-effect imports last.
- Formatting: 2-space indent, semicolons, single quotes in TS/Vue, trailing commas where valid, max line ~100.
- Types: Strict TS; explicit types on exported APIs; prefer inference locally; avoid any; use unknown + narrowing; share under apps/*/src/types.
- Naming: camelCase vars/functions, PascalCase types/components, UPPER_SNAKE for env consts; Vue components PascalCase filenames.
- Errors: Throw or return structured errors with context; never log secrets; map to HTTP 4xx/5xx on server.
- Async: always await; handle rejections; avoid floating promises.
- Nullability: narrow early; handle undefined/null explicitly.
- Env/config: Bun auto-loads .env; access via Bun.env; don’t commit secrets.
- Client Vue: use <script setup lang="ts">; composables in src/composables; type props/emits.
- DB: Prefer bun:sqlite for new code per Cursor rule.
