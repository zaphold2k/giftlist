# giftlist

Aplicación web de lista de regalos para bebé (estilo hellobb.net). Los padres publican una lista de artículos que necesitan y la comparten con familia/amigos vía un link público; los invitados reservan qué van a regalar (sin necesidad de cuenta) para evitar regalos duplicados.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma ORM 7 + SQLite (driver adapter `better-sqlite3`)
- Auth.js (NextAuth v5) con Credentials para los padres
- Dockerizado (contenedor único, sin base de datos separada)

## Desarrollo

```bash
npm install
npx prisma migrate dev   # crea ./dev.db y aplica migraciones
npm run dev
```

Variables en `.env` (no se versiona): `DATABASE_URL="file:./dev.db"`, `AUTH_SECRET` (genera uno con `openssl rand -base64 32`) y `AUTH_TRUST_HOST=true`. Opcionales `TURNSTILE_SECRET_KEY`/`NEXT_PUBLIC_TURNSTILE_SITE_KEY` (ver `## Anti-bot` abajo) — sin ellas la app funciona igual, solo sin el widget.

Datos de prueba: `npx tsx prisma/seed.ts` (crea `test@example.com` / `supersecreta1` con una lista de ejemplo).

## Rutas

- `/` landing · `/login` · `/register`
- `/dashboard` gestión de listas del padre (protegido por sesión vía `proxy.ts`)
- `/l/[slug]` vista pública de una lista: el slug es un token aleatorio no adivinable y actúa como control de acceso; los invitados reservan sin cuenta

## Concurrencia en reservas

Dos invitados no pueden reservar la misma unidad de un artículo:

1. `lib/reservations.ts` cuenta las reservas activas y crea la nueva dentro de una única transacción de Prisma (SQLite serializa las escrituras, por lo que la comprobación es correcta).
2. SQLite corre en modo WAL con `busy_timeout` de 5 s (`lib/prisma.ts`).
3. Los conflictos de escritura se reintentan con backoff (`lib/with-retry.ts`).
4. Red de seguridad a nivel de base de datos: índice único parcial sobre `(itemId, unitSlot) WHERE status = 'ACTIVE'` (migración manual), que convierte cualquier doble reserva en una violación de constraint.

Prueba de estrés: `npx tsx scripts/test-concurrency.ts` lanza 10 reservas en paralelo por artículo y verifica que solo triunfan las unidades disponibles.

## Anti-bot (Turnstile)

El form de reserva pública puede pedir [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) (gratis, sin límite de requests) para descartar reservas automatizadas. Es opcional: sin `TURNSTILE_SECRET_KEY` seteada, el widget no se muestra y el servidor no exige token — no rompe el desarrollo local por defecto.

1. Crear un widget en el [dashboard de Cloudflare](https://dash.cloudflare.com/?to=/:account/turnstile) (Turnstile) para el dominio de producción.
2. Completar `TURNSTILE_SECRET_KEY` y `NEXT_PUBLIC_TURNSTILE_SITE_KEY` en `.env`.
3. Para desarrollo local sin crear un widget real, usar las [test keys públicas de Cloudflare](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) (ver `.env.example`).

Se recomienda complementarlo con una regla de **Rate Limiting** de Cloudflare sobre `/l/*` — eso se configura en el dashboard, no en la app.

## Docker

Con docker compose (recomendado):

```bash
cp .env.example .env   # completar AUTH_SECRET (openssl rand -base64 32)
docker compose up -d --build
```

Manualmente:

```bash
docker build -t giftlist .
docker run -d -p 3000:3000 \
  -e AUTH_SECRET="$(openssl rand -base64 32)" \
  -v giftlist_data:/data \
  giftlist
```

El entrypoint aplica `prisma migrate deploy` en cada arranque; la base de datos vive en el volumen `/data` y sobrevive a los reinicios del contenedor.
