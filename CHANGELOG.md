# Changelog

## [0.1.0]

### Agregado

- Múltiples administradores registrados por lista (`GiftListAdmin`): todos con los mismos permisos, no se puede quitar al último administrador de una lista.
- Enlaces múltiples a tienda por artículo (`GiftItemLink`): cada artículo puede listar varias opciones de compra (distintas tiendas, talles, colores), cada una con un label opcional.
- `docker-compose.yml` para levantar la app con un solo comando, con `.env.example` como plantilla de variables.
- Categorías de artículo, editables por lista: cada lista arranca con un set por defecto (Ropa, Juguetes, Higiene y cuidado, Alimentación, Paseo, Habitación, Otros) que sus administradores pueden renombrar, agregar o borrar libremente, sin afectar a otras listas. Cada categoría tiene un color elegible de una paleta curada de 8 opciones.
- La vista pública de la lista ahora agrupa los regalos por categoría (orden ascendente por cantidad de unidades pedidas dentro de cada una), con un índice flotante a la izquierda para saltar entre categorías.
- Verificación anti-bot opcional (Cloudflare Turnstile) en el form de reserva pública, para evitar reservas automatizadas. Desactivada por defecto — solo se activa si se configuran las variables de entorno correspondientes.
- CI en GitHub Actions (`.github/workflows/ci.yml`): job `verify` (`tsc`, `lint`, `build`) y job `test` en cada PR y push a `main`.
- Suite de tests con Vitest (`tests/`): cubre `lib/authz.ts` (incluye el caso de regresión de `cancelReservation`), `lib/reservations.ts` (concurrencia de reservas, reemplaza al script manual `scripts/test-concurrency.ts`), `lib/with-retry.ts`, `lib/validation.ts`, `lib/categories.ts` y `lib/turnstile.ts`. Corre contra una SQLite descartable, nunca contra `dev.db`.
- Gate de coverage con ratchet (`scripts/coverage-ratchet.ts`): el job `test` falla un PR solo si el coverage baja más de 0.5 puntos porcentuales respecto al último run exitoso de `main`, y publica un comentario sticky con la tabla comparativa.
- Job `docker` en `ci.yml` (`needs: [verify, test]`): construye la imagen y la publica en `ghcr.io/zaphold2k/giftlist` con tags por branch/PR/sha en cada push a una rama; en PRs solo construye, sin publicar. Incluye smoke test post-build (`docker run` + `curl` a `/`) sobre una base de datos vacía.
- `release-please` (`.github/workflows/release.yml`): cada push a `main` abre o actualiza un PR de release con el bump de versión y el changelog calculados desde los commits (Conventional Commits, obligatorios desde este mismo cambio). Al mergearlo se crea el tag `vX.Y.Z`, lo que dispara el job `docker` para publicar `ghcr.io/zaphold2k/giftlist:X.Y.Z` y `:latest`. A partir de acá `CHANGELOG.md` ya no se edita a mano.
- Endpoint `/api/health` (chequea conectividad a la base con `SELECT 1`): reemplaza el `curl /` del smoke test de Docker y habilita el `healthcheck` de `docker-compose.yml`.
- Job `migrations` en `ci.yml`: aplica todas las migraciones a una base vacía y corre `prisma migrate diff --exit-code` contra `schema.prisma`, para detectar una migración faltante o un backfill roto antes de mergear.
- Dependabot (`.github/dependabot.yml`) para dependencias de npm y de GitHub Actions, actualización semanal.

### Cambiado

- La insignia de prioridad ya no se muestra para artículos de prioridad media: al ser el valor "normal", etiquetarla no aportaba nada — solo se destacan alta y baja.

### Corregido

- Contraste en las páginas de login/registro: la app no declaraba `color-scheme: light`, así que el navegador aplicaba su oscurecimiento automático cuando el sistema estaba en modo oscuro.
- Build de Docker: `node:22-alpine` no traía `python3`/`make`/`g++`, necesarios para compilar el binding nativo de `better-sqlite3` durante `npm ci`.
