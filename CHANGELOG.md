# Changelog

## [Unreleased]

### Agregado

- Múltiples administradores registrados por lista (`GiftListAdmin`): todos con los mismos permisos, no se puede quitar al último administrador de una lista.
- Enlaces múltiples a tienda por artículo (`GiftItemLink`): cada artículo puede listar varias opciones de compra (distintas tiendas, talles, colores), cada una con un label opcional.
- `docker-compose.yml` para levantar la app con un solo comando, con `.env.example` como plantilla de variables.
- Categorías de artículo, editables por lista: cada lista arranca con un set por defecto (Ropa, Juguetes, Higiene y cuidado, Alimentación, Paseo, Habitación, Otros) que sus administradores pueden renombrar, agregar o borrar libremente, sin afectar a otras listas. Cada categoría tiene un color elegible de una paleta curada de 8 opciones.
- La vista pública de la lista ahora agrupa los regalos por categoría (orden ascendente por cantidad de unidades pedidas dentro de cada una), con un índice flotante a la izquierda para saltar entre categorías.
- Verificación anti-bot opcional (Cloudflare Turnstile) en el form de reserva pública, para evitar reservas automatizadas. Desactivada por defecto — solo se activa si se configuran las variables de entorno correspondientes.

### Cambiado

- La insignia de prioridad ya no se muestra para artículos de prioridad media: al ser el valor "normal", etiquetarla no aportaba nada — solo se destacan alta y baja.

### Corregido

- Contraste en las páginas de login/registro: la app no declaraba `color-scheme: light`, así que el navegador aplicaba su oscurecimiento automático cuando el sistema estaba en modo oscuro.
- Build de Docker: `node:22-alpine` no traía `python3`/`make`/`g++`, necesarios para compilar el binding nativo de `better-sqlite3` durante `npm ci`.
