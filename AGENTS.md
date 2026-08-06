<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# giftlist — contexto para agentes

Lista de regalos para bebé (estilo hellobb.net). Next.js 16 (App Router) + TypeScript + Tailwind + Prisma/SQLite + Auth.js. Setup, rutas y variables de entorno: ver `README.md`. Historial de features en `CHANGELOG.md`.

**Mantener esta guía y `CHANGELOG.md` al día como parte del mismo commit de cada feature, no como un paso aparte al final.**

## Convenciones establecidas

- **Autorización por lista**: nunca comparar `GiftList.parentId` directamente. Usar `requireOwnedList`/`requireOwnedItem` (`lib/authz.ts`), que validan membresía en `GiftListAdmin`. Cualquier página o server action nueva que toque una lista o sus artículos pasa por ahí — un query manual tipo `list.parentId === session.user.id` es casi seguro un bug (pasó con `cancelReservation`, ver abajo).
- **Migraciones con backfill de datos**: `npx prisma migrate dev --create-only --name X` genera el SQL sin aplicarlo; se edita a mano para insertar el backfill entre el `CREATE TABLE`/`ALTER TABLE` y el `DROP TABLE` (SQLite reconstruye la tabla completa al agregar/quitar columnas — ver las migraciones de `list_scoped_categories` o `item_links` como ejemplo del patrón "capturar en tabla temporal antes del rebuild, remapear después"). Antes de aplicar una migración destructiva a `dev.db`, probarla en una copia descartable (`cp dev.db /tmp/x.db` o recrear desde cero) para verificar el backfill.
- **Condiciones de carrera**: SQLite serializa transacciones de escritura (ver comentario en `lib/reservations.ts`). Para operaciones "leer-contar-decidir-escribir" (ej. no permitir quitar el último admin), envolver todo en `prisma.$transaction(...)` + `withRetry()` (`lib/with-retry.ts`), no hacer el chequeo y la escritura como pasos separados. Para checks de unicidad (nombre de categoría, etc.), el pre-check con `findFirst` es solo para dar un mensaje lindo — la guarda real es capturar el `P2002` del constraint único en un `try/catch` alrededor del `create`/`update`.
- **Formularios con listas dinámicas** (enlaces de un artículo, filas de categoría): estado client-side con `useState`, se envían como arrays paralelos (`formData.getAll("campo")`) o inputs ocultos dentro del `<form>`. **Cuidado**: cualquier input (visible u oculto) que no esté anidado dentro del `<form>` correspondiente no viaja en el submit — pasó con el selector de color de categorías, quedó afuera del form y el color nunca se guardaba pese a que la UI se veía bien.
- **Paletas de color en Tailwind**: para badges/swatches, usar un `Record<string, string>` con las clases completas escritas literalmente (ej. `"bg-rose-100 text-rose-700"`), nunca construir el nombre de clase dinámicamente (`` `bg-${color}-100` ``) — Tailwind v4 escanea el código fuente buscando strings literales, no evalúa template strings en runtime. Ver `lib/categories.ts`.
- **Verificación**: no hay suite de tests. Verificar features con scripts Playwright ad-hoc en el scratchpad (login real, click through, screenshot, `console --errors`), no solo `tsc`/`eslint`/`next build`. Cuidado con locators basados en texto después de que un componente entra en modo edición: si el texto pasa a vivir dentro del `value` de un input, un selector `hasText` ya no lo encuentra (afectó varios tests este sesión).

## Desarrollo local — problemas conocidos

- El dev server lanzado en background a veces no muere con `lsof -ti:PUERTO -sTCP:LISTEN | xargs -r kill`; hay que matar los PIDs explícitos (`ps aux | grep "next dev"`) con `kill -9`. Un dev server zombie sigue sirviendo desde su propio file descriptor de `dev.db` aunque el archivo se haya borrado/recreado — causa resultados fantasma difíciles de diagnosticar.
- Después de cambiar `prisma/schema.prisma` hay que correr `npx prisma generate` explícitamente; `migrate dev` no siempre regenera el cliente de forma confiable en este entorno.
- `prisma migrate dev` se niega a correr en modo no interactivo si detecta pérdida de datos (ej. dropear una columna con filas no nulas) — para generar la migración igual, limpiar el dato ofensivo en `dev.db` primero (es data de desarrollo, descartable) o recrear la base.

## Funcionalidades

### Listas con múltiples administradores

Una `GiftList` puede tener varios `Parent` administrándola, todos con los mismos permisos (editar, agregar/quitar administradores, borrar la lista) — no hay jerarquía "owner" vs "admin".

- La relación vive en `GiftListAdmin` (`prisma/schema.prisma`), tabla intermedia `GiftList` ↔ `Parent`. `GiftList.parentId` se conserva solo como dato de "creado por"; **no** se usa para autorización.
- Agregar un administrador (`addListAdmin` en `app/(dashboard)/dashboard/actions.ts`) solo funciona si el email pertenece a una cuenta `Parent` ya registrada — no hay invitación a gente sin cuenta.
- No se puede quitar al último administrador de una lista (`removeListAdmin`), para no dejarla huérfana. Chequeo+borrado atómico vía `$transaction` (ver "Condiciones de carrera" arriba).
- UI en la sección "Administradores" de `app/(dashboard)/dashboard/lists/[listId]/page.tsx`, componente `components/list-admins.tsx`.
- Migración `prisma/migrations/20260805011921_add_list_admins` incluye backfill: el creador de cada lista existente queda como su primer administrador.

### Enlaces múltiples a tienda por artículo

Un `GiftItem` puede tener varios enlaces de compra (`GiftItemLink`: `label` opcional + `url`) en vez de un único campo `url`, para dar opciones (distintas tiendas, talles, colores).

- Formulario dinámico en `components/item-form.tsx`: filas `linkLabel`/`linkUrl` que se agregan/quitan client-side y se envían como arrays paralelos (`formData.getAll`).
- `addItem`/`updateItem` (`app/(dashboard)/dashboard/actions.ts`) parsean esos arrays con `parseLinksForm` y sincronizan los enlaces reemplazándolos por completo (`deleteMany` + `create` anidado), no hacen diff.
- Vista pública (`app/l/[slug]/page.tsx`): cada enlace se muestra como píldora clicable; si no tiene `label`, se usa el hostname de la URL como texto (`linkText()`).
- Migración `prisma/migrations/20260805013648_item_links` incluye backfill: el `url` que tenía cada artículo pasa a ser su primer enlace, y luego se elimina la columna.

### Categorías de artículo (editables, por lista, con color)

Un `GiftItem` puede tener una `Category` opcional para clasificarlo. **No es un enum fijo**: `Category` es un modelo propio, escopeado por lista (`Category.listId`), que los administradores de esa lista pueden crear/renombrar/recolorear/borrar libremente — las categorías de una lista no afectan a otras.

- `lib/categories.ts` exporta `DEFAULT_CATEGORIES` (Ropa, Juguetes, Higiene y cuidado, Alimentación, Paseo, Habitación, Otros, cada una con un color): el set inicial con el que se siembra cada lista nueva (`createList` en `app/(dashboard)/dashboard/actions.ts`, y `prisma/seed.ts`), no una lista cerrada de valores válidos.
- Gestión: acciones `addCategory`/`updateCategory`/`deleteCategory` (mismo archivo), UI en la sección "Categorías" de `app/(dashboard)/dashboard/lists/[listId]/page.tsx`, componente `components/list-categories.tsx`. Nombre único por lista (`@@unique([listId, name])`); no hay protección contra borrar la última categoría de una lista (es un estado válido, no una lista rota).
- **Color**: `Category.color` es texto libre (no enum de la base), validado contra una paleta curada de 8 colores (`CATEGORY_COLORS` en `lib/categories.ts` — pares `bg-*-100/text-*-700` de Tailwind ya armonizados, no un `<input type="color">` libre, para no calcular contraste en runtime). `categoryBadgeClasses()`/`categorySwatchClasses()` resuelven el color a clases, con fallback a `DEFAULT_CATEGORY_COLOR` si el valor guardado no está en la paleta (la columna es texto libre a propósito, para ampliar la paleta sin migración). Picker: `ColorSwatches` en `components/list-categories.tsx` — **el input oculto tiene que quedar dentro del `<form>`**, ver "Convenciones" arriba.
- `GiftItem.categoryId` es nullable con `onDelete: SetNull` — borrar una categoría nunca borra los artículos, solo los deja sin categoría.
- El `<select>` de categoría en `components/item-form.tsx` recibe la lista de categorías de la lista actual como prop (`categories`), no una constante global. `resolveCategoryId()` en `app/(dashboard)/dashboard/actions.ts` revalida server-side que el `categoryId` recibido pertenezca a esa lista.
- Se muestra con `components/category-badge.tsx` (no se renderiza si `category` es `null`) tanto en el dashboard como en la vista pública.
- Migración `prisma/migrations/20260805022101_list_scoped_categories` reemplaza el enum `Category` original: siembra los defaults en cada lista existente y remapea el valor de enum que tenía cada artículo a la fila `Category` correspondiente de su propia lista. `prisma/migrations/20260806132554_category_color` agrega la columna `color` (default `"sky"`, sin backfill especial necesario).
- En el dashboard (`ItemRow`/`ItemForm`) los artículos siguen listados en orden manual (`GiftItem.position`), sin agrupar — es la vista de edición, no la de navegación. El agrupado por categoría es solo para la vista pública, ver abajo.

### Vista pública agrupada por categoría, con índice flotante

La vista pública (`app/l/[slug]/page.tsx`) agrupa los artículos por categoría en vez de listarlos planos.

- Orden de las secciones: por `Category.position` (mismo orden en que aparecen en el panel "Categorías" del dashboard); los artículos sin categoría van en una sección final "Sin categoría". Dentro de cada sección, los artículos van ascendente por `quantityWanted` (cuántas unidades se piden — no por `remaining`, que cambiaría de orden a medida que se reservan cosas), con `position` como desempate estable.
- El agrupado se arma en el propio Server Component con un `Map` (`groupsByKey` → `groups` ordenado), no hay query adicional: la categoría de cada item ya viaja en el `include` existente.
- Cada sección es un `<section id={categoryAnchorId(group.id)}>` (helper en `components/category-index.tsx`) — es el ancla que usa el índice.
- `components/category-index.tsx` (`CategoryIndex`) renderiza un `<nav>` `fixed` a la izquierda con un link por sección (mismo array `groups`, mismo orden). Se oculta si hay 0 o 1 secciones (no tiene sentido "saltar" entre una sola). Es un Server Component — la navegación es con anchors `<a href="#...">` nativos, sin JS ni scrollspy; el smooth scroll es CSS (`scroll-smooth` en el `<html>` de `app/layout.tsx`) + `scroll-mt-6` en cada `<section>`. No resalta la sección visible actualmente (no hay IntersectionObserver) — si se pide eso, es la próxima vuelta natural sobre esto.
- Solo aparece en pantallas `lg:` en adelante (`hidden lg:flex`) — en mobile no hay lugar al costado del contenido centrado.

### Prioridad de artículo

`Priority` (`LOW`/`MEDIUM`/`HIGH`) sigue siendo un enum fijo de Prisma (no como `Category`) — no se pidió que fuera editable. `PriorityBadge` (`components/priority-badge.tsx`) no renderiza nada para `MEDIUM`: es el valor "normal", etiquetarlo no aporta: solo se destacan los extremos.

### Docker / docker-compose

`docker-compose.yml` envuelve el `Dockerfile` existente (single-container, SQLite en un volumen `/data`, `.env.example` como plantilla). Detalle completo en `README.md`. El `Dockerfile` necesita `python3 make g++` en los stages `deps`/`proddeps` — `node:22-alpine` no los trae y `better-sqlite3` los necesita para compilar su binding nativo en `npm ci`.

### Modo claro forzado

`app/globals.css` declara `color-scheme: light` explícito en `:root`. Ningún componente de la app soporta modo oscuro (todos usan colores Tailwind hardcodeados asumiendo fondo claro), así que sin esa declaración Chrome aplica su oscurecimiento automático cuando el sistema está en modo oscuro, generando bajo contraste. Si en algún momento se agrega modo oscuro de verdad, hay que revisar todos los componentes (no solo quitar esta línea).
