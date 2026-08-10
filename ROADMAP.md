# Roadmap — CI/CD de la imagen Docker

Plan por fases para llegar a un pipeline que verifique tests y coverage en cada
PR, publique imágenes taggeadas por branch, y genere un release al mergear a
`main`.

**Estado actual**: no hay CI. No existe `.github/`, la verificación es manual
(`tsc`, `eslint`, `next build`, scripts Playwright ad-hoc — ver `AGENTS.md`), y
la imagen se construye a mano vía `docker-compose.yml`. **No hay tests ni test
runner**: `package.json` solo define `dev`/`build`/`start`/`lint`, y la única
prueba real es `scripts/test-concurrency.ts`, un script manual que corre contra
`dev.db` y borra datos al terminar.

Por eso las fases van en este orden: un gate de coverage sobre 0% no significa
nada, así que primero hay que fundar la base de tests.

## Decisiones

| Tema | Decisión |
|---|---|
| Registry | GHCR — `ghcr.io/zaphold2k/giftlist`, autenticado con el `GITHUB_TOKEN` del propio workflow (sin secrets extra) |
| Test runner | Vitest, unit + integración sobre `lib/` contra una SQLite temporal |
| Gate de coverage | Ratchet contra `main`: el PR falla solo si el coverage **baja** |
| Versionado | `release-please` con Conventional Commits |
| Arquitecturas | `linux/amd64` únicamente al inicio |

## Trampas de este repo (aplican a todas las fases)

Antes de escribir cualquier workflow, tener presente:

1. **`app/generated/prisma` está en `.gitignore`.** Todo job necesita
   `npx prisma generate` después de `npm ci` y antes de `tsc`, `lint`, `build` o
   `test`. Sin eso no compila nada — es el error más probable del primer intento.
2. **`lib/prisma.ts` instancia el cliente en *import time***, leyendo
   `process.env.DATABASE_URL`. Cualquier test debe fijar `DATABASE_URL` antes de
   importar el módulo (ver Fase 1).
3. **El Dockerfile compila binarios nativos.** Los stages `deps` y `proddeps`
   instalan `python3 make g++` para que `better-sqlite3` compile su binding en
   `npm ci`. El cache de buildx no es una optimización opcional: es la diferencia
   entre un build de ~1 min y uno de varios.
4. **`prisma.config.ts` importa `dotenv/config`**, pero `.env` está
   gitignoreado. En CI las variables van por `env:` del job.
5. **Node 22** en todos los jobs, para igualar el `node:22-alpine` del Dockerfile.
6. Los nombres de branch con `/` se sluggean a `-` en los tags de imagen
   (`feature/x` → `feature-x`).

---

## Fase 0 — CI base, sin gates

Poner el andamio antes de tener nada que verificar.

**Crear** `.github/workflows/ci.yml` con un job `verify`, disparado en
`pull_request` y `push`:

- `actions/setup-node@v4`, Node 22, `cache: npm`.
- `npm ci` → `npx prisma generate` → `npx tsc --noEmit` → `npm run lint` →
  `npm run build`.

**Configurar** branch protection en `main` con `verify` como check requerido.

**Listo cuando**: un PR de prueba muestra el check en verde y `main` rechaza
merges sin él.

---

## Fase 1 — Fundación de tests (Vitest)

**Dependencias** (dev): `vitest`, `@vitest/coverage-v8`, `vite-tsconfig-paths`
(resuelve el alias `@/*` de `tsconfig.json`).

**Scripts** nuevos en `package.json`: `test`, `test:watch`, `test:coverage`.

**Crear** `vitest.config.ts`:

- `environment: "node"` (los tests son de `lib/`, no de componentes).
- Coverage con provider `v8`, reporters `text` + `json-summary` + `lcov`.
- `include`: `lib/**` y `app/**/actions.ts`.
- `exclude`: `app/generated/**` — el cliente Prisma generado no es código nuestro
  y distorsionaría cualquier métrica.

**Crear** `tests/helpers/db.ts`: crea una SQLite descartable en `os.tmpdir()` por
corrida, le aplica `prisma migrate deploy`, y la borra al final. Nunca tocar
`dev.db` (es lo que hace hoy `scripts/test-concurrency.ts`, y por eso no sirve
para CI).

> **Trampa**: `lib/prisma.ts` crea el cliente al importarse. `DATABASE_URL` tiene
> que estar seteada **antes** de que se evalúe ese módulo → usar el `globalSetup`
> de Vitest, o `await import()` dinámico dentro del test. Un import estático
> arriba del archivo de test conecta a `dev.db` y falla de forma confusa.

**Primeros tests**, priorizados por dónde ya aparecieron bugs reales:

| Módulo | Qué cubrir |
|---|---|
| `lib/authz.ts` | Acceso por membresía en `GiftListAdmin`; caso que originó el bug de `cancelReservation` (comparar `parentId` directo debe denegar) |
| `lib/reservations.ts` | Portear `scripts/test-concurrency.ts` a test real: N reservas paralelas ⇒ exactamente `quantityWanted` éxitos. Camino `P2002` → `ReservationFullError` |
| `lib/with-retry.ts` | Reintenta en `P2034`/`SQLITE_BUSY`, no reintenta otros errores, respeta `attempts` |
| `lib/validation.ts`, `lib/categories.ts` | Puros y baratos; suben la línea base de coverage |
| `lib/turnstile.ts` | `fetch` mockeado; sin `TURNSTILE_SECRET_KEY` el flujo queda desactivado |

**Agregar** el job `test` a `ci.yml` (con su `prisma generate` previo).

**Listo cuando**: `npm run test:coverage` pasa en local y en CI, y
`scripts/test-concurrency.ts` puede borrarse.

---

## Fase 2 — Gate de coverage con ratchet

Un umbral fijo hoy sería un número inventado. El ratchet solo exige no
retroceder, y sube solo a medida que se escriben tests.

- El job `test` sube `coverage/coverage-summary.json` como artifact.
- **Crear** `scripts/coverage-ratchet.ts`: baja el summary del último run
  exitoso de `main` con `gh run download` y falla si `lines`, `statements`,
  `functions` o `branches` caen más de **0.5 puntos porcentuales**. Sin baseline
  (primera corrida) pasa e informa. La tolerancia evita falsos rojos por
  redondeo.
- Comentario sticky en el PR con la tabla comparativa (`gh pr comment` con un
  marcador HTML para editar el mismo comentario en cada push, en vez de
  acumular ruido).
- Permisos del job: `pull-requests: write`, `actions: read`.
- `.dockerignore` ya excluye `scripts/`, así que el script no entra en la imagen.

**Listo cuando**: un PR que borra un test a propósito falla el check.

---

## Fase 3 — Build y tags de imagen por branch

**Crear** `.github/workflows/docker.yml`, con `needs: [verify, test]`:

- `docker/setup-buildx-action` → `docker/login-action` (GHCR, `GITHUB_TOKEN`) →
  `docker/metadata-action` → `docker/build-push-action`.
- Tags vía `metadata-action`:
  - `type=ref,event=branch` → `feature-x`
  - `type=ref,event=pr` → `pr-12`
  - `type=sha,format=short` → trazabilidad al commit exacto
- **PRs: `push: false`.** Se construye para verificar que la imagen compila, sin
  ensuciar el registry con una imagen por cada sync del PR.
  Pushes a rama: `push: true`.
- `cache-from` / `cache-to: type=gha` — ver trampa 3.
- Solo `linux/amd64`. `arm64` queda pendiente: exige QEMU y compilar
  `better-sqlite3` emulado, lo que multiplica el tiempo de build. Se agrega
  recién si hay un target ARM real.
- **Smoke test** post-build: `docker run` con `AUTH_SECRET` dummy y un volumen
  temporal; esperar 200 en `/`. Valida lo que un `docker build` no valida: que
  `docker-entrypoint.sh` corra `migrate deploy` sobre una base vacía y que el
  bundle standalone arranque.

**Listo cuando**: pushear a una rama publica
`ghcr.io/zaphold2k/giftlist:<branch>` y el smoke test pasa.

---

## Fase 4 — Release automático al mergear a main

**Crear** `.github/workflows/release.yml` con `googleapis/release-please-action`
(`release-type: node`).

**Crear** `release-please-config.json` con `changelog-sections` mapeando los
tipos de commit a las secciones en español que ya usa `CHANGELOG.md`:
`feat`→"Agregado", `fix`→"Corregido", `refactor`/`perf`→"Cambiado".

**Migración previa, obligatoria**: convertir el `## [Unreleased]` actual de
`CHANGELOG.md` en una entrada `## [0.1.0]` y crear
`.release-please-manifest.json` con `{".": "0.1.0"}`. Sin esto, release-please
arranca desde cero e ignora el historial ya escrito.

Flujo resultante: cada push a `main` abre o actualiza un PR de release con el
bump de versión y el changelog calculados desde los commits. Al mergearlo se
crea el tag `vX.Y.Z` y el GitHub Release, lo que dispara el push de imagen con
`type=semver` (`1.2.3`, `1.2`) más `latest`.

**Cambio de proceso a propagar** — esta fase invalida convenciones vigentes:

- `AGENTS.md` exige hoy actualizar `CHANGELOG.md` en el mismo commit de cada
  feature. Con release-please el changelog pasa a ser **generado**: editarlo a
  mano genera conflictos con el release PR. Hay que reescribir esa instrucción.
- Los commits actuales no son convencionales (`Add optional Cloudflare
  Turnstile...`). `CODESTYLE.md` §14 ya exige Conventional Commits desde este
  roadmap; el historial previo queda como está.

**Listo cuando**: mergear un `feat:` a `main` produce un release PR, y mergear
ese PR publica `ghcr.io/zaphold2k/giftlist:X.Y.Z` y `:latest`.

---

## Fase 5 — Backlog priorizado

- **Job `migrations`**: `prisma migrate deploy` sobre base vacía +
  `prisma migrate diff --exit-code` contra `schema.prisma`, para detectar
  migración faltante o backfill roto. Alto valor acá porque varias migraciones
  están editadas a mano (`list_scoped_categories`, `item_links`).
- **Endpoint `/api/health`**: reemplaza el `curl /` del smoke test y habilita
  healthchecks de deploy.
- **E2E Playwright** contra la imagen publicada. Diferido a propósito: suma
  minutos por PR y mantenimiento de selectores — `AGENTS.md` ya documenta que
  los locators por texto se rompen cuando un componente entra en modo edición.
- **Dependabot** para npm y para las GitHub Actions.
- **`arm64`** si aparece un target de deploy ARM.
