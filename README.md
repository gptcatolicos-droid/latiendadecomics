# La Tienda de Comics — AI Commerce OS

Tienda y panel administrativo construidos con Next.js, PostgreSQL y una arquitectura modular para catálogo, pagos, multimedia, contenido y proveedores.

## Stack actual

- Next.js 14, React 18 y TypeScript.
- PostgreSQL 18 en Render.
- Migraciones SQL incrementales mediante `npm run db:migrate`.
- Autenticación administrativa con JWT en cookie `httpOnly`.
- Mercado Pago como pasarela activa y arquitectura extensible de pagos.
- Printful y Printify mediante adaptadores aislados y feature flags.
- CI en GitHub Actions: tipos, lint, pruebas y build.
- Despliegue automático de `main` en Render.

## Desarrollo local

```bash
npm ci
cp .env.example .env
npm run db:migrate
npm run dev
```

La tienda se abre en `http://localhost:3000` y el panel en `http://localhost:3000/admin`.

## Validación

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Despliegue

Render utiliza la configuración declarada en `render.yaml`:

1. `npm ci && npm run build`
2. `npm run db:migrate` antes de publicar
3. `npm start`
4. comprobación de salud sobre `/`

El migrador registra cada archivo en `schema_migrations` y utiliza un advisory lock de PostgreSQL para evitar ejecuciones concurrentes.

## Variables principales

| Variable | Uso |
|---|---|
| `DATABASE_URL` | PostgreSQL |
| `JWT_SECRET` | Sesiones administrativas; mínimo 32 caracteres |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Acceso inicial del administrador |
| `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY` | Mercado Pago |
| `RESEND_API_KEY` | Correos transaccionales |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | Funciones de IA disponibles |

### Printful

| Variable | Uso |
|---|---|
| `ENABLE_PRINTFUL=true` | Activa el adaptador |
| `PRINTFUL_TOKEN` | Token del servidor; nunca se expone al navegador |
| `PRINTFUL_STORE_ID` | Opcional para tokens con varias tiendas |

### Printify

| Variable | Uso |
|---|---|
| `ENABLE_PRINTIFY=true` | Activa el adaptador |
| `PRINTIFY_API_TOKEN` | Token del servidor; nunca se expone al navegador |
| `PRINTIFY_SHOP_ID` | Tienda que se sincronizará |

Si faltan flags o credenciales, el módulo permanece visible pero desactivado. No se realizan llamadas externas.

### Growth y marketing

Las integraciones publicitarias arrancan en modo de solo lectura. Ninguna campaña,
presupuesto o mensaje se modifica automáticamente.

| Canal | Variables |
|---|---|
| Meta Ads | `GROWTH_META_ENABLED`, `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID` |
| Google Ads | `GROWTH_GOOGLE_ADS_ENABLED`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_REFRESH_TOKEN` |
| TikTok Ads | `GROWTH_TIKTOK_ADS_ENABLED`, `TIKTOK_ADS_ACCESS_TOKEN`, `TIKTOK_ADVERTISER_ID` |
| Google Analytics 4 | `GROWTH_GA4_ENABLED`, `GA4_PROPERTY_ID` |

La recuperación de carritos exige consentimiento explícito y cifra el correo con
AES-256-GCM. Para habilitarla configura `ABANDONED_CART_ENABLED=true` y un
`GROWTH_ENCRYPTION_KEY` aleatorio de al menos 32 caracteres. Los envíos permanecen
en borrador hasta incorporar un proveedor y aprobación humana.

### Amazon Seller Central

El hub de Marketplaces usa una abstracción independiente y prepara listings para
revisión antes de cualquier publicación. La conexión prioritaria utiliza Amazon
Selling Partner API, Listings Items/JSON listings y Orders API v2026-01-01; nunca
scraping de Seller Central.

| Variable | Uso |
|---|---|
| `ENABLE_AMAZON=true` | Activa el adaptador cuando todas las credenciales existen |
| `AMAZON_SP_API_CLIENT_ID`, `AMAZON_SP_API_CLIENT_SECRET` | Cliente Login with Amazon |
| `AMAZON_SP_API_REFRESH_TOKEN` | Autorización del seller, solo servidor |
| `AMAZON_SELLER_ID` | Identificador del vendedor |
| `AMAZON_MARKETPLACE_IDS` | IDs separados por coma |

## Flujo seguro de dropshipping

```text
Proveedor → Sincronización → Catálogo externo → Cola de revisión → Producto borrador → Publicación manual
```

- La sincronización solo lee datos del proveedor.
- Los tokens permanecen en variables seguras de Render.
- La importación siempre exige una acción del administrador.
- Los productos importados se crean como borradores.
- El envío de pedidos a proveedores queda separado del checkout y exige aprobación.
- Los estados de sincronización y errores quedan registrados en PostgreSQL.

## Módulos administrativos

- Dashboard y búsqueda global `⌘/Ctrl + K`.
- Pedidos, inventario, clientes y productos.
- Categorías, colecciones, secciones y media.
- Payments Hub y transacciones normalizadas.
- Dropshipping, catálogo de proveedores, importaciones y fulfillment.
- Marketplaces, listings, inventario y pedidos Amazon.
- Growth, atribución, carritos consentidos, analytics, integraciones y configuración.

## Estructura relevante

```text
migrations/                 esquema versionado
scripts/migrate.js          migrador idempotente
src/app/admin/              experiencia administrativa
src/app/api/admin/          APIs privadas del admin
src/modules/catalog/        lógica de catálogo
src/modules/orders/         checkout, reservas e inventario
src/modules/payments/       adaptadores de pago
src/modules/suppliers/      Printful, Printify, pricing y sincronización
src/modules/growth/         cifrado, consentimiento, Ads y atribución
src/modules/marketplaces/   adapters y sincronización de canales de venta
tests/                      contratos y pruebas críticas
```
