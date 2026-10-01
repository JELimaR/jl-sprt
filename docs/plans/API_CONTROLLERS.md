# Plan — API de controllers (`ElementController` + mejoras a `EntityController`)

> Objetivo: que el **frontend consuma la API server de `jl-sprt`** (vía
> `SportServerAPI` → controllers) con **datos planos (DTOs)**, en lugar de
> instanciar y orquestar clases del dominio (`Tournament`, `SimulationContext`,
> `StageGroup`, `League`, `teamsAssign`, `A_Result`, ...) a mano en la app.
>
> Caso de uso guía: la **liga simple** (`jl-sprt-app/src/lib/usecases/simpleLeague.ts`),
> que hoy arma toda la maquinaria en el front y accede a internos del dominio
> (p. ej. `match.result._teamOneScore.score`).

---

## 0. Estado actual (punto de partida)

- `IEntityController` (en `src/JSportModule/apiInterfaces.ts`): definido y
  **parcialmente** implementado en `EntityController`. Trabaja con **DTOs planos**
  de nombres abreviados (`IConfederationData = {i, n, sn, aa, hq, fd, fs, ms}`,
  etc.). Huecos actuales (lanzan "not implemented"):
  `getConfederationById`, `removeConfederation`, `getInstitutionById`,
  `associateInstitution`.
- `IElementController`: **interfaz vacía** (`export interface IElementController {}`).
  `ElementController` y `ElementHandler` son **stubs singleton** sin métodos.
- `SportFactoryServer`: singleton de proceso; `EntityController`/`ElementController`
  también son **singletons** (`.instance`).
- La app ya usa `SportServerAPI().getEntityController()` para geografía/entidades
  (ver `jl-sprt-app/src/lib/sport-api.ts`), pero para torneos arma todo a mano.

### Problema estructural a resolver antes de nada: aislamiento de simulaciones
Los controllers son **singletons de proceso**. Pero una simulación es **estado
mutable y aislado**: necesita *su* calendario y *su* store, y debe poder haber
varias en paralelo (o reiniciarse) sin pisarse. Un `ElementController` singleton
que guarde "el torneo actual" no sirve para eso.

**Decisión (CONFIRMADA):** el `ElementController` administra **sesiones**
identificadas por un `simulationId` (string). Cada operación recibe ese id.
Internamente, el controller mantiene un `Map<simulationId, Sesion>` (vía el
`ElementHandler`). El front crea una sesión, guarda el id (solo un string), y todas
sus llamadas lo referencian.

### Qué es una sesión: un MUNDO, no un torneo (CORRECCIÓN de modelo)
Replanteo tras aclaración del usuario. Una sesión **NO** es "un torneo con su
contexto". Una sesión es un **MUNDO**: geografía (continentes/países/ciudades) +
entidades (confederaciones/federaciones/instituciones) + **MUCHOS torneos** (ligas,
copas) que se juegan en ese mundo a lo largo del tiempo. La idea del producto es
simular cada liga/copa de ese mundo.

Implicancias del modelo correcto:
- `simulationId` identifica el **mundo**, no un torneo. Dentro del mundo cada torneo
  tiene su propio `tournamentId`.
- El `SimulationContext` (calendario + stores) es **compartido** por todo el mundo.
- Las lecturas de torneo se piden por `(simulationId, tournamentId)`.
- La sesión referencia **`Tournament`** (que ya conoce sus stages vía `stagesMap`),
  nunca un `StageGroup` fijo. Castear a `StageGroup` fue un error de portar literal
  `simpleLeague.ts`: ataría la sesión a "liga de un grupo" y rompe con copas
  (`StagePlayoff`) y multi-stage.
- Por eso el futuro usa DB: no se simulan 100 años ni millones de torneos en memoria
  por sesión; el mundo (entidades, configs, resultados jugados) persiste y el runtime
  de un torneo puntual se reconstruye cuando hace falta.

**Dónde faltaba modelar el mundo:** hoy el `SimulationContext` tiene calendario +
ranking store + tournament config store, pero **le falta la dimensión del mundo**
(entidades/geografía). Esas entidades viven hoy aisladas en el `EntityController`
singleton, desconectadas de las simulaciones. Conectar mundo↔entidades es un
rediseño grande (toca cómo se guardan/serializan las entidades) y se hace en fase
aparte (ver Paso intermedio).

### Paso intermedio (lo que se implementa en esta tanda)
Para no casar el diseño con "liga = mundo" ni bloquear la Fase A con el rediseño del
mundo completo:
1. La sesión referencia **`Tournament`** (no `StageGroup`); los DTOs de partidos/
   tabla se arman recorriendo `tournament.stagesMap` de forma **genérica** (manejar
   `StageGroup` y, a futuro, `StagePlayoff`).
2. La sesión queda **preparada** para contener varios torneos y la dimensión del
   mundo, pero la Fase A crea **solo** la liga simple (un torneo en el mundo).
3. El rediseño profundo del `SimulationContext` (incluir entidades/geografía del
   mundo y su relación con el `EntityController`) se planifica **aparte**.

Implicancias:
- El front trabaja con **un string + DTOs**, nunca con clases del dominio.
- Varias simulaciones en paralelo sin pisarse; se puede reiniciar una sin afectar otras.
- Limpieza de sesiones viejas (TTL): fuera de alcance por ahora.

### Preparado para DB futura (sin romper nada)
El sistema hoy maneja **clases en memoria** (`SimulationContext`, `JCalendar`,
`Ranking`, `Tournament`...). Eso NO es un problema para migrar a DB más adelante,
**siempre que el contrato de la API sea de DATOS (DTOs), no de clases**. Separación
de capas a respetar:
- **Configuración / estado persistente** (QUÉ es la simulación): entidades, configs
  de torneo (`ITournamentFromGSGData`), resultados jugados. Serializable → irá a DB.
- **Runtime / estado efímero** (el motor corriendo): `JCalendar` con sus eventos,
  `SimulationContext`. Reconstruible desde la configuración + resultados.

Con el contrato en DTOs, el día de mañana el `simulationId` deja de ser clave de un
`Map` en memoria y pasa a ser una fila/registro en DB **sin cambiar el contrato ni
el front**. Por eso "sesiones + DTOs" es justamente el paso que habilita DB. El
anti-patrón a evitar (que hoy existe) es **exponer clases del dominio** en la API
(p. ej. `A_Result` filtrándose al front): eso ataría el contrato a la implementación.

---

## 1. Principios de diseño (comunes a ambos controllers)

1. **DTOs planos de entrada/salida.** La API nunca devuelve ni recibe instancias
   del dominio (`Tournament`, `A_Result`, `Ranking`, `JDateTime`...). Solo objetos
   serializables. El front pinta datos, no manipula el modelo.
   - **Nombres LEGIBLES** (`id`, `name`, `shortName`, ...) en los DTOs de SALIDA.
     Decisión tomada: la mantenibilidad pesa más que el ahorro de bytes por abreviar
     (ese ahorro es marginal y gzip lo elimina). El control de volumen NO se hace
     con nombres cortos sino con paginación y DTOs resumen/detalle (ver abajo).
   - Esto aplica también a lo que hoy sale abreviado y se filtra al front: el
     `TeamTableItem.getInterface()` (`P`, `ps`, `pm`, `gf`, `ga`, `team`=id...) se
     expone como `IStandingRowDTO` legible. Los **configs de ENTRADA**
     (`IStageConfig`, `hwStart`, `opt`, `bombos`...) son otra cosa: son lo que el
     front ENVÍA para construir un torneo; ahí la nomenclatura del dominio puede
     quedarse (no es un DTO de lectura), salvo que se decida un input simplificado
     para casos comunes como la liga simple (ver `createSimpleLeague`).
2. **El controller orquesta; el handler guarda estado.** Igual que
   `EntityController` ↔ `EntityHandler`. El `ElementHandler` será el dueño del
   `Map<simulationId, ...>`.
3. **Nada de fugas de internos.** El acceso tipo `result._teamOneScore.score` del
   front desaparece: el DTO de partido ya trae `homeScore`/`awayScore` formateado
   y/o numérico (lo provee el deporte, ver §4 y el plan de `jl-sprt-match`).
4. **El controller NO formatea para UI.** Devuelve datos neutrales (números, kind
   de evento, ids). Las etiquetas en español, columnas de tabla, etc. quedan en el
   front (presentación). El límite: la **estructura** es de la API; el **idioma/UX**
   es del front.
5. **Control de volumen por diseño de endpoints** (no por nombres cortos). El
   universo puede ser grande: ~200 federaciones × ~150 instituciones × 5-6
   categorías ≈ cientos de miles de equipos; miles de ligas. Reglas:
   - **Paginación obligatoria** en todos los listados (`{ offset?, limit? }`),
     nunca devolver el universo entero de golpe.
   - **DTOs resumen vs. detalle**: un listado de federaciones devuelve un resumen
     ligero (`{id, name, country}`), NO la federación con sus 150 instituciones
     anidadas; el detalle se pide por id.
   - **Referencias por id, no anidar en profundidad**: devolver ids y que el front
     pida el detalle que necesita.
   - **Agregados antes que crudos**: para "1000 ligas" el front quiere un resumen o
     una tabla concreta, no las 1000 completas.
   Si un endpoint caliente concreto resulta cuello de botella medido, se optimiza
   ahí (no se diseña todo para un problema que aún no se midió).

---

## 2. `ElementController` — alcance

Cubre el ciclo de vida de una **simulación de torneo** y su lectura plana. Dividido
en fases incrementales (de lo que el front ya necesita a lo más avanzado).

### Fase A — Liga simple end-to-end (desbloquea el caso de uso actual)

Operaciones mínimas para reemplazar `simpleLeague.ts`:

```
createSimpleLeague(input): { simulationId }
  input: { sport, teams: {id?, name}[], opt: 'home'|'h&a'|'neutral', season? }
  - crea SimulationContext, siembra ranking inicial, arma el GSG de liga,
    Tournament.create + teamsAssign. Devuelve el id de la sesión.

advance(simulationId): { ... estado o eventos pendientes }
advanceToNext(simulationId)     // hasta el próximo evento
runAll(simulationId)            // corre todo (con guard)

getState(simulationId): ISimulationStateDTO
getMatches(simulationId): IMatchDTO[]
getStandings(simulationId): IStandingRowDTO[]
getCalendarEvents(simulationId): ICalendarEventDTO[]
getCurrentDate(simulationId): IDateTimeDTO
```

DTOs de salida (planos, borrador):

```
IMatchDTO = {
  id, turn, homeTeamId, homeName, awayTeamId, awayName,
  state: 'created'|'scheduled'|'playing'|'finished',
  homeScore: number, awayScore: number,     // marcador numérico comparable
  scoreText: string | null,                 // "2 - 1" (lo da el deporte)
  sets?: { home: number, away: number }[],   // deportes por sets
  dateAbsolute: number, dateLabel: string, halfWeek: number
}

IStandingRowDTO = { pos, teamId, teamName, values: Record<string, number> }
  // values = las columnas propias del deporte (P, W, D, L, gf, ga, ps, ...)

ICalendarEventDTO = {
  id, kind: string, label: string,          // kind = JEvent.kind (contrato)
  dateAbsolute, dateLabel, matchId?
}

ISimulationStateDTO = {
  standings, matches, events, currentDate: IDateTimeDTO,
  hasNextEvent, hasActiveMatches, canAdvance, finished
}
```

> Esto mueve a la librería todo lo que `simpleLeague.ts` hace a mano:
> construcción del torneo, `AdvanceAll` (reimplementado hoy en el front), armado
> de la tabla, armado de eventos de calendario y vista de partidos.

### Fase B — Torneos desde entidades / configurables
```
createTournamentFromGSG(simulationId?, data: ITournamentFromGSGData, sport): { simulationId, tournamentId }
createFederationSeason(federationId, category, season): { simulationId }
  // usa Federation.createTournamentList() para armar la temporada completa
getFinalRanking(simulationId, tournamentId): IStandingRowDTO[]
```

### Fase C — Multi-torneo / acoplados / multi-temporada
```
addCoupledTournament(simulationId, data, sport)   // torneos acoplados (confed)
applyPromotionsRelegations(simulationId, federationId) // ascensos/descensos
```

(Estas fases pueden quedar como "futuro" en el doc; el plan ejecutable es la Fase A.)

---

## 3. Dependencias en la superficie pública de `jl-sprt`

Para que la Fase A funcione **sin** que el front toque clases internas, hay que:

1. **Exportar lo necesario y dejar de exportar lo interno.** Hoy `index.ts`
   reexporta TODO `jl-sprt-core` (clases abstractas `A_Match`, `A_Result`,
   `A_Serie`, `MatchContext`, etc.). Con el `ElementController` devolviendo DTOs, el
   front ya no necesita esas clases: se pueden sacar de la API pública (dejar solo
   tipos de construcción/lectura: `IRankItem`, `ITeamCreator`, `TypeCategory`,
   `AnyTeam`, `AnySportProfile`, `AnyTeamTableItem`). Ver el análisis previo.
2. **`AdvanceAll`**: hoy no se exporta y el front lo reimplementó. Con la API, el
   avance vive en el controller (`advance`/`runAll`), así que `AdvanceAll` deja de
   necesitarse en el front. (Opcional: exportarlo igual.)
3. **Formateo de score por deporte** (en `jl-sprt-match`): cada profile/result debe
   poder dar `scoreText` y `sets` sin que nadie castee `IFootballScore`. El
   `ElementController` lo usa para armar `IMatchDTO`.
4. **`kind` de eventos**: el conjunto de kinds válidos (`JEvent.kind`) como contrato
   exportado desde `jl-calendar`/`jl-sprt`, para que `ICalendarEventDTO.kind` sea
   fiable (hoy el front mantiene su propia lista `KNOWN_EVENT_KINDS`).

---

## 4. Mejoras a `EntityController`

Independiente del `ElementController`, pero necesario para una API coherente.

1. **Completar los métodos que lanzan "not implemented":**
   - `getConfederationById(id)`, `getInstitutionById(id)` → devolver el DTO (hoy ya
     existe el patrón `getData()`).
   - `removeConfederation(id)` → quitar del handler.
   - `associateInstitution(iid, fid)` → análogo a `associateFederation` (validar que
     el town/país de la institución corresponda a la federación; agregar como
     miembro).
2. **Validación y errores consistentes** (CONFIRMADO): **lanzar** en comandos
   (`create*`/`associate*`/`remove*`) con mensaje accionable; devolver `null`/`[]`
   en queries para "no encontrado" esperable. Hoy varios `find(...)` devuelven
   `undefined` y siguen (`as Continent`), lo que explota más tarde: reemplazar por
   validación que lanza con mensaje claro.
3. **Paginación real.** `IPaginationData` está vacío y se ignora. Definir
   `{ offset?, limit? }` y aplicarlo en `getFederations`/`getInstitutions`
   (necesario por el volumen: cientos de miles de equipos posibles).
4. **Nombres de DTO de entidades.** Los DTOs de entidad actuales usan abreviados
   (`i/n/sn/...`) y la app ya los consume. Para esta tanda **NO se migran** (evitar
   romper el front); los DTOs NUEVOS (`ElementController`) nacen legibles. Una
   migración/alias de los abreviados de entidad queda como item futuro, no bloquea.

---

## 5. Plan de ejecución por pasos

> Cada paso compila + corre tests antes del siguiente. Publicación por el flujo
> acordado (bump de versión; el usuario publica; luego instalar en consumidores).

**Paso 0 — Decisiones de diseño: CONFIRMADAS** (ver §7). Resumen:
- sesiones por `simulationId`; contrato en DTOs para habilitar DB futura;
- DTOs de salida legibles; volumen por paginación + resumen/detalle;
- errores: lanzar en comandos, null/[] en queries;
- formateo de score en `jl-sprt-match`;
- alcance: Fase A del `ElementController` + mejoras de `EntityController`.

**Paso 1 — Contrato.** Escribir `IElementController` + los DTOs (`IMatchDTO`,
`IStandingRowDTO`, `ICalendarEventDTO`, `ISimulationStateDTO`, `IDateTimeDTO`,
inputs de `createSimpleLeague`) en `apiInterfaces.ts` (o un `elementInterfaces.ts`
aparte). Solo tipos; sin implementación.

**Paso 2 — Dependencias en `jl-sprt-match`.** Agregar formateo de score por deporte
(contrato `scoreText`/`sets`). Bump + publicar match.

**Paso 3 — `ElementHandler`.** Estado de sesiones: `Map<simulationId,
{ ctx: SimulationContext, tournament, stage, teamNames }>`. Métodos de bajo nivel.

**Paso 4 — `ElementController` Fase A. [HECHO]** Implementado `createSimpleLeague`,
`advance`/`runAll`/`dispose`, `getState`/`getFixture`/`getMatches`/`getMatch`/
`getStandings`/`getCalendarEvents`/`getCurrentDate`. Portada la lógica de
`simpleLeague.ts`. 21 tests del controller; suite completa de jl-sprt: 232 tests OK.

> **Extensión fixture estructural (opción A).** Se agregó el concepto de FIXTURE:
> los partidos que VAN a ocurrir (half-week + emparejamiento), conocidos desde la
> creación del torneo, antes de que exista el Match concreto (que se materializa en
> el draw durante el avance). Método abstracto `getFixture(): IFixtureSlot[]` en
> `BaseStage` y `Stage`, implementado por `League` (round-robin), `StageGroup`
> (concatena grupos), `SingleElimination` (bracket; rondas N>1 referencian al ganador
> de series previas) y `StagePlayoff` (delega). Tipos del dominio en
> `Tournament/Stage/Fixture.ts`; DTOs `IFixtureSlotDTO`/`FixtureParticipantRefDTO` y
> query `getFixture(simulationId)` en el contrato. Un slot nace como `seed`
> (posición) y se completa a `team` + `matchId` cuando el Match se materializa.

**Paso 5 — Limpiar exports de `jl-sprt`. [HECHO]** Se quitaron del `index.ts` las
clases abstractas internas de core (`A_Match`, `A_MatchPlay`, `A_Result`, `A_Serie`,
`A_Team`, `A_TeamRoster`, `A_TeamTableItem`, `Person`) y sus tipos de implementación
(`IMatchCreationInfo`, `IResultInfo`, `MatchContext`, `TMatchScore`, etc.), que el
front ya no usa (consume DTOs). Se preservó la superficie de construcción/lectura
(`AnyMatch`, `AnyTeam`, `AnySportProfile`, `AnyTeamTableItem`, `ITeamCreator`,
`CATEGORIES`, `getCategoryList`, `arr2`, `TypeBaseStageOption`, `TypeCategory`,
`TypeCategoryList`). Bump jl-sprt: **2.1.2 → 2.2.0**. (Core no cambió en esta tanda.)
Pendiente: publicar (flujo acordado) e instalar en el front.

**Paso 6 — Completar `EntityController`.** Métodos faltantes + validación +
paginación.

**Paso 7 — Migrar el front.** Reescribir `simpleLeague.ts` para que use
`getElementController()` y DTOs planos. Eliminar del front: la reimplementación de
`AdvanceAll`, el acceso a `_teamOneScore.score`, los adapters que castean score, y
(si se movió a jl-calendar) las utilidades de `calendarModel.ts`. Instalar las
nuevas versiones y verificar la app.

---

## 6. Qué queda FUERA (por ahora)
- Persistencia de simulaciones (hoy viven en memoria del proceso del server).
- Concurrencia real / limpieza de sesiones viejas (TTL): se puede sumar luego.
- Fases B y C del `ElementController` (torneos desde federación, acoplados,
  multi-temporada): se dejan planteadas pero no se implementan en esta tanda.

---

## 7. Decisiones (CERRADAS)
1. **Sesiones por `simulationId`**: sí. El controller administra `Map<simulationId,
   Simulacion>`; el front maneja solo el id + DTOs.
2. **DTOs de salida legibles** (`id/name/...`), incluyendo la traducción del
   `TeamTableItem.getInterface()` abreviado a `IStandingRowDTO`. El volumen se
   controla con paginación y DTOs resumen/detalle, no con nombres cortos. Los DTOs
   de entidad abreviados existentes NO se migran en esta tanda.
3. **Errores**: lanzar en comandos (con mensaje accionable, para analizar bugs del
   lado server); `null`/`[]` en queries de "no encontrado" esperable.
4. **Formateo de score en `jl-sprt-match`**: sí (elimina el acceso a
   `_teamOneScore.score` del front).
5. **Alcance de esta tanda**: Fase A del `ElementController` + mejoras de
   `EntityController`. Fases B y C quedan planteadas, no se implementan.
6. **Preparación para DB**: el contrato se define en DTOs (no clases), de modo que
   migrar el backend de sesiones (memoria → DB) no rompa el contrato ni el front.
