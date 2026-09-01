# Validaciones de runtime — Events, dependencias y el módulo `teamsAssign`

> Objetivo: al **crear** un torneo (o un conjunto de torneos acoplados), poder
> verificar por adelantado todos los problemas que hoy solo explotan **en tiempo de
> ejecución** (al avanzar el calendario). Esto es la base para armar torneos de forma
> gráfica en el frontend y validar en tiempo real, sin llegar a un `throw` opaco a
> mitad de la simulación.
>
> Este documento tiene tres partes:
> 1. Inventario de **Events** y el orden en que se disparan.
> 2. Catálogo de **modos de fallo en runtime** (qué lanza, desde dónde, bajo qué
>    condición) y qué validación previa lo evitaría.
> 3. Diseño propuesto del módulo **`teamsAssign`** que resuelve la dependencia
>    temporal (asignación de teams que dependen del fin de un stage).

---

## 0. Modelo mental: dos fases (construcción vs simulación)

El sistema tiene una separación limpia que hay que tener presente para entender
**por qué** los errores aparecen tan tarde:

- **Tiempo de construcción** (`Tournament.create` → `Phase` → `Stage` constructores):
  se arma la estructura del torneo y se **agendan** eventos en el `JCalendar`
  compartido. No se juega nada todavía. Inmediatamente después, el caller corre
  `asignarTeams2(tournament, ctx)` para resolver el ranking inicial (`ini_<id>`)
  leyendo del store.
- **Tiempo de simulación** (avanzar el calendario): los eventos agendados se
  **disparan** en orden cronológico, se juegan los partidos y —clave— se escriben en
  el store los rankings de salida de cada stage (`rs_<stageId>`) a medida que
  terminan.

Las dos dependencias que atraviesan todo van en `SimulationContext`
(`src/Tournament/SimulationContext.ts`): `calendar: JCalendar` y `store: RankingStore`.

**La raíz de casi todos los problemas**: hay consumidores de rankings que corren en
tiempo de construcción / inicio de stage, y productores de esos mismos rankings que
solo corren durante la simulación. No hay hoy ningún mecanismo que difiera la
resolución hasta que el productor haya terminado.

---

## 1. Inventario de Events

Todos extienden `JEvent` de `jl-calendar` e implementan `execute()`. El calendario
los dispara en orden de datetime. El loop driver es del estilo:

```ts
while (cal.getNextEvents().events.length !== 0) {
  cal.now = dt;
  events.forEach(e => e.execute());
}
```
(ver `src/__tests__/integration/season.test.ts`).

Orden en que se disparan **para un stage dado**:

| # | Evento | Archivo | Cuándo se agenda | Qué hace al `execute()` | Depende de |
|---|--------|---------|------------------|--------------------------|------------|
| 1 | `Event_StageStart` | `src/Tournament/Stage/Event_StageStart.ts` | En el `Stage` constructor, en `hwStart` ('start') | `getParticipants()` lee `config.qualifyConditions` y para cada `qc` hace `store.get(qc.rankId)`; luego `stage.start(rankTable, cal)` que sortea y crea los BaseStage | Que los `rankId` (`ini_`, `rs_`, `tr_`) ya existan en el store |
| 2 | `Event_ScheduleOfTurnMatches` (grupos) | `src/Tournament/Stage/StageGroup/League/Event_ScheduleOfTurnMatches.ts` | Al crearse la League/Turn (dentro de `stage.start`) | Agenda los `JEventMatch` concretos del turno (`match.schedule(dt)` + `cal.addEvent(...)`) | El stage ya arrancó |
| 2'| `Event_ScheduleOfRoundMatches` (playoff) | `src/Tournament/Stage/StagePlayoff/SingleElimination/Event_ScheduleOfRoundMatches.ts` | Al crearse la Round | Agenda los `JEventMatch` de la ronda | El stage ya arrancó |
| 3 | `Event_RoundCreationAndTeamsDraw` (playoff) | `.../SingleElimination/Event_RoundCreationAndTeamsDraw.ts` | Una por ronda (agendadas en `SingleElmination.createChildren`) | Crea la ronda y sortea los teams que avanzaron (`getLastRoundWinners` → `teamsSortForDraw`) | Que la ronda previa haya terminado |
| 4 | `JEventMatch` | `src/JSportModule/Match/EventMatch.ts` | Por cada partido (por los eventos 2 / 2') | `match.start()` y `while (state !== 'finished') match.advance()`. Puebla resultados → hace que `BaseStage.isFinished` llegue a `true` | Los teams ya asignados a la serie/turno |
| 5 | `Event_StageEnd` | `src/Tournament/Stage/Event_StageEnd.ts` | En el `Stage` constructor, en `hwEnd` ('end', interval 299 = último del half-week) | Asegura `stage.isFinished` (si no, lanza); calcula `stage.getRelativeRank()` y hace `store.set(rs_<stageId>, ranking)` | Que TODOS los `JEventMatch` del stage ya se hayan disparado |

`Event_StageStart` y `Event_StageEnd` se crean y agendan juntos en el `Stage`
constructor (`src/Tournament/Stage/Stage.ts`, al final del constructor).

**Punto clave**: `Event_StageEnd` es **el único** que escribe `rs_<stageId>` en el
store. Todo lo que consume `rs_<...>` (otro stage, otro torneo) depende de que ese
evento ya se haya disparado.

### Productores de contexto en el store (quién escribe qué, y cuándo)

| Contexto | Lo produce | Cuándo |
|----------|-----------|--------|
| `fr_<...>` (federación) | `Federation` (`getRanking` → `Ranking.fromRankItemArr`) | Se siembra **antes** de crear los torneos. Disponible en construcción |
| `ini_<tournamentId>` | `asignarTeams2` | En construcción, justo después de `Tournament.create` |
| `rs_<stageId>` | `Event_StageEnd.execute()` | En simulación, **solo tras terminar los partidos del stage** |
| `pr_<phaseId>` | `Phase.getRelativeRank()` | En simulación, tras terminar la fase |
| `tr_<tournamentId>` | `Tournament.getRelativeRank()` | En simulación, tras terminar el torneo |

---

## 2. Catálogo de modos de fallo en runtime

Cada fila es un `throw` real que hoy puede aparecer a mitad de la simulación. La
columna "Validación previa" indica qué se debería chequear **al crear** el torneo
para que no llegue nunca a dispararse.

| # | Dónde lanza | Condición | Mensaje | Validación previa que lo evita |
|---|-------------|-----------|---------|-------------------------------|
| F1 | `asignarTeams2.ts:30` | Un `igri.origin` del qualyRankList no está en el store al construir | `throw new Error('')` (vacío, sin diagnóstico) | Resolubilidad de orígenes: todo `origin` `fr_`/`rs_`/`tr_` debe existir ahora, o estar marcado como **diferido** (ver §3) |
| F2 | `Event_StageStart.ts:40` | Un `qc.rankId` de `qualifyConditions` no está en el store al iniciar el stage | `No existe ranking: <rankId>` | Dependencia temporal: `hwEnd` del stage productor de `rankId` < `hwStart` de este stage (en el calendario, no solo en el config) |
| F3 | `Event_StageStart.ts:43` | `ranking.size < qc.maxRankPos` | `El ranking es X y se necesitan Y` | El source produce suficientes posiciones (ya lo chequea `verifyTournamentConfig` para orígenes intra-torneo; falta cross-tournament) |
| F4 | `Event_StageStart.ts:60-63` | Teams repetidos entrando al stage | `en Event_StageStart.getParticipants` | Que los rank groups fuente no se solapen (mismo team en dos `qualifyConditions`) |
| F5 | `Event_StageEnd.ts:28` | El evento de fin se dispara antes de que terminen los matches | `la stage X no está terminada` | Que `hwEnd` sea posterior a la última `hwOfMatch` (ya lo chequea `Stage.constructor`, pero solo intra-stage) |
| F6 | `Phase.ts:51` | Falta un sourceRanking al armar el ranking de fase | `No hay sourceRanking` | Igual que F2, a nivel fase |
| F7 | `RankingStore` (`set`) | Se intenta guardar un ranking sin equipos ("no bloqueado") | `Solo se pueden guardar rankings bloqueados` | Que todo ranking que se guarde tenga sus teams resueltos |

### Modo de fallo transversal: **dependencia temporal no validada**

Es la causa de F1, F2, F6. Hoy:

- `verifyTournamentConfig` ordena **fases** en el tiempo dentro de UN torneo
  (lanza si `prevP.hwEnd > nextP.hwStart`) y chequea el **tamaño** del source
  intra-torneo — pero **no** que el stage productor **termine** (en half-weeks de
  calendario) antes de que arranque el consumidor.
- `verifyPhaseConfig` prohíbe dependencias **intra-fase** (un stage no puede tomar
  como fuente a otro de la misma fase) pero no valida el orden temporal real entre
  fases más allá de que no se solapen.
- **No existe ninguna validación cross-tournament.** Si el torneo B referencia
  `rs_<stageDeA>` o `tr_<A>`, nada garantiza que A se construya y simule primero.
  Es exactamente el problema de `COUPLED_TOURNAMENTS.md`.

---

## 3. Checklist de validaciones al crear un torneo

Agrupadas por nivel. Las marcadas ✅ ya existen; las ⬜ faltan (son el trabajo
pendiente para "validar en tiempo real" desde el frontend).

### Nivel Stage (`verifyStageConfig`, `Stage.constructor`, node-level)
- ✅ `hwStart < hwEnd`.
- ✅ Cada `hwOfMatch` dentro de `[hwStart, hwEnd]` y posterior a su `hwOfSchedule`.
- ✅ No hay `hwOfMatch` repetidas.
- ✅ Suma de clasificados (`qualifyConditions`) == suma de participantes de bombos.
- ✅ Tamaño de generic rank == tamaño del source rank.
- ✅ Node: participantes divisibles por `2^rounds` (playoff); 3..20 por grupo;
  `maxNumberRound` respetado.

### Nivel Fase (`verifyPhaseConfig`)
- ✅ Los stages caben dentro de `[hwStart, hwEnd]` de la fase.
- ✅ Prohibido: un stage que dependa de otro de la **misma** fase.

### Nivel Torneo (`verifyTournamentConfig`, `verifyQualyRulesConditions`)
- ✅ Las fases caben dentro de las fechas del torneo.
- ✅ Fases estrictamente ordenadas en el tiempo (`prevP.hwEnd < nextP.hwStart`).
- ✅ Para orígenes intra-torneo: el source produce suficientes posiciones.
- ✅ Los cortes del ranking final son rangos válidos y de rank groups completos.
- ⬜ **Orden temporal fuente→consumidor**: para cada `qualifyConditions.rankId`
  del tipo `rs_<stageX>`, el `hwEnd` de `stageX` debe ser < `hwStart` del stage que
  lo consume. (Evita F2/F6.)
- ⬜ **No solapamiento de teams**: dos `qualifyConditions` de un mismo stage no
  pueden mapear al mismo team. (Evita F4.)

### Nivel multi-torneo / acoplamiento (⬜ TODO — hoy inexistente)
- ⬜ **Grafo de dependencias entre torneos**: construir un DAG donde A→B si el
  qualyRankList de B (o algún `qualifyConditions`) referencia `rs_`/`tr_` de A.
- ⬜ **Sin ciclos** en ese DAG.
- ⬜ **Orden de construcción/simulación** = topological sort del DAG. Nadie se
  construye/asigna hasta que sus dependencias estén simuladas.
- ⬜ **Alineación temporal cross-tournament**: el `hwEnd` del stage/torneo productor
  < `hwStart` del stage consumidor en el calendario compartido. (Evita F1/F2.)
- ⬜ **Resolubilidad de orígenes** al momento exacto en que se van a leer (no antes).

### Nivel semántico / reglas de negocio (⬜ más adelante, ámbito confederación)
- ⬜ Un mismo equipo no debería entrar a dos torneos acoplados por la misma vía
  (ej.: si los 2 mejores de la federación F van al torneo principal, que no
  reaparezcan en el secundario).
- ⬜ Coherencia de cupos por federación entre torneos de una misma confederación.

---

## 4. Módulo propuesto: `teamsAssign`

### El problema concreto que resuelve

`asignarTeams2` (`src/Tournament/asignarTeams2.ts`) resuelve el ranking inicial
**completo** en tiempo de construcción: para cada `{origin, pos}` hace
`store.get(origin)` y si falta, lanza (F1). Esto funciona cuando todos los orígenes
son `fr_` (federaciones, sembradas antes). **Falla** cuando algún origen es
`rs_<stageX>` / `tr_<Y>` de un stage/torneo que aún no se simuló.

El caso real (de `COUPLED_TOURNAMENTS.md`): el torneo B arranca con 40 equipos, 8 de
los cuales son "los 3ros de la fase de grupos de A" (`origin: rs_<grupoA>, pos 17..24`).
Al crear B, `rs_<grupoA>` **no existe** todavía → `throw` inmediato.

**Observación importante**: el único origen que genera esta dependencia diferida es
**el fin de un stage** (`rs_`) o de un torneo (`tr_`, que a su vez depende del fin de
su última fase). No hay otras fuentes de indeterminación temporal. Por eso el módulo
puede resolver el problema atacando un solo tipo de dependencia: "esperar a que un
contexto exista en el store".

### Responsabilidad de `teamsAssign`

Un helper/store que:

1. **Separa orígenes resolubles de diferidos** al momento de crear el torneo.
   - Resoluble: `store.get(origin)` ya devuelve algo (típicamente `fr_`).
   - Diferido: el origen es `rs_`/`tr_` y aún no está en el store.
2. **Asigna de inmediato** los teams de los orígenes resolubles (arma el `ini_<id>`
   parcial, con los "huecos" de los diferidos claramente marcados).
3. **Registra una suscripción** por cada origen diferido: "cuando el contexto
   `rs_<stageX>` se escriba en el store, resolvé estos `{pos}` y completá el
   `ini_<id>`".
4. **Se engancha en el punto donde el contexto se produce**: `Event_StageEnd.execute`
   hace `store.set(rs_<...>, ranking)`. Ese `set` debe notificar a `teamsAssign` (o
   `teamsAssign` observa el store) para disparar las resoluciones pendientes.

### Forma posible (a discutir antes de implementar)

Dos alternativas de enganche:

- **A) Store observable**: `RankingStore.set(context, ranking)` emite un evento
  `onSet(context)`. `teamsAssign` se suscribe y resuelve los pendientes de ese
  contexto. Menos acoplamiento con los Events; el store se vuelve el punto único.
- **B) Evento de asignación diferida**: `teamsAssign` agenda en el calendario un
  `Event_DeferredTeamsAssign` en el `hwEnd` del stage productor (o justo después),
  que corre la resolución. Encaja con la arquitectura actual basada en eventos, pero
  requiere conocer el `hwEnd` del productor al crear el torneo consumidor.

En ambos casos hace falta **antes** la validación de §3 (nivel multi-torneo): sin el
DAG de dependencias y su orden topológico, `teamsAssign` no sabe a quién esperar ni
puede detectar ciclos.

### Estado de bloqueo (por qué B no es ejecutable hoy)

- `asignarTeams2` no tolera orígenes diferidos (F1).
- No hay validación cross-tournament ni orden de construcción/simulación.
- El `ReOrderStageNode` (necesario para el sembrado de los entrantes en el cruce)
  sigue **comentado a propósito** en `GSGCreators.createStage` (`case 'reOrder'`),
  porque habilitarlo sin resolver lo anterior no tiene sentido.

`teamsAssign` + las validaciones de §3 (multi-torneo) son, juntos, lo que
desbloquea los torneos acoplados descritos en `COUPLED_TOURNAMENTS.md`.

---

## 5. Referencias de código

- Eventos: `src/Tournament/Stage/Event_StageStart.ts`, `.../Event_StageEnd.ts`,
  `src/JSportModule/Match/EventMatch.ts`,
  `.../StageGroup/League/Event_ScheduleOfTurnMatches.ts`,
  `.../StagePlayoff/SingleElimination/Event_ScheduleOfRoundMatches.ts`,
  `.../SingleElimination/Event_RoundCreationAndTeamsDraw.ts`.
- Agenda de eventos: `src/Tournament/Stage/Stage.ts` (constructor).
- Asignación: `src/Tournament/asignarTeams2.ts`.
- Cadena de creación: `src/JSportModule/GeneralStageGraph/tournamentFromGSG.ts`,
  `src/Tournament/Tournament.ts`, `src/Tournament/Stage/Phase.ts`.
- Validaciones actuales: `src/JSportModule/data/ConfigVerify/verifyStageConfig.ts`,
  `.../verifyPhaseConfig.ts`, `.../verifyTournamentConfig.ts`,
  `.../verifyQualyRulesConditions.ts`, `.../verifyBaseStageConfig.ts`.
- Store: `src/JSportModule/Ranking/RankingStore.ts`,
  `src/Tournament/SimulationContext.ts`.
- Problema acoplamiento (relacionado): `docs/plans/COUPLED_TOURNAMENTS.md`.

---

## 6. Plan de implementación

### Ya implementado (fáciles, seguros)

- **F1 con diagnóstico** — `asignarTeams2` ya no lanza `Error('')` vacío. Ahora
  nombra el origen faltante, su `pos`, el torneo, distingue si es un origen diferido
  (`rs_`/`tr_`) y lista los contextos disponibles en el store.
  (`src/Tournament/asignarTeams2.ts`.)
- **Orden temporal fuente→consumidor intra-torneo** — `verifyTournamentConfig`
  valida ahora que, para cada `qualifyConditions.rankId` de tipo `rs_<stageX>` cuyo
  productor esté dentro del mismo torneo, `sourceStage.hwEnd < consumingStage.hwStart`.
  Evita F2/F6 dentro de un torneo. (`.../ConfigVerify/verifyTournamentConfig.ts`.)
- **§7 registro de configs** — `TournamentConfigStore` (análogo al `RankingStore`)
  integrado en `SimulationContext.tournaments`; cada torneo se registra en
  `Tournament.create`. (`src/Tournament/TournamentConfigStore.ts`.)
- **Fase A — validación cross-tournament** — `verifyCoupledTournaments` +
  `resolveTournamentBuildOrder` (ver detalle abajo).

Todos los cambios pasan `tsc --noEmit` limpio y la suite completa en verde.

### Implementado — Fase A: DAG de dependencias entre torneos (validación)

> **Estado: hecho.** `verifyCoupledTournaments(configs)` y `resolveTournamentBuildOrder(configs)`
> en `src/JSportModule/data/ConfigVerify/verifyCoupledTournaments.ts`. Reciben el conjunto
> de `ITournamentConfig[]`; arman el índice `stageId -> torneo` y `tournamentId -> torneo`,
> extraen las dependencias cross-tournament de las `qualifyConditions` (fuentes `rs_`/`tr_`
> de OTRO torneo del conjunto), construyen el DAG, detectan ciclos (DFS con colores,
> reportando la ruta), derivan el orden topológico (productores primero) y validan la
> alineación temporal (la fuente debe estar disponible antes de que arranque el stage
> consumidor). Tests: `.../ConfigVerify/__tests__/verifyCoupledTournaments.test.ts` (9).
> Nota: la extracción de dependencias se hace desde las `qualifyConditions` de las stages
> (que es donde el GSG expresa una entrada `rs_<otroTorneo>`), no desde el `qualyRankList`
> del InitialNode; el registro (§7) alimenta esto en runtime, pero la función también acepta
> una lista suelta de configs.

Objetivo (original): detectar en construcción (no en runtime) los problemas cross-tournament.

> **De dónde salen las stages "del otro torneo" (importante).** La validación
> intra-torneo ya implementada (`verifyTournamentConfig`) resuelve `sourceStage` con
> `getStagesOfTournament(config).find(...)`, que SOLO mira las stages del **mismo**
> `ITournamentConfig`. Si la fuente (`rs_<stageX>`) pertenece a **otro** torneo,
> `.find` devuelve `undefined` y el check no aplica — a propósito: `verifyTournamentConfig`
> recibe un único config y no tiene forma de ver el otro torneo.
>
> Por eso lo cross-tournament NO puede vivir en `verifyTournamentConfig`. Necesita ver
> **el conjunto de configs de todos los torneos acoplados** a la vez. Hoy esa lista se
> arma a mano en los ejemplos (p. ej. `federation.createTournamentList()`) y no hay un
> lugar único donde vivan. El prerrequisito de esta fase es un **registro de configs
> en memoria** (ver §7): análogo al `RankingStore` pero para `ITournamentConfig`. Con
> ese registro, la validación recorre TODOS los configs guardados y puede mapear
> `rs_<stageX>` → el torneo que contiene a `stageX`, aunque lo consuma otro torneo.

1. **Índice global stage→torneo**: recorrer TODOS los configs del registro (§7) y armar
   un mapa `idConfig(stage) -> tournamentConfig` (y `idConfig(tournament) -> tournamentConfig`
   para orígenes `tr_`). Este índice es lo que reemplaza al `find` intra-config del
   check actual: permite ubicar la fuente aunque esté en otro torneo.
2. **Extraer dependencias de cada torneo**: recorrer `getStagesOfTournament(config)`
   + el `qualyRankList` del `InitialNode`, juntar todos los `origin`/`rankId` de tipo
   `rs_<...>` y `tr_<...>`, y usar el índice del paso 1 para clasificar cada fuente
   como intra-torneo (ya cubierta) o de otro torneo (dependencia cross).
3. **Construir el DAG** sobre el conjunto de torneos: nodo = torneo; arista A→B si B
   depende de un `rs_`/`tr_` producido por A.
4. **Detección de ciclos** (DFS con marca temporal / colores). Si hay ciclo → error
   con la lista de torneos involucrados.
5. **Orden topológico** = orden en que hay que construir + simular. Exponerlo como
   helper (ej. `resolveTournamentBuildOrder(configs): ITournamentConfig[]`).
6. **Alineación temporal cross-tournament**: para cada arista A→B, chequear que el
   `hwEnd` del stage/torneo productor en A < `hwStart` del stage consumidor en B
   (mismo calendario). Reusa la misma lógica del check intra-torneo ya hecho.
7. **Tests**: un caso acoplado válido (A antes que B, temporalmente coherente), uno
   con ciclo, uno con desalineación temporal.

Riesgo: bajo. Es todo análisis de config, sin tocar runtime. Encaja como un nuevo
`verifyCoupledTournaments(configs)` en `ConfigVerify`, alimentado por el registro (§7).

### Pendiente — Fase B: módulo `teamsAssign` (resolución diferida)

Depende de la Fase A (necesita saber a quién esperar y en qué orden).

1. **`RankingStore` observable**: agregar `onSet(context, listener)` /
   `subscribe(context, cb)` que se dispare dentro de `set(context, ranking)`. Es el
   punto único donde nace un `rs_`/`tr_`. (Opción A del §4, favorecida porque el
   store ya centraliza y ya tiene `has()`/`_history`.)
2. **`teamsAssign(tournament, ctx)`** (reemplaza/envuelve a `asignarTeams2`):
   - Particiona los `{origin, pos}` en **resolubles** (ya en store) y **diferidos**.
   - Asigna los resolubles y arma el `ini_<id>` parcial con huecos marcados.
   - Por cada origen diferido, `ctx.store.subscribe(origin, () => resolver esos pos)`.
     Cuando el `Event_StageEnd` del productor haga `store.set(rs_<...>)`, se dispara
     la resolución y se completa el `ini_<id>`.
3. **Bloqueo/consistencia**: el `ini_<id>` no queda "bloqueado" (poblado) hasta que
   todos sus huecos se resuelvan; `Event_StageStart` del primer stage de B debe
   estar agendado DESPUÉS del `hwEnd` del productor (garantizado por Fase A §5), así
   que al dispararse ya estará completo.
4. **Habilitar `reOrder`**: recién con A+B resueltos tiene sentido descomentar el
   `case 'reOrder'` en `GSGCreators.createStage` y volver ejecutable el Torneo B de
   `COUPLED_TOURNAMENTS.md`.
5. **Tests**: dos torneos acoplados end-to-end (el escenario A→B de
   `confederationExample`), verificando que B se asigna y corre tras terminar A.

Riesgo: medio/alto. Toca el store (transversal) y el momento de asignación. Hacerlo
detrás de la Fase A y con tests de integración dedicados.

### Pendiente — Fase C: reglas semánticas (confederación)

Estado: **probablemente fuera de alcance por ahora.** No bloquea nada de lo anterior.

Son reglas de DOMINIO, heterogéneas y específicas por competición, no validaciones
mecánicas del grafo. No hay un único "validador" que las cubra; cada una vive en un
ámbito distinto (federación, confederación, formato del torneo) y muchas tienen
excepciones. Ejemplos del rango de dificultad:

- **Simple-ish**: que un mismo equipo no entre a dos torneos acoplados por la misma
  vía; que no se salteen posiciones al asignar cupos.
- **Media**: cupos por federación/confederación con coherencia de plazas.
- **Compleja / con excepciones**:
  - Un cupo puede corresponder al **ganador de una cup** de federación, aunque ese
    equipo no esté bien posicionado en el ranking de la federación. El enrutamiento
    actual es por ranking/orden, no por "identidad de cómo clasificó".
  - En un mundial, **no** puede haber dos federaciones de una misma confederación en
    el mismo grupo — pero eso depende de los bombos, y admite **excepciones por
    imposibilidad** (cuando no hay forma de evitarlo).

Por su heterogeneidad y sus excepciones, no se implementa como parte de este plan. Se
abordará caso por caso, en el ámbito que corresponda, cuando haya un requerimiento
concreto. Queda documentado acá solo para registrar que existe y por qué se posterga.

---

## 7. Prerrequisito transversal: registro de tournament configs en memoria

Hoy los `ITournamentConfig` (y los `ITournamentFromGSGData` que los originan) no
viven en ningún lado común: cada ejemplo arma una lista suelta a mano y llama
`Tournament.create` + `asignarTeams2` uno por uno. No hay un "lugar único" donde
consultar todos los torneos de una simulación.

La pieza que falta es un **registro de configs**, análogo al `RankingStore` pero para
torneos. La simetría es directa:

| | `RankingStore` (existe) | `TournamentConfigStore` (falta) |
|---|---|---|
| Guarda | `Ranking` por `context` (`rs_`, `tr_`, `fr_`, `ini_`) | `ITournamentConfig` (o `ITournamentFromGSGData`) por `idConfig` |
| Rol | "qué resultado produjo cada stage/torneo" | "qué torneos existen y cómo se relacionan" |
| API | `set`/`get`/`has`/`keys`/`forEach`/`getHistory` | `set`/`get`/`has`/`keys`/`forEach` + índices derivados |

### Por qué resuelve lo que veníamos discutiendo

- **La duda del `sourceStage`**: el check intra-torneo resuelve la fuente con
  `getStagesOfTournament(config).find(...)`, que solo ve UN config. Una fuente
  `rs_<stageX>` de OTRO torneo no se puede ubicar desde ahí. Con el registro, se
  construye el índice `stageId -> tournamentConfig` sobre TODOS los configs, y la
  fuente se ubica sin importar a qué torneo pertenece. Es literalmente lo que habilita
  la Fase A.
- **`teamsAssign` (Fase B)**: para resolver orígenes diferidos hay que saber qué
  torneo/stage los produce y en qué orden simular. El registro es la fuente de verdad
  de ese grafo.

### Forma propuesta

- Clase `TournamentConfigStore` (mismo estilo que `RankingStore`): `Map<idConfig, config>`
  interno + accesores. Opcionalmente índices derivados cacheados:
  `stageId -> tournamentConfig` y `tournamentId -> tournamentConfig`.
- **Sumarlo a `SimulationContext`**: hoy tiene `calendar` + `store` (rankings). Pasa a
  tener también `tournaments` (registro de configs). Los tres comparten el mismo ciclo
  de vida (una simulación/temporada) y se inyectan juntos, igual que se hizo al sacar
  el `globalFinishedRankingsMap`.
- **Punto de alta**: cuando se crea un torneo (`Tournament.create`), su config se
  registra en `ctx.tournaments`. Así, para cuando corra `verifyCoupledTournaments`
  (Fase A) o `teamsAssign` (Fase B), el registro ya tiene todo.

### Relación con la persistencia "real" (DB)

Este registro es **en memoria** y NO es una DB: resuelve coordinación dentro de una
corrida, no persistencia entre sesiones. Pero sí es el paso que la habilita después:
una vez que todos los configs viven en un store con una API clara, serializarlos a
JSON (y más adelante a SQLite/DB) es un agregado natural, no un rediseño. La DB queda
para cuando aparezca la necesidad de guardar/recargar temporadas entre sesiones; hoy
no es necesaria para nada de lo anterior.

### Orden sugerido

`§7 (registro)` → `Fase A (DAG + validación)` → `Fase B (teamsAssign + reOrder)` →
`Fase C (reglas semánticas)` → (eventual) `serialización/persistencia`.
