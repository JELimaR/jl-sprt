# Arquitectura — capas, persistencia y modelo temporal de cambios

> Estado: **documento de arquitectura / decisiones**. No describe código a escribir
> ya; fija cómo se separan las responsabilidades entre `jl-sprt` (dominio puro),
> la capa de persistencia (SQLite) y el frontend (`jl-sprt-app`, Next.js), y cómo
> se modela el cambio de reglas de una competición a lo largo de las temporadas.

---

## 1. Capas

```
┌─────────────────────────────────────────────────────────┐
│  Frontend Next.js (jl-sprt-app/src/app, /components)     │
│  UI: páginas, construcción/visualización de torneos       │
└───────────────┬─────────────────────────────────────────┘
                │  importan queries (Server Components)
┌───────────────▼─────────────────────────────────────────┐
│  Capa de servicio (jl-sprt-app/src/lib)                  │
│   - queries.ts     consultas → IXxxData                   │
│   - sport-api.ts   hidrata el SportServerAPI (server-only)│
│   - [nuevo] db/    PERSISTENCIA SQLite (server-only)      │  ← acá va la DB
└───────────────┬─────────────────────────────────────────┘
                │  usa jl-sprt como librería
┌───────────────▼─────────────────────────────────────────┐
│  jl-sprt (dominio puro, EN MEMORIA, sin I/O)             │
│  simula, valida, produce/consume IXxxData serializables   │
└─────────────────────────────────────────────────────────┘
```

Principio rector: **`jl-sprt` es una librería de dominio pura, sin DB ni I/O.**
Es lo que la hace determinista y testeable (la suite corre sin tocar disco/red).
La persistencia vive en una capa aparte que la app hospeda.

## 2. Estado actual de `jl-sprt-app` (verificado)

- App Router. `src/app/` (home, `federations/[id]`, `confederations/[id]`,
  `institutions/[id]`), `src/components/`, `src/lib/`.
- **`src/lib/sport-api.ts`**: singleton **server-only** que inicializa
  `SportServerAPI()` de `jl-sprt` y lo hidrata UNA vez con los datos de ejemplo
  (geog + instituciones + federaciones + confederaciones + asociaciones). Vive
  mientras vive el proceso Node.
- **`src/lib/queries.ts`**: consultas que llaman a `getAPI()` y devuelven `IXxxData`
  (formato serializable de `jl-sprt`). Las páginas (Server Components) las consumen.
- **HOY NO hay DB ni persistencia**: todo son datos de ejemplo en memoria por arranque.

`sport-api.ts` es exactamente el punto donde hoy vive "el estado del mundo" y donde
se insertará la persistencia.

## 3. Persistencia (SQLite)

- **Dónde**: `jl-sprt-app/src/lib/db/` (capa de servicio, **server-only**). NO en
  `jl-sprt`.
- **Motor**: SQLite con `better-sqlite3` (síncrono, corre en el proceso Node del
  server; encaja con Server Components / server actions sin capa async extra).
- **Cuidado Next**: `better-sqlite3` es un módulo nativo de Node y NO puede
  bundlearse al cliente. `db/` debe ser server-only (o vivir en route handlers /
  server actions). Verificar contra los docs de Next de esta versión antes de
  implementar (ver `jl-sprt-app/AGENTS.md`: esta versión puede tener breaking
  changes).
- **Contrato con `jl-sprt`**: serialización. `jl-sprt` ya expone `IXxxData`
  (getData/getInterface). Falta agregar `toData()/fromData()` en los stores y
  entidades para exportar/importar el estado completo. Ese es el próximo paso
  cuando se arme la DB (hoy diferido a propósito).
- **Flujo con DB**:
  1. Al iniciar (o por request), `db/` lee de SQLite los `IXxxData` (geog,
     instituciones, federaciones, confederaciones, configs de torneo, rankings).
  2. `sport-api.ts` hidrata el `SportServerAPI` con esos datos (con los ejemplos
     como seed si la DB está vacía).
  3. Tras simular una temporada, los resultados se escriben de vuelta a SQLite.

## 4. Qué se persiste y qué NO

Precisión importante sobre qué guarda hoy el contexto:

- El `TournamentConfigStore` guarda **configs** de torneo (una por temporada por
  `idConfig`), NO objetos `Tournament` vivos (con su simulación en curso). La config
  es dato serializable; el `Tournament` es un objeto de runtime que se reconstruye.
- Los **rankings** son en gran medida **reproducibles**: no son la fuente de verdad
  última, se pueden re-derivar a partir de las configs + los resultados de los
  partidos. Persistirlos es una conveniencia/caché (evitar recomputar), no una
  necesidad estructural.

- **SÍ se persiste** (dato serializable, fuente de verdad o caché conveniente):
  - Entidades: geog, instituciones, federaciones, confederaciones (IXxxData).
  - **Configs** de torneo por temporada: el `TournamentConfigStore` ya guarda
    versiones `{season, config}` por `idConfig` (getBySeason/getHistory) → tabla
    `tournament_config(id_config, season, config_json)` con índice
    `(id_config, season)`. Es la fuente de verdad de "con qué reglas se jugó".
  - Resultados de partidos jugados (lo que NO es reproducible sin re-simular: el
    resultado concreto de cada match). De acá se re-derivan los rankings.
  - Rankings (`fr_`, `tr_`) por temporada: opcional, como CACHÉ de lo reproducible
    (el `RankingStore` ya tiene historial en memoria; volcarlo evita recomputar).
  - **El schedule de cambios futuros** (ver §5) — el concepto nuevo a formalizar.

- **NO se persiste** (efímero, se recomputa):
  - El `SimulationContext` en sí: calendario + eventos + objetos `Tournament` vivos.
    Se reconstruye a partir del estado persistido.

- **Persistencia de la temporada EN CURSO (parcial):** no se asume que siempre se
  simulen temporadas enteras de golpe. Puede persistirse estado *parcial* de la
  temporada actual (progreso, partidos ya jugados, configs ya definidas) para poder
  cerrar la app y retomar. Lo que se guarda es el mismo tipo de dato serializable
  (configs, resultados), no el objeto de simulación vivo. Es decir: la línea no es
  "solo años cerrados"; es "dato serializable (configs/resultados) sí; objetos de
  runtime (context/tournaments/calendario) no".

---

## 5. Modelo temporal de cambios de reglas (el "File")

### 5.1. Cómo funciona hoy (en `fede_inst_Example`, ad-hoc)

Dos `Map` a nivel módulo hacen de "File" (cambios pre-agendados por temporada):

- `federationFileLS: Map<season, TypeCategoryList<ILeagueSystemCreator>>` — "en la
  temporada X, el league system pasa a esta config".
- `federationFileMembers: Map<season, IInstitutionCreator[]>` — "en la temporada X,
  se suman estos miembros".

El loop anual (`for Y = 1154..1166`) consulta `federationFileLS.get(Y)` y, si hay
entrada, aplica `federation.updateLeagueSystem(new LeagueSystem(ilsc))`. Los cambios
están **pre-agendados por temporada** y se aplican al inicio de cada año.

### 5.2. Transiciones (ya modeladas en el núcleo)

Un cambio estructural de formato (ej. 8 → 10+8 equipos, o agregar una división) a
veces **no se puede aplicar de golpe**: hace falta una **temporada de transición**
puente. En el ejemplo:

- `federationFileLS.set(1161, { isTransition:false, ... })` = la config nueva
  definitiva.
- `federationFileLS.set(1160, { isTransition:true, condition: transi[0], ... })` =
  la temporada de transición, **un año antes**, con
  `transi = LeagueSystem.getLeagueSystemTransitionCondition(prev, next)`.

`getLeagueSystemTransitionCondition(prev, next)` (en `LeagueSystem.ts`) calcula las
condiciones intermedias de ascenso/descenso del año puente resolviendo el flujo
entre divisiones; lanza si el salto es demasiado grande (ratio de tamaños > 1.4). El
flag `isTransition: true` relaja en `verifyDivisionArr` la simetría normal
promote/relegate (que en una transición no se cumple a propósito).

### 5.3. Regla de dominio central + agendado dinámico relativo al año corriente

**Las reglas de clasificación y ascensos/descensos NO cambian en el año corriente**
(salvo excepción puntual). Un cambio se agenda para una temporada **futura**; si hace
falta transición, se inserta automáticamente en la temporada previa a la definitiva.

El agendado es **dinámico y relativo al año corriente Y** (el usuario lo define desde
la app en cualquier momento; el sistema conoce Y). Dos escenarios:

- **Cambio sin transición** (no cambian ascensos/descensos): el año corriente Y sigue
  con sus reglas; lo nuevo entra en vigor en **Y+1**.
- **Cambio con transición** (cambian ascensos/descensos, cambia el número/tamaño de
  divisiones): el año corriente Y intacto; **Y+1 es temporada de transición**
  (condiciones puente autogeneradas, `isTransition: true`); **Y+2 entra en vigor la
  configuración nueva definitiva**.

O sea: el usuario, parado en Y, pide "cambiar la estructura de este torneo", y el
sistema decide automáticamente si el destino es Y+1 (sin transición) o Y+1 puente +
Y+2 definitivo (con transición), sin tocar Y.

Esto impone dos capas de tiempo:
- **Config vigente**: la que rige la temporada actual (congelada).
- **Configs futuras agendadas**: con su temporada de entrada, incluyendo temporadas
  de transición autogeneradas.

### 5.4. Cómo modelarlo (propuesta)

Promover el "File" a concepto de primera clase en `jl-sprt` (hoy es Maps sueltos en
un ejemplo). Un **`LeagueSystemSchedule`** (o más general `CompetitionSchedule`) por
federación + categoría:

```
Schedule = lista ordenada de { fromSeason, leagueSystemCreator, isTransition }
```

Operación central — **programar un cambio estando en el año corriente Y**:
1. Toma la config vigente (`prev`) y la deseada (`next`).
2. Decide si hace falta transición (si cambian cantidades de divisiones o tamaños
   que rompen la simetría de ascensos/descensos). El núcleo ya existe:
   `getLeagueSystemTransitionCondition` (calcula el puente y lanza si el salto es
   inviable).
3. Resuelve las temporadas de destino **relativas a Y** (nunca toca Y):
   - sin transición → agenda `next` en `Y+1`.
   - con transición → agenda la transición (`isTransition: true`, condiciones
     calculadas) en `Y+1` y `next` definitivo en `Y+2`.
4. Todo queda agendado en el schedule, **sin tocar la temporada corriente**.

Al inicio de cada temporada, el motor consulta `schedule.getForSeason(Y)` y aplica
esa config (equivalente a `federationFileLS.get(Y)` de hoy, encapsulado).

### 5.5. Dónde vive cada pieza

- **El schedule (los "File")**: datos de dominio de la Federation (o entidad de
  configuración asociada). Vive en `jl-sprt` como concepto, serializable
  (`ILeagueSystemCreator` son datos) → se persiste en la DB
  (`schedule(federation_id, category, from_season, ls_creator_json, is_transition)`).
- **La decisión "hace falta transición"**: lógica pura de `jl-sprt` (núcleo ya en
  `getLeagueSystemTransitionCondition`; falta la capa que decide CUÁNDO insertarla
  y la agenda).
- **La aplicación por temporada**: el motor de simulación (hoy el `for` del ejemplo;
  mañana el motor de la app). El `SimulationContext` sigue siendo por temporada
  (efímero), pero ALIMENTADO por el schedule persistido.
- **El disparador del cambio**: en la app, el usuario (o una regla automática)
  define que un torneo/league system cambia a partir de la temporada N; eso invoca
  la operación de §5.4, que persiste el schedule (con la transición si corresponde).

---

## 6. Ciclo de vida de las entidades (altas, bajas, aparición/desaparición)

Además de cambiar las reglas de una competición, el mundo simulado cambia de
**composición** a lo largo del tiempo: entran y salen instituciones y federaciones.

### 6.1. Estado actual (verificado)

- Todas las entidades tienen **fecha de fundación** (`fundationDay`/`funtationDay`):
  ya se modela "cuándo nació". NO hay fecha de disolución/baja.
- Solo hay **alta** (`addMember`). No existe baja: `removeMember` no está en las
  entidades; `EntityController.removeFederation/removeConfederation` están declarados
  en la interfaz pero lanzan `"Method not implemented."`.
- Nuevas instituciones: modeladas en `fede_inst_Example` como **alta agendada** por
  temporada (`federationFileMembers: Map<season, IInstitutionCreator[]>`), aplicada
  al inicio de cada año. Nuevas federaciones: NINGÚN ejemplo todavía.

### 6.2. Lo que se quiere modelar

- **Altas agendadas** de instituciones (ya hay ejemplo) y de federaciones (falta),
  por temporada — mismo patrón "File"/schedule que las reglas (§5): un cambio de
  composición agendado para una temporada futura.
- **Bajas / desapariciones**: entidades que dejan de existir a partir de cierta
  temporada. Caso motivante: en 1985 existían las federaciones de la URSS y de
  Yugoslavia; en los 90 desaparecieron y aparecieron otras (por factores de otras
  simulaciones). Hay que poder representar que una entidad **vivió en un rango de
  temporadas** `[nacimiento, disolución)`.

### 6.3. Cómo modelarlo (propuesta)

- **Ventana de vida por entidad**: además de `fundationDay` (ya existe), agregar una
  fecha/temporada de **disolución** opcional. Una entidad es "activa" en la temporada
  Y sii `nacimiento <= Y < disolución` (o disolución indefinida). Esto vale para
  instituciones, federaciones y confederaciones.
- **Schedule de composición**: análogo al schedule de reglas (§5), pero para altas y
  bajas de miembros, agendadas por temporada (`fromSeason`). Reutiliza el mismo
  patrón "cambio pre-agendado que se aplica al inicio del año, sin tocar el corriente".
- **Bajas reales**: implementar `removeMember` en las entidades y
  `removeFederation`/`removeInstitution` en el controller (hoy `not implemented`),
  respetando integridad (qué pasa con sus torneos/rankings en curso — probablemente
  la baja recién surte efecto al fin de la temporada, como los demás cambios).
- **Persistencia**: la ventana de vida y el schedule de composición se guardan en la
  DB junto al resto del estado. El histórico (§4) permite reconstruir "quiénes
  existían en la temporada Y" para cualquier Y pasado.

> Nota: las federaciones (alta/baja) se documentan acá pero NO se implementan ahora
> (el usuario lo marcó como fuera de alcance inmediato). Las instituciones ya tienen
> el patrón de alta; la baja y la ventana de vida son el trabajo pendiente.

---

## 7. Resumen de decisiones

1. `jl-sprt` sin DB; persistencia en `jl-sprt-app/src/lib/db/` (SQLite/better-sqlite3,
   server-only).
2. `sport-api.ts` es el punto de hidratación (hoy ejemplos, mañana DB).
3. `jl-sprt` necesita ganar **serialización** (`toData`/`fromData`) como contrato con
   la DB (diferido hasta armar la DB).
4. La línea de persistencia es por TIPO de dato, no por "año cerrado vs actual": se
   persiste dato **serializable** (entidades, configs, resultados de partidos), NO
   objetos de runtime (`SimulationContext`, calendario, `Tournament` vivos). El
   contexto se reconstruye. Puede persistirse estado PARCIAL de la temporada en curso.
5. Lo que se persiste: entidades; **configs** de torneo por temporada (fuente de
   verdad de las reglas); resultados de partidos; rankings como CACHÉ (reproducibles);
   y el **schedule de cambios futuros**.
6. El "File" de cambios pre-agendados (hoy ad-hoc en el ejemplo) se formaliza como
   un **schedule** de dominio, que decide y agenda transiciones automáticamente y no
   modifica el año corriente. El agendado es relativo al año corriente Y: sin
   transición → Y+1; con transición → Y+1 puente + Y+2 en vigor.
7. La composición del mundo (altas/bajas de instituciones y federaciones) se modela
   con una **ventana de vida por entidad** (`[nacimiento, disolución)`) + un schedule
   de composición análogo al de reglas. Hoy solo hay alta + fundación; baja y ventana
   de vida son pendientes (federaciones, fuera de alcance inmediato).
