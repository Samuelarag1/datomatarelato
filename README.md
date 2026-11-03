# Argentina al Desnudo

Entendé lo que pasa. Descubrí lo que cambia.

Precios, ingresos y pobreza en tu provincia, con datos oficiales explicados en lenguaje simple. El sitio no toma partido: muestra el dato oficial, qué cubre y de dónde sale.

El nombre se cambia en `lib/site.ts`, el ícono en `app/icon.svg` y la imagen principal para compartir en `components/og/share-image.tsx`.

## Cómo levantarlo

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. Funciona sin configurar nada.

Si en desarrollo ves errores de hidratación con `bis_skin_checked` o `bis_register`, vienen de la extensión Urban VPN, no del sitio. Para no verlos, abrí el sitio en una ventana de incógnito o desactivá la extensión.

### Token de la API del INDEC (opcional)

Sin token quedan sin datos la canasta de crianza, la indigencia y la población, y los rubros de precios se muestran en 12 categorías en vez de 18.

1. Pegá tu token en `.env.local`, después de `INDEC_API_TOKEN=`.
2. Corré `npm run check:sources` para comprobar que la API responde como se espera.

### Antes de publicar

Definí `SITE_URL` con la dirección pública (`https://tudominio.org`), tanto para el build como para el servidor: por ejemplo, en `.env.production`. Las etiquetas para compartir usan esa dirección. Si falta al iniciar el servidor, las redes buscan las imágenes en `localhost` y el enlace sale sin imagen, aunque en tu navegador se vea bien. En Vercel, si no está definida, se usa la dirección de producción del proyecto.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` y `npm start` | Build y servidor de producción |
| `npm test` | Tests de lectura de fuentes, validación y análisis |
| `npm run check:sources` | Controla todas las fuentes reales contra valores oficiales |
| `npm run lint` | Lint |

Conviene correr `check:sources` seguido, porque las fuentes públicas cambian sin aviso. Sale con código 1 si encuentra un problema.

## Estructura

```
app/               Páginas (Server Components)
components/
  charts/          Gráficos reutilizables
  editorial/       Secciones, notas de fuente, controles y manejo de fallas
  og/              Imágenes al compartir un enlace
  place/           Selector de lugar y geolocalización
  precios/ pobreza/   Interactivos de cada sección
lib/
  places.ts        Qué región y ciudades corresponden a cada lugar
  sources/         Lectura de CSV, XLS y API del INDEC
  indicators/      Registro de series y productos
  normalize/       Períodos y validación
  analysis/        Variaciones, salario real, adultos equivalentes
  data/            Une todo con la caché de Next.js
assets/fonts/      IBM Plex Sans, para las imágenes al compartir
scripts/           Control de fuentes
docs/              Investigación, diseño y arquitectura, por etapa
```

## Documentación

- [Etapa 1: datos y propuesta](docs/etapa-1-propuesta.md)
- [Etapa 2: diseño de producto](docs/etapa-2-diseno.md)
- [Etapa 3: arquitectura e integraciones](docs/etapa-3-arquitectura.md), con la guía para sumar un indicador

Esta versión de Next.js tiene cambios importantes: antes de tocar código, leé `AGENTS.md`.
