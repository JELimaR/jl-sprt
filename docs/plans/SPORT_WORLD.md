# Plan — `SportWorld` (modelo de mundo de simulación)

> Rediseño del modelo de sesión del server. Reemplaza el andamiaje de la Fase A del
> `ElementController` (`ISimulationSession` con `tournaments: Map` + `teamNames: Map`)
> por un agregado de dominio **`SportWorld`** que es dueño del estado del mundo:
> entidades (geografía + deportivas), un calendario único, y el estado de rankings
> (vigente + histórico por temporada).
>
> Documento hermano: `API_CONTROLLERS.md` (contrato del `ElementController` y DTOs).
> Esta tanda es **breaking**: se publica como `jl-sprt@3.0.0`.

---

## 0. Motivación

El andamiaje de la Fase A metió en `ISimulationSession` dos parches:
- `teamNames: Map<teamId, string>` — duplica el nombre que ya vive en la `Institution`
  del team (`team → Institution → name`). Es un mapa paralelo llenado a mano.
- `tournaments: Map<string, Tournament>` + un `ctx` suelto — modela "una sesión = unos
  torneos", que no es el modelo real.

El modelo real (aclarado con el usuario): una sesión es un **MUNDO** —geografía,
entidades deportivas (confederaciones/federaciones/instituciones), y los torneos que
se juegan en él a lo largo del tiempo—. La idea del producto es simular cada liga/copa
de ese mundo, temporada tras temporada.

---

## 1. Decisiones de modelo (CERRADAS con el usuario)

### 1.1 `SportWorld` es el dueño del estado del mundo
`SportWorld` agrega:
- **Entidades geográficas**: continentes / países / ciudades.
- **Entidades deportivas**: confederaciones / federaciones / instituciones (y sus
  teams por categoría).
- **Personas**: NO se implementan ahora. El modelo deja lugar para sumarlas (evolución
  de jugadores según entrenamiento, etc.) sin forzar nada hoy.
- **Entidad global deportiva** (FIFA / FIBA / IHF): concepto implícito, SIN clase
  concreta y sin necesidad hoy. No se agrega nada.

El `EntityController` deja de ser un singleton con estado propio: pasa a ser **la API
sobre un `SportWorld`** (crea/consulta entidades *de un mundo*). El nombre de un team
se deriva de `team → Institution → name` recorriendo las entidades del mundo; el parche
`teamNames` **se elimina**.

### 1.2 Temporada = año; tiempo lineal y secuencial
- Una **temporada ES un año** (el `year` de `JDateTime`). La temporada 1655 es el año
  1655.
- El tiempo del mundo es **lineal y monótono**: hay un único "ahora" (año + half-week).
- Las temporadas son **estrictamente secuenciales y dependientes**: no se puede simular
  1656 sin haber cerrado 1655 (ascensos/descensos, rankings finales, composición de
  ligas, evolución futura dependen del año anterior).
- NO hay temporadas activas en paralelo (sería bifurcar el tiempo; contradice la
  causalidad). Las temporadas pasadas son **historia** (snapshots); las futuras no
  existen hasta que el reloj llega.

### 1.3 Calendario ÚNICO del mundo
- Un solo `JCalendar` para todo el mundo (no uno por torneo/federación/team ni uno por
  temporada). Un solo reloj, un solo `tick()`, una sola noción de "ahora".
- Técnicamente es viable que sea **perpetuo** (multi-año): `JDateTime.absolute =
  dayAbsolute * 300 + interv` NO está atado a un año; `createFromHalfWeekOfYearAndYear`
  resuelve con año explícito. Eventos de distintos años conviven sin colisión.
- Riesgo: con millones de equipos, `_eventsMap` podría sobrecargarse. Mitigación:
  **LOD** (§1.5) + **purga de eventos resueltos** (§1.6).

### 1.4 Rankings: vigente + histórico por temporada
- **Estado vigente**: el `RankingStore` del "ahora" del mundo, que alimenta la
  temporada en curso (lo que hoy es `ctx.store`: `fr_` iniciales, `rs_`/`ini_`/`tr_`
  intermedios de la temporada que corre).
- **Histórico por temporada**: al cerrar un año, su estado consolidado (rankings
  finales de torneos `tr_` + ranking actualizado de federaciones `fr_`) queda como
  **snapshot** indexado por año, para consulta ("cómo quedó la liga en 1655"). Los
  `rs_`/`ini_` intermedios NO se promueven al histórico (son runtime).
- Para consultar temporadas anteriores, se consulta el snapshot de ese año.

### 1.5 LOD (level of detail) — POSPUESTO
> **FUERA DE ALCANCE por ahora.** El LOD (simular unos torneos "en detalle" y otros con
> menos detalle, estilo FIFA Manager) se pospone. No se diseña ni implementa en esta
> tanda.

**Corrección de un supuesto previo (importante):** se había asumido que
`JEventMatch.execute()` servía como "modo resumido" (jugar el partido de una). Eso es
**incorrecto como diseño**: `execute()` NO hace lo que se busca y, de hecho, **un evento
con duración (`JDurativeEvent`) NO debería tener `execute()`** — es un método heredado
de `JEvent` (pensado para eventos instantáneos) que en un durative no tiene semántica
sana (hoy `JDurativeEvent.execute()` solo llama a `advance()` una vez). El avance de un
durative es responsabilidad del calendario vía `start()/advance()/finish()`.

**Mejora pendiente en `jl-calendar`:** replantear la jerarquía para que `execute()` no
exista (o no sea invocable) en `JDurativeEvent`. Hasta entonces, el "modo resumido" para
LOD NO se apoya en `execute()`. Cuando se retome el LOD, se diseñará sobre un mecanismo
correcto de avance acelerado del calendario (p. ej. correr los `tick()` de un rango sin
emitir observación intermedia), no sobre `execute()`.

### 1.6 Transición de temporada = paso EXPLÍCITO (no evento del calendario)
Cerrar año N → abrir N+1 es una operación **explícita** del `SportWorld`, NO un evento
del calendario.

Se consideró y **descartó** modelarla como `Event_SeasonTransition` porque:
1. Un evento que, al ejecutarse, crea los torneos del año siguiente (que a su vez
   agendan sus eventos) mezcla "avanzar el tiempo" con "construir el futuro".
2. La transición necesita datos externos al calendario (rankings persistentes, estado
   de federaciones, reglas de ascenso/descenso, nuevos miembros). Acoplaría
   `jl-calendar` (deliberadamente agnóstico) al dominio deportivo.
3. Quedaría sujeta a la semántica de `pending`/bloqueo del `tick()`, cuando es una
   operación atómica de consolidación que se quiere controlar explícitamente.
4. Como paso explícito, el `SportWorld` decide cuándo cerrar el año y lo expone como
   operación de API observable; como evento quedaría implícito y difícil de interceptar.

**Separación de responsabilidades:** el calendario mueve el tiempo *intra-temporada*
(su fuerte: eventos deportivos con tiempo); el `SportWorld` orquesta el salto
*inter-temporada* (su fuerte: el estado persistente del mundo).

### 1.7 Breaking change
Reescribir el andamiaje de la Fase A sobre `SportWorld` cambia el contrato interno de
sesión y la forma del `EntityController`. Se publica como **`jl-sprt@3.0.0`**.

---

## 2. Modelo propuesto

```
SportWorld {                          // dueño del estado del mundo
  entities                            // geografía + deportivas (perpetuo, evoluciona año a año)
  calendar: JCalendar                 // ÚNICO; tiempo lineal; año = temporada
  currentSeason: number               // el año en curso

  rankings {
    current: RankingStore             // estado vigente (runtime de la temporada en curso)
    history: Map<year, snapshot>      // snapshots de años cerrados (consulta)
  }

  tournamentsOfCurrentSeason          // torneos del año en curso (cuelgan del tiempo actual)
  lod                                 // política de nivel de detalle (qué se simula detallado)
}
```

Operaciones del `SportWorld` (conceptuales, no firma final):

```
// avance INTRA-temporada (mueve el reloj del mundo dentro del año en curso)
tick() / runSeason()
  → corre el calendario (torneos, partidos, aplicando LOD por torneo)

// transición INTER-temporada (paso EXPLÍCITO; cierra N, abre N+1)
closeSeason()
  1. consolida rankings finales de los torneos del año N (tr_)
  2. por cada federación: updateRankings (ascensos/descensos / nuevos miembros)
  3. guarda snapshot histórico de la temporada N (RankingStore ya lo hace por season)
  4. por cada federación: createTournamentList() -> crea torneos del año N+1 y
     agenda sus eventos en el calendario del mundo
  5. currentSeason = N+1
```

Es el bucle que hoy hace `fede_inst_Example` (`for Y = 1154..1166`) a mano, formalizado
dentro del `SportWorld`.

**Taxonomía de torneos y alcance incremental:** el mundo simula torneos de tres niveles
de organizador (federación / confederación / organismo mundial) y dos tipos de
participante (clubes / selecciones). Ver **`TOURNAMENT_TAXONOMY.md`**. HOY solo es
construible el nivel **federación con clubes**, así que `closeSeason()` implementa ese
nivel; confederación y organismo mundial (de clubes) quedan como enganches documentados,
y las selecciones (teams de federación) como futuro. El método se diseña para orquestar
los tres niveles, pero por ahora recorre solo las federaciones.

### Relación con los controllers
- **`EntityController`**: API sobre `SportWorld.entities` (crear/consultar
  geografía + entidades). Deja de tener estado propio.
- **`ElementController`**: API sobre la simulación del `SportWorld` (crear torneos,
  avanzar el mundo, leer DTOs de tabla/partidos/fixture/calendario). La sesión por
  `simulationId` identifica un `SportWorld`.
- Ambos comparten el mismo `SportWorld` (resuelve el aislamiento entidades↔simulación
  que hoy no existe).

---

## 3. Impacto en el código (qué se toca)

### 3.1 Nuevo
- `SportWorld` (clase/agregado) en **`src/World/SportWorld.ts`** [HECHO, Paso 1]: dueño
  de entidades + calendario único + rankings + currentSeason.
- Snapshot histórico de rankings por temporada: el `RankingStore` **ya** provee
  historial (`getBySeason(context, season)`, `getHistory`); el "vigente + histórico" se
  cubre con un único store cuyos rankings llevan `metadata.season`. No hace falta una
  estructura separada.
- ~~Política de LOD~~ POSPUESTA (ver §1.5).

### 3.2 Modificado
- `EntityController` / `EntityHandler`: operar sobre `SportWorld.entities` en vez de
  estado singleton propio. (Enlaza con Paso 6 de `API_CONTROLLERS.md`: completar
  métodos faltantes + validación + paginación.)
- `ElementController` / `ElementHandler`: la sesión pasa a ser un `SportWorld`.
  - `createSimpleLeague` deja de fabricar `Institution`/`Town` descartables y de llenar
    `teamNames`; usa (o crea en el mundo) entidades reales. El nombre sale de la
    `Institution`.
  - Eliminar `teamNames`; el `nameOf(teamId)` resuelve `team → Institution → name`.
  - Las queries operan sobre el torneo del mundo (por `tournamentId` cuando haya varios).
- `SimulationContext`: revisar su rol. Hoy es `calendar + store + tournaments`. Con el
  `SportWorld` dueño del calendario y los rankings, el `SimulationContext` puede
  quedar como vista/pasarela del mundo hacia el motor de torneos, o absorberse en el
  `SportWorld`. Decisión de implementación (ver §4).
- `JCalendar` (en `jl-calendar`): **purga de eventos resueltos** para acotar memoria del
  calendario perpetuo. Hoy `tick()` marca `resolved`/`finished` pero NO los borra de
  `_eventsMap`. Agregar limpieza (p. ej. al cerrar temporada, o incremental). Requiere
  bump de `jl-calendar`.

### 3.3 Limpieza aprovechando el rediseño
- `JEventMatch`: quitar los `console.log` de debug y el `formatScore` marcado
  `// BORRAR` (ensucian la salida; se vieron en los logs de test). El formateo ya vive
  en `jl-sprt-match` (`formatScoreText`/`getSetBreakdown`).

### 3.4 Dependencias que leen el estado hoy (preservar o adaptar)
- **El front PUEDE rediseñarse** (decisión del usuario): no hay que preservar las
  firmas actuales de los controllers por compatibilidad con el front. Se prioriza el
  modelo correcto; el front se adapta en el Paso 8. (Esto habilita, p. ej., que
  `EntityController` cambie firmas si el modelo lo pide.)
- `teamsAssign` y los `Event_StageEnd` leen/escriben el store de runtime: deben seguir
  apuntando al `RankingStore` vigente del mundo.

---

## 4. Puntos abiertos (a decidir durante la implementación)

1. **Ubicación/forma de `SportWorld`**: ¿clase en `src/World/`? ¿Es el `ElementHandler`
   quien tiene el `Map<simulationId, SportWorld>`?
2. **Rol de `SimulationContext`**: ¿se mantiene como vista hacia el motor de torneos, o
   se absorbe en `SportWorld`? (Hoy muchos sitios dependen de `ctx.calendar`/`ctx.store`.)
3. ~~Política de LOD concreta~~ POSPUESTO (ver §1.5). Requiere primero arreglar el
   avance acelerado del calendario en `jl-calendar` (quitar `execute()` de los
   durative). No se diseña en esta tanda.
4. **Purga del calendario**: ¿incremental (al procesar) o batch (al cerrar temporada)?
   ¿`jl-calendar` expone un método de purga o se hace interno en `tick()`?
5. **Snapshot histórico**: ¿qué estructura exacta se guarda por año (solo rankings, o
   también resultados/tablas)? ¿se persiste a futuro (DB) o solo en memoria por ahora?
6. **Creación de torneos del año N+1**: ¿`Federation.createTournamentList()` como hoy,
   disparado por `closeSeason()`?

---

## 5. Plan de ejecución por pasos

> Cada paso compila + corre tests antes del siguiente. Publicación por el flujo
> acordado (bump de versión; el usuario publica; luego instalar en consumidores).
> Verificación con la suite completa de jl-sprt en cada paso.
>
> **El front PUEDE rediseñarse**: no se preservan firmas por compatibilidad con la app
> actual; se prioriza el modelo correcto y el front se adapta al final (Paso 8).

**Paso 0 — Diseño (ESTE documento).** Decisiones de modelo cerradas.

**Paso 1 — `SportWorld` esqueleto. [HECHO]** Clase agregado en `src/World/SportWorld.ts`
con entidades + calendario único + rankings + currentSeason. 7 tests; suite 239 OK.

**Paso 2 — `EntityController` sobre `SportWorld`.** Mover el estado de entidades del
singleton (`EntityHandler`) al `SportWorld` del proceso (expuesto por
`SportFactoryServer`). Completar métodos faltantes (getConfederationById,
getInstitutionById, removeConfederation, associateInstitution) + validación que lanza +
paginación (`IPaginationData { offset?, limit? }`). Las firmas pueden rediseñarse si el
modelo lo pide (el front se adapta después). (Absorbe el Paso 6 de `API_CONTROLLERS.md`.)

**Paso 3 — `ElementController` sobre `SportWorld`.** Reescribir la sesión como
`SportWorld`. Eliminar `teamNames` (nombre por `team.name`, que `A_Team` ya expone).
`createSimpleLeague` crea/usa entidades reales del mundo. Actualizar tests del controller.

**Paso 4 — Transición de temporada.** Implementar `closeSeason()` (consolidar rankings,
ascensos/descensos, snapshot histórico, crear torneos del año siguiente, avanzar
currentSeason). Formaliza el bucle de `fede_inst_Example`. Tests multi-temporada.

**Paso 5 — ~~LOD~~ POSPUESTO.** El LOD queda fuera de alcance (ver §1.5). Depende de una
mejora previa en `jl-calendar`: **quitar `execute()` de `JDurativeEvent`** (un durative
no debe tener `execute()`; su avance lo maneja el calendario con `start/advance/finish`)
y proveer un mecanismo correcto de avance acelerado. Esa mejora de `jl-calendar` se
planifica aparte; el LOD se retoma después, sobre ese mecanismo.

**Paso 6 — Purga del calendario. [REPLANTEADO / POSPUESTO]** Se descartó purgar el
calendario tal como estaba: purgar los eventos pasados rompería la navegación de la
HISTORIA (no se podría "volver atrás"). La historia debe vivir en otra capa, no en la
cola de eventos del motor. **Decisión:** la purga se hará con "historia como `eventDTO`"
(guardar cada evento procesado como dato plano antes de descartarlo del calendario).
Queda como trabajo FUTURO, no bloquea. El prerequisito que sí se hizo: el refactor
`execute()` → `advance()` en `jl-calendar` (un durative ya no tiene `execute()`; el
núcleo de todo evento es `advance()`).

**Paso 7 — Limpieza de logs + formateo de score. [HECHO]**
- Se eliminó el `formatScore //BORRAR` duplicado de `JEventMatch`.
- `A_Match.describeScore()` (jl-sprt-core): marcador legible por deporte (2 líneas
  home/away) con agregado de serie y desempate; implementado en football/volleyball/
  american-football (jl-sprt-match). Reemplaza el formateo ad-hoc.
- Logs FUERA del dominio: los eventos dejan de imprimir en `advance()` y exponen
  `describe()`. `jl-calendar` gana un hook de observación (`setEventObserver`) +
  `JEvent.describe()` abstracto. Un `attachExampleLogger(cal)` en los examples imprime
  fecha + `describe()`; la app/server/tests quedan silenciosos.
- `scoreFormat.ts` (jl-sprt-match) SE MANTIENE: alimenta los DTOs del `ElementController`
  (propósito distinto al log).
- Releases involucrados: `jl-calendar@2.3.0`, `jl-sprt-core@1.2.0`, `jl-sprt-match@1.3.0`.

**Paso 8 — Bump + publicar + migrar el front. [EN CURSO]** Migrar `jl-sprt-app` a los
DTOs del `ElementController` (ver `jl-sprt-app/docs/APP_MIGRATION.md`). Bump jl-sprt +
publicar. Verificar la app.

---

## 6. Qué queda FUERA (por ahora)
- Personas / evolución de jugadores (el modelo deja lugar, no se implementa).
- Clase concreta para la entidad global deportiva (FIFA/FIBA/IHF).
- Persistencia real a DB (el `SportWorld` se diseña serializable, pero vive en memoria
  por ahora).
- Fases B/C del `ElementController` (torneos acoplados, multi-torneo complejo) salvo lo
  que la transición de temporada ya requiera.
