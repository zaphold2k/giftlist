@AGENTS.md

# Contexto del proyecto para Claude

Notas de arquitectura sobre funcionalidades no evidentes solo con leer el código. Mantener esta sección al día cada vez que se agregue una funcionalidad nueva.

## Listas con múltiples administradores

Una `GiftList` puede tener varios `Parent` administrándola, todos con los mismos permisos (editar, agregar/quitar administradores, borrar la lista) — no hay jerarquía "owner" vs "admin".

- La relación vive en `GiftListAdmin` (`prisma/schema.prisma`), tabla intermedia `GiftList` ↔ `Parent`. `GiftList.parentId` se conserva solo como dato de "creado por"; **no** se usa para autorización.
- Autorización centralizada en `lib/authz.ts` (`requireOwnedList`, `requireOwnedItem`): validan membresía en `GiftListAdmin`, no `parentId`. Cualquier página o server action nueva que opere sobre una lista debe pasar por estos helpers.
- Agregar un administrador (`addListAdmin` en `app/(dashboard)/dashboard/actions.ts`) solo funciona si el email pertenece a una cuenta `Parent` ya registrada — no hay invitación a gente sin cuenta.
- No se puede quitar al último administrador de una lista (`removeListAdmin`), para no dejarla huérfana.
- UI en la sección "Administradores" de `app/(dashboard)/dashboard/lists/[listId]/page.tsx`, componente `components/list-admins.tsx`.
- Migración `prisma/migrations/20260805011921_add_list_admins` incluye backfill: el creador de cada lista existente queda como su primer administrador.

## Enlaces múltiples a tienda por artículo

Un `GiftItem` puede tener varios enlaces de compra (`GiftItemLink`: `label` opcional + `url`) en vez de un único campo `url`, para dar opciones (distintas tiendas, talles, colores).

- Formulario dinámico en `components/item-form.tsx`: filas `linkLabel`/`linkUrl` que se agregan/quitan client-side y se envían como arrays paralelos (`formData.getAll`).
- `addItem`/`updateItem` (`app/(dashboard)/dashboard/actions.ts`) parsean esos arrays con `parseLinksForm` y sincronizan los enlaces reemplazándolos por completo (`deleteMany` + `create` anidado), no hacen diff.
- Vista pública (`app/l/[slug]/page.tsx`): cada enlace se muestra como píldora clicable; si no tiene `label`, se usa el hostname de la URL como texto (`linkText()`).
- Migración `prisma/migrations/20260805013648_item_links` incluye backfill: el `url` que tenía cada artículo pasa a ser su primer enlace, y luego se elimina la columna.

## Categorías de artículo (editables, por lista)

Un `GiftItem` puede tener una `Category` opcional para clasificarlo. **No es un enum fijo**: `Category` es un modelo propio, escopeado por lista (`Category.listId`), que los administradores de esa lista pueden crear/renombrar/borrar libremente — las categorías de una lista no afectan a otras.

- `lib/categories.ts` solo exporta `DEFAULT_CATEGORIES` (Ropa, Juguetes, Higiene y cuidado, Alimentación, Paseo, Habitación, Otros): el set inicial con el que se siembra cada lista nueva (`createList` en `app/(dashboard)/dashboard/actions.ts`, y `prisma/seed.ts`), no una lista cerrada de valores válidos.
- Gestión de categorías: acciones `addCategory`/`renameCategory`/`deleteCategory` (mismo archivo), UI en la sección "Categorías" de `app/(dashboard)/dashboard/lists/[listId]/page.tsx`, componente `components/list-categories.tsx`. Nombre único por lista (`@@unique([listId, name])`); no hay protección contra borrar la última categoría de una lista (es un estado válido, no una lista rota).
- `GiftItem.categoryId` es nullable con `onDelete: SetNull` — borrar una categoría nunca borra los artículos, solo los deja sin categoría.
- El `<select>` de categoría en `components/item-form.tsx` recibe la lista de categorías de la lista actual como prop (`categories`), no una constante global. `resolveCategoryId()` en `app/(dashboard)/dashboard/actions.ts` revalida server-side que el `categoryId` recibido pertenezca a esa lista (mismo motivo que `requireOwnedList`/`requireOwnedItem`: los server actions son alcanzables por POST directo).
- Se muestra con `components/category-badge.tsx` (no se renderiza si `category` es `null`) tanto en el dashboard (`components/item-row.tsx`) como en la vista pública (`app/l/[slug]/page.tsx`).
- No agrupa ni filtra los artículos por categoría todavía, solo los etiqueta.
- Migración `prisma/migrations/20260805022101_list_scoped_categories` reemplaza el enum `Category` anterior: siembra los defaults en cada lista existente y remapea el valor de enum que tenía cada artículo a la fila `Category` correspondiente de su propia lista.
