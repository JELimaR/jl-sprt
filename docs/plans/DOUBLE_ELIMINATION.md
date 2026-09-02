# Plan — Doble eliminación (StageDouble)

> Estado: **plan para revisión**. No hay código todavía. Dos partes:
> A) diseño del stage de doble eliminación; B) código redundante a simplificar.

---

# PARTE A — Doble eliminación

## A.0. Decisión de diseño (confirmada)

Se implementa como un **BaseStage nuevo** (hermano de `League` y
`SingleElmination`), NO como stages del GSG que se cruzan. Motivos:

1. **Choque con el Principio B.** Modelar doble eliminación con stages que se
   cruzan (winners/losers que se reencuentran en la gran final) es, a nivel GSG,
   exactamente un re-cruce de ramas bifurcadas → lo prohíbe `verifyNoRecross`. Y
   no es un falso positivo: el doble eliminación viola el principio a propósito.
   Encapsulado dentro de un BaseStage, el re-encuentro ocurre DENTRO del stage y
   es invisible para el GSG (un solo `StagePlayoffNode`-equivalente que consume un
   bloque contiguo y emite un ranking).
2. **Bracket reset** (una segunda final condicional según el resultado de la
   primera) no se expresa en un grafo estático: el GSG se construye antes de
   jugar. Dentro de un BaseStage sí, generando eventos dinámicamente (como ya hace
   `SingleElmination` al crear rondas en runtime).
3. **Coherencia arquitectónica.** El GSG modela la estructura macro (fases, quién
   clasifica a qué). Los formatos de competición (liga, eliminación simple, doble
   eliminación, suizo) son BaseStage.

## A.1. Regla de dominio (confirmada por el usuario)

Un doble eliminación **debe devolver un único ganador**. A diferencia de
`SingleElmination`, que por parámetros puede devolver N "ganadores" (ej. un
repechaje que clasifica varios), la doble eliminación no tiene sentido con salida
múltiple: su razón de ser es dar una segunda oportunidad hasta coronar UNO.

Consecuencia de diseño: el nodo/stage de doble eliminación NO expone
`getRanksGroupNumbers()` configurable como el playoff. Su ranking de salida es
completo (campeón, subcampeón, 3º, …) pero el "corte de clasificación" hacia la
fase siguiente, si existe, es de 1 (el campeón). El resto son posiciones de
consulta, no ramas que sigan compitiendo fuera del stage.

## A.2. Cómo funciona doble eliminación (recordatorio)

- **Winners Bracket (WB):** bracket normal; el que pierde NO sale, cae al LB.
- **Losers Bracket (LB):** recibe a los perdedores del WB ronda por ronda
  (goteo entrelazado). Se elimina al perder la SEGUNDA vez.
- **Gran final:** ganador WB vs ganador LB. El de WB tiene 0 derrotas; el de LB
  tiene 1. Si gana el de LB, hay **bracket reset**: una segunda final para igualar
  en 1 derrota antes de eliminar.
- Con N = 2^k participantes, el LB tiene 2(k-1) rondas intercaladas con las del WB.

## A.3. Anatomía a reutilizar de SingleElmination

Verificado en código. `SingleElmination extends BaseStage` y aporta el patrón
completo que StageDouble puede replicar:

- **`BaseStage`** (`src/Tournament/Stage/BaseStage.ts`): `assign(participants, cal)`
  guarda participantes y llama `createChildren(cal)`; `calcTableValues(ttms)` arma
  la tabla vía el `SportProfile`; `isFinished` = todos los matches finished;
  `matches` abstracto.
- **`SingleElmination`** (`.../SingleElimination/SingleElmination.ts`):
  - `createChildren(cal)` agenda un `Event_RoundCreationAndTeamsDraw` por ronda.
  - `createNewRound(teams, cal)` crea una `Round` con series del profile y agenda
    su `Event_ScheduleOfRoundMatches`.
  - `getTable(ttms)` asigna posición por ronda alcanzada (losers de la ronda idx
    reciben `rounds.length + 1 - idx`) y ordena con el `SortFunc` del profile.
  - statics: `maxNumberRound`, `winnersInMaxNumberRound`, `teamsSortForDraw`.
- **`Round`** (`.../SingleElimination/Round.ts`): agrupa series; `winners`/`losers`
  desde `serie.winner`/`serie.loser`; agenda su schedule event.
- **Eventos** (`Event_RoundCreationAndTeamsDraw`, `Event_ScheduleOfRoundMatches`):
  crean la ronda con los ganadores de la anterior y programan sus partidos.
- **`StagePlayoff`** (`.../StagePlayoff/StagePlayoff.ts`): es el `Stage` (no Base)
  que envuelve al `SingleElmination`: maneja el sorteo (`teamsDraw` + `Bombo`),
  `drawRulesValidate`, y delega `getTable` al playoff. `getRelativeRank` lo hereda
  de `Stage`.

## A.4. Piezas nuevas para StageDouble

Estructura propuesta (espejo de SingleElimination):

```
src/Tournament/Stage/StageDouble/            (nuevo, hermano de StagePlayoff/StageGroup)
  StageDouble.ts                              # Stage<IElementInfo, IStageDoubleConfig> (envoltura, sorteo)
  DoubleElimination/
    DoubleElimination.ts                      # BaseStage: orquesta WB + LB + final + reset
    ...reutiliza Round del SingleElimination o define su propia
    Event_*.ts                                # creación de rondas WB/LB, scheduling, gran final/reset
```

Lo que hay que resolver que NO existe hoy:

1. **Entrelazado WB→LB.** Al terminar una ronda del WB, sus perdedores deben
   inyectarse en el punto correcto del LB. La lógica de "qué ronda del LB recibe a
   los perdedores de qué ronda del WB" es el corazón del formato. Es un
   BaseStage que maneja DOS secuencias de rondas coordinadas por eventos, en vez
   de una sola.
2. **Gran final + bracket reset condicional.** Al terminar WB y LB, se agenda la
   gran final. Su resultado decide si se agenda (dinámicamente) una segunda final.
   El calendario lo permite (los eventos se agregan en runtime), pero hay que
   RESERVAR fechas para la posible segunda final desde el config (half-weeks).
   Decisión abierta: reservar siempre la fecha de la 2ª final (se usa o no), o
   permitir agendarla sin reserva previa.
3. **Ranking de salida.** `getTable` debe ordenar por: campeón, subcampeón (perdió
   la final/reset), luego por ronda de eliminación en el LB (más lejos llegó =
   mejor). Regla A.1: la salida hacia el GSG es de 1 clasificado (el campeón).

## A.5. Integración con el GSG

Para que un torneo pueda declarar una fase de doble eliminación:

1. **Nuevo tipo de stage en el config**: extender `IStageConfig.type` de
   `'group' | 'playoff'` a `... | 'double'`, con su `IStageDoubleConfig` y
   `IDoubleEliminationConfig` (análogos a los del playoff, en `elementsConfig.ts`).
2. **Nuevo RealStageNode**: `StageDoubleNode` en `RealStageNode.ts`, con:
   - `getRanksGroupNumbers()` = `[1, 1, ...]` reflejando que solo el campeón es
     "corte de clasificación" (o `[1, resto...]` según se decida exponer
     posiciones). Clave (regla A.1): NO configurable a múltiples ganadores.
   - `getHwsNumber()` = fechas del WB + LB + final (+ posible reset). Hay que
     derivar la fórmula (para N=2^k: WB k rondas, LB 2(k-1), final 1, reset 0/1).
   - validación: participantes potencia de 2 (a diferencia del playoff, acá SÍ se
     exige, porque el bracket debe cerrar en un único ganador).
3. **createStage** (`GSGCreators.ts`): `case 'double'` que instancia `StageDouble`.
4. **tournamentFromGSG**: rama `stageNode instanceof StageDoubleNode` que arma el
   `IStageDoubleConfig`.
5. **verifyStageConfig / verifyBaseStageConfig**: validación del nuevo config.
6. **verifyNoRecross**: NO necesita cambios. Un `StageDoubleNode` es un stage real
   que consume un bloque contiguo y emite `[campeón, resto]` contiguo. El
   re-encuentro WB/LB es interno. La regla se respeta trivialmente.

## A.6. Tests propuestos

- `DoubleElimination.test.ts` (statics/deterministas): fechas requeridas para N=4,
  8, 16; el entrelazado WB→LB coloca a los perdedores correctamente; con seed fijo,
  un campeón único; bracket reset se dispara sólo si gana el del LB.
- Integración: una fase de doble eliminación dentro de un `tournamentFromGSG`
  completo corre end-to-end y produce un ranking con un único 1º.
- `verifyNoRecross`: un GSG con un StageDoubleNode NO lanza (caja negra contigua).

## A.7. Riesgos / decisiones abiertas

- **Reserva de fechas para el bracket reset** (A.4.2): fija o dinámica.
- **¿Reutilizar `Round` de SingleElimination o crear una propia?** El LB tiene
  rondas "de recepción" (recibe perdedores + ganadores del LB previo) que no
  encajan 1:1 con la `Round` actual. Probablemente haga falta una variante.
- **Exponer posiciones intermedias** al GSG o no (regla A.1 sugiere que no, salvo
  el campeón).

---

# PARTE B — Código redundante / a simplificar

Hallazgos concretos (verificados leyendo el código):

1. **`src/Entities/` casi vacío / duplicado.** `EntitiesController.ts` está
   vacío y `EntitiesManager.ts` conviven con la implementación REAL en
   `JSportServerModule/Entity/EntityController.ts` + `EntityHandler.ts`.
   → Revisar `src/Entities/*` y **eliminar lo muerto** (confirmar que no se
   importa desde ningún lado).
2. **`getPhaseNGenericRankItemsSorted` / `getTournamentGenericRank`
   (`elementsDataFunc.ts`).** Algoritmo largo y complejo; verificar si se usa hoy
   (candidato a dead code: `getTournamentGenericSourceItems` está literalmente
   vacío con "PENDIENTE DE REALIZAR"). Si no se usa, eliminar.
3. **Bloques comentados grandes** en `RealStageNode.ts` (`getRelativeRanking`
   comentado), `Federation.ts` (constructor con ~25 líneas comentadas),
   `nodes.ts`. → Borrar código muerto comentado.
4. **`console.log` de debug en producción.** `Federation.updateLeagueSystem` tiene
   un bloque `=== UpdateLeagueSystem Debug Info ===` que ensucia la salida de tests
   y de la simulación real. Varios `console.log` en eventos
   (`Event_RoundCreationAndTeamsDraw`, `Event_ScheduleOfRoundMatches`, GSGCreators
   `verifyPhaseCreator`). → Quitar o poner detrás de un flag de debug.
5. **`verifyNoRecross.ts`: helper `originOf` quedó sin usar** tras el refactor de
   detección de externos (se cambió a `detectExternalInitialRgs`). Confirmar y
   eliminar si es dead code.
6. **`mostrarFechaBorrar.ts`** — nombre indica temporal ("Borrar"). Revisar si se
   puede eliminar (solo usado en examples).
7. **Nombres**: `SingleElmination.ts` está mal escrito (falta la "i":
   Elm**i**nation). Renombrar a `SingleElimination.ts` (y la clase) mejora
   consistencia. Bajo impacto pero prolijo; hacerlo con `smart_relocate`/rename.

> Nota: cada eliminación debe confirmarse con una búsqueda de referencias antes de
> borrar. Ninguno de estos cambios es urgente; se pueden hacer en un commit de
> limpieza separado del de doble eliminación.
