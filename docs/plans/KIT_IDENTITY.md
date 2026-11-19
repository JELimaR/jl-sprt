# Propuesta — Identidad cromática y equipaciones de las instituciones

> Estado: fases 1 (core 3.1.1, match 3.2.0) y 2 (`jl-sprt`, `src/JSportModule/data/Entities/Kits/`)
> implementadas. Diferencia con la propuesta: `pc`/`sc` se quitaron de `IInstitutionData`
> y del creator, sin migración (sección 5). Pendientes: fases 3 y 4.

---

## 1. Situación actual

| Pieza | Qué hace hoy |
|---|---|
| `Institution` | Guarda un par `primaryColor` / `secondaryColor`. Si no vienen en el creator, los genera `pickKitColors(id)`. |
| `pickKitColors` | Genera el par de forma determinística por id: matiz al azar, principal claro u oscuro y secundario con luminosidad opuesta. |
| `getData()` | Siempre devuelve `pc` y `sc`, así que los colores generados quedan fijos una vez serializados. |
| `ElementController` | Expone los dos colores en el DTO del team. Si la institución no está en el mundo, vuelve a llamar a `pickKitColors`. |
| App: vista de team e institución | Usa `pc` como fondo y `sc` como texto. |
| App: página de partido | Decide el choque de camisetas (distancia RGB < 110) y, si chocan, el visitante "invierte" sus dos colores como si fuera su alternativa. |

Problemas:

1. **Un solo par de colores cumple tres roles**: identidad del club, camiseta y color de interfaz. Por eso no hay forma de tener una camiseta rayada, una alternativa real ni un arquero.
2. **La regla de choque vive en la interfaz.** Qué camiseta usa cada equipo en un partido es conocimiento del dominio, y hoy lo calcula una página de la app. La "alternativa" no existe: es el par invertido.
3. **El contraste se calcula con la luminosidad HSL**, que no es la luminancia percibida. Un amarillo y un azul con la misma L de HSL tienen luminancias WCAG muy distintas, así que la garantía de legibilidad no es real.
4. **Matices totalmente aleatorios**: salen colores poco creíbles para un club (verdes oliva, violetas apagados) con la misma frecuencia que rojo, azul o blanco.
5. **Hay dos caminos de generación** (`Institution` y `ElementController`) para el mismo dato.
6. **No hay validación** de que `primaryColor` y `secondaryColor` sean hex válidos.

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Origen de los colores | **Automático.** Toda institución recibe identidad y equipaciones generadas al crearse, sin intervención. Indicarlas a mano es opcional (datos de ejemplo, clubes reales). |
| Colores de generación | Paleta ponderada de colores de club, como la de myFPL. |
| Camiseta del visitante | Cambia solo si choca con la del local. |
| Vigencia | Fijas por ahora. El modelo queda preparado para versionarlas por temporada. |
| Cantidad de equipaciones | La define cada deporte (sección 4). |
| Alcance del kit | Camiseta, pantalón y medias, con un diseño simple para pantalón y medias. |

Además, sobre `kit&colors.md`:

- **Color dominante explícito por equipación**, con valor por defecto: el color base de la camiseta.
- **Blanco o negro según contraste WCAG** (luminancia relativa calculada en RGB), no según la luminosidad HSL.
- **La elección de equipación por partido pasa al dominio** (`jl-sprt`), con una distancia de color perceptual (ΔE en CIELAB) en lugar de la distancia RGB.
- **El dibujo SVG va en la app.** El dominio guarda la configuración y la app la dibuja.
- Escudo, sponsor y número quedan para después.

## 3. Paleta de colores

Un catálogo fijo de colores con nombre y peso, en `jl-sprt`. Lo usan el generador (para elegir) y el visualizador (como muestras en los selectores, igual que myFPL). El editor también acepta un hex libre.

| Color | Hex | Peso |
|---|---|---|
| Blanco | `#ffffff` | 14 |
| Negro | `#15161a` | 10 |
| Gris | `#9aa0a8` | 3 |
| Rojo | `#d62828` | 14 |
| Naranja | `#e8590c` | 4 |
| Amarillo | `#f4c91a` | 6 |
| Verde | `#23c46e` | 7 |
| Celeste | `#5aa9e6` | 8 |
| Azul marino | `#16235a` | 12 |
| Violeta | `#6d28d9` | 3 |

Las equipaciones especiales (arquero, líbero) usan un subconjunto: verde, amarillo, naranja, negro, gris, violeta y celeste.

Los pesos son iniciales y pueden quedar como parámetros, igual que los de los motores.

## 4. Lo que define cada deporte: `IKitSpec`

La cantidad y el tipo de equipaciones es conocimiento del deporte, así que vive en `jl-sprt-match`, un archivo por deporte en su carpeta (`FootballKitSpec.ts`, etc.). Core no se toca.

```ts
type KitRole = 'field' | 'special';

interface IKitSlotSpec {
  id: string;                 // 'home', 'away', 'gk1', 'libero1'...
  role: KitRole;
  required: boolean;
  /** Para 'special': contra qué debe contrastar. */
  contrastWith?: ('own-field' | 'opponent-field')[];
  /** Si es 'special': a qué puesto corresponde (arquero, líbero). */
  position?: string;
}

interface IKitSpec {
  slots: IKitSlotSpec[];       // las 'field' en orden de preferencia
  garments: ('shirt' | 'shorts' | 'socks')[];
  /** Plantilla de dibujo que usa la app. */
  template: 'football' | 'volleyball' | 'american-football';
}
```

Especificación inicial:

| Deporte | Equipaciones | Prendas | Particularidad |
|---|---|---|---|
| Fútbol | titular, alternativa, tercera (opcional), arquero 1, arquero 2 (opcional) | camiseta, pantalón, medias | El arquero debe distinguirse de los dos equipos de campo. |
| Vóley | titular, alternativa, líbero 1, líbero 2 (opcional) | camiseta, pantalón, medias | El líbero debe distinguirse de **su propio** equipo, no del rival. |
| Fútbol americano | titular, alternativa | camiseta, pantalón, medias | Sin equipación especial. |

La regla de contraste de cada equipación especial (`contrastWith`) es lo que diferencia al arquero del líbero, así que la elección por partido no necesita conocer los deportes.

## 5. Modelo de datos (`jl-sprt`)

```ts
type HexColor = string; // "#rrggbb", validado

type ShirtPattern =
  | 'plain' | 'vertical-stripes' | 'horizontal-stripes' | 'pinstripes'
  | 'halves' | 'quarters' | 'diagonal-sash' | 'chevron'
  | 'horizontal-band' | 'shoulder-panels';

type CollarType = 'round' | 'v-neck' | 'polo';

interface IShirtDesign {
  pattern: ShirtPattern;
  base: HexColor;          // cuerpo
  detail?: HexColor;       // patrón (rayas, banda...). Obligatorio salvo 'plain'
  dominant?: HexColor;     // para colores web y choques. Por defecto: base
  sleeves: HexColor;
  cuffs: HexColor;
  collar: { type: CollarType; color: HexColor };
}

/** Diseño simple: color y una franja lateral opcional. */
interface IShortsDesign {
  base: HexColor;
  trim?: HexColor;
}

/** Diseño simple: color y una banda superior opcional. */
interface ISocksDesign {
  base: HexColor;
  band?: HexColor;
}

interface IKitDesign {
  shirt: IShirtDesign;
  shorts?: IShortsDesign;  // presentes si el deporte los declara en `garments`
  socks?: ISocksDesign;
}

/** Equipaciones de una institución, por id de equipación del deporte. */
type IKitSet = Record<string, IKitDesign>;

interface IInstitutionIdentity {
  colors: HexColor[];      // 1..4; colors[0] es el principal
}

/** Derivado, nunca se guarda. */
interface IWebColors { bg: HexColor; fg: HexColor }
```

La institución expone:

- `identity`
- `kits`: validado contra el `IKitSpec` de su deporte (están todas las requeridas y no hay ids desconocidos).
- `webColors()`: `web_1`, a partir de `identity.colors[0]`.
- `kitWebColors(slotId)`: a partir del color dominante de esa camiseta.
- `primaryColor` / `secondaryColor`: se mantienen por compatibilidad, pasan a devolver `web_1` y quedan marcados como obsoletos.

### Guardado

Se guarda la configuración, nunca una imagen, con la convención de claves cortas de `IInstitutionData`:

```ts
interface IInstitutionData {
  // ...campos actuales
  ic?: HexColor[];                    // colores institucionales
  kt?: Record<string, IKitData>;      // equipaciones por id de equipación
}

interface IKitData {
  s: { p: ShirtPattern; b: HexColor; d?: HexColor; dm?: HexColor;
       sl: HexColor; cf: HexColor; ct: CollarType; cc: HexColor };
  sh?: { b: HexColor; t?: HexColor };
  so?: { b: HexColor; bd?: HexColor };
}
```

Reglas:

1. **Se genera una sola vez**, al crear la institución, y se guarda. Leer datos existentes nunca vuelve a generar.
2. **Sin migración de `pc`/`sc`**: se quitaron de los datos. Una institución sin `ic`/`kt` se genera por id; con `ic` y sin `kt`, se generan las equipaciones con esos colores; `kt` exige `ic`.
3. **Validación al crear y al leer**: hex válido, 1 a 4 colores institucionales, `detail` si el patrón no es `plain`, y equipaciones conformes al `IKitSpec`.
4. `ElementController` deja de llamar a `pickKitColors`.
5. **Versionado futuro por temporada**: cuando haga falta, `kt` pasa a ser un historial `{ desde: temporada, equipaciones }[]`. Hoy hay una sola entrada implícita.

## 6. Generación determinística

Semilla: `hash(institutionId)`, con una sub-semilla por equipación para que agregar una opcional no cambie las demás. RNG de `jl-utlts`, como hoy.

1. **Colores institucionales.** De la paleta ponderada. Cantidad: 1 color 40%, 2 colores 45%, 3 colores 15% (valores a calibrar).
2. **Titular.** Base = `colors[0]`. Patrón ponderado (lisa la más probable, después rayas verticales, aros, mitades, banda...). Detalle = `colors[1]` o un neutro.
3. **Alternativa.** Su dominante debe estar lejos del de la titular (ΔE ≥ umbral). Prioridad: blanco o negro, después el segundo color institucional. Casi siempre lisa.
4. **Tercera** (si el deporte la declara; 30% de probabilidad si es opcional). Color libre de la paleta, lejos de titular y alternativa.
5. **Especiales** (arquero, líbero). Paleta propia (verde, amarillo, naranja, negro, gris, rosa, lima), lejos de todas las equipaciones de campo de la institución.
6. **Cuello y puños.** Un color del kit que contraste con el cuerpo.
7. **Pantalón.** Lo más común: el segundo color del kit (titular azul con pantalón blanco) o el mismo de la camiseta. Franja lateral opcional con el color de detalle.
8. **Medias.** Igual que el pantalón o que la camiseta, con banda superior opcional.

## 7. Elección de equipaciones por partido

Función pura en `jl-sprt`, que recibe las dos instituciones y el `IKitSpec` del deporte:

```ts
selectMatchKits(spec: IKitSpec, home: IKitSet, away: IKitSet): {
  home: { field: string; special: Record<string, string> };   // id de equipación por puesto
  away: { field: string; special: Record<string, string> };
}
```

- El local usa su primera equipación de campo (titular).
- El visitante usa su titular si su dominante está lejos del dominante del local. Si no, la siguiente equipación de campo, y así.
- Cada puesto especial usa su primera equipación, salvo que choque con lo que indica `contrastWith`. En ese caso usa la siguiente.
- Choque = ΔE de los dominantes de camiseta menor al umbral. Pantalón y medias no cuentan en esta versión.

El DTO del partido incluye las equipaciones elegidas, y la página de partido deja de calcular choques.

## 8. Dónde vive cada cosa

| Paquete | Contenido |
|---|---|
| `jl-sprt-match` | `IKitSpec` de cada deporte, en su carpeta. |
| `jl-sprt` | Tipos, paleta, validación, contraste WCAG, ΔE, generador, migración de `pc`/`sc`, `selectMatchKits`, DTOs. Sin nada de dibujo. |
| `jl-sprt-app` | Componente `KitSvg` (diseño → SVG) con una plantilla por `template`, visualizador y uso de los colores web en las vistas. |

Las equipaciones son de la institución y las comparten todas sus categorías. Si más adelante cada categoría necesita las suyas, se puede agregar una sobrescritura por team.

## 9. Visualizador de kits (app)

Su función principal es **ver qué produce el generador automático**, para evaluarlo y ajustarlo. Editar a mano es secundario. Inspirado en myFPL: kit grande en el centro, las equipaciones del deporte abajo, controles a un costado y una vista de partido.

- **Ruta:** `/tests/kits`, junto a las demás páginas de prueba.
- **Deporte:** selector. Cambia la galería y la plantilla según su `IKitSpec`.
- **Generar:** semilla o id de institución, y botones "Anterior / Siguiente" para recorrer muchas instituciones generadas seguidas. Usa el mismo generador de `jl-sprt`.
- **Galería:** las equipaciones generadas que declara el deporte, con sus colores web.
- **Partido:** dos instituciones generadas con las equipaciones que elige `selectMatchKits`, indicando si hubo choque.
- **Editor (opcional):** partiendo de lo generado, cambiar prendas a mano. Camiseta (patrón, base, detalle, mangas, puños, cuello), pantalón (color y franja) y medias (color y banda), con muestras de la paleta o hex libre.
- **Exportar:** copiar el JSON del diseño, por ejemplo para fijar los colores de un club de ejemplo.
- Sin persistencia en la primera versión.

`KitSvg` dibuja el kit completo (camiseta, pantalón y medias) con regiones coloreables. Los patrones se recortan con un `clipPath` del cuerpo. Hay una plantilla de fútbol para empezar; vóley y fútbol americano la usan hasta tener la suya.

## 10. Fases

1. **Especificaciones (`jl-sprt-match`).** `IKitSpec` de los tres deportes. Versión minor.
2. **Dominio (`jl-sprt`).** Paleta, modelo, validación, contraste, ΔE, migración, generador y `selectMatchKits`, con tests. Versión minor: es aditivo y se conservan `primaryColor`/`secondaryColor`.
3. **Visualizador (`jl-sprt-app`).** `KitSvg` y `/tests/kits`. Antes de escribirlo hay que revisar la guía de la versión de Next.js instalada (`node_modules/next/dist/docs/`), porque cambia convenciones.
4. **Integración en la app.** Reemplazar los usos de `pc`/`sc` por los colores web y la página de partido por las equipaciones elegidas en el dominio.
5. **Después.** Equipaciones por temporada, plantillas propias de vóley y fútbol americano, casco en fútbol americano, escudo y número.

## 11. Decisiones pendientes

1. **Choques de pantalón y medias.** Propongo ignorarlos en esta versión. En fútbol real a veces se cambian solo las medias.
2. **Umbral de ΔE.** Valor inicial ~25, a ajustar con el visualizador.
3. **Pesos de la paleta y porcentajes de generación.** Pueden quedar como parámetros editables, como los de los motores.
