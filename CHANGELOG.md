# Changelog

## [Unreleased]

### Agregado

- Múltiples administradores registrados por lista (`GiftListAdmin`): todos con los mismos permisos, no se puede quitar al último administrador de una lista.
- Enlaces múltiples a tienda por artículo (`GiftItemLink`): cada artículo puede listar varias opciones de compra (distintas tiendas, talles, colores), cada una con un label opcional.
- `docker-compose.yml` para levantar la app con un solo comando, con `.env.example` como plantilla de variables.
- Categorías de artículo (`Ropa`, `Juguetes`, `Higiene y cuidado`, `Alimentación`, `Paseo`, `Habitación`, `Otros`) para clasificar los regalos dentro de una lista.

### Cambiado

- La insignia de prioridad ya no se muestra para artículos de prioridad media: al ser el valor "normal", etiquetarla no aportaba nada — solo se destacan alta y baja.

### Corregido

- Contraste en las páginas de login/registro: la app no declaraba `color-scheme: light`, así que el navegador aplicaba su oscurecimiento automático cuando el sistema estaba en modo oscuro.
- Build de Docker: `node:22-alpine` no traía `python3`/`make`/`g++`, necesarios para compilar el binding nativo de `better-sqlite3` durante `npm ci`.
