# Torneos acoplados (Champions / Europa League) — problemas a resolver

Este documento registra el diseño y los problemas pendientes para modelar **torneos
de confederación acoplados**, donde un torneo recibe equipos de OTRO torneo cuyos
resultados aún no se conocen al inicio (caso real: los 3ros de los grupos de
Champions "bajan" a la Europa League).

El ejemplo `src/examples/confederationExample.ts` deja la estructura planteada pero
**no es funcional** por las razones de abajo.

---

## Escenario objetivo

- **Torneo A ("Champions")**: fase de grupos de 32 (8 grupos de 4).
  - Su ranking de salida (`rs_`) ordena por posición de grupo:
    `pos 1..8 = 1ros, 9..16 = 2dos, 17..24 = 3ros, 25..32 = 4tos`.
  - Los **3ros de A** (posiciones 17..24) "bajan" al Torneo B.

- **Torneo B ("Europa")**: ranking inicial de **40** equipos:
  - **8** = los 3ros de A (NO se conocen al inicio).
  - **32** = clasificados de las federaciones (van a la fase de grupos de B).
  - Flujo: grupos de B (8×4) → cruce (3ros de A vs 2dos de B) → octavos
    (ganadores del cruce vs 1ros de B) → ... → final en estadio neutral (fase aparte
    con playoff `opt: 'neutral'`, porque no es ida/vuelta).

---

## Problema 1 — el ranking inicial con equipos "desconocidos"

> Nota (estado actual): la asignación vive hoy en `teamsAssign`
> (`src/Tournament/teamsAssign.ts`), que RESUELVE este problema con resolución
> diferida. Lo que sigue describe el comportamiento naive/histórico (la vieja
> `asignarTeams2`, ya eliminada) para dar contexto al diseño.

La asignación naive resuelve el ranking inicial COMPLETO del torneo al momento de
crearlo: recorre `tournament.qualyGenericRankItemList` y para cada item hace
`ctx.store.get(origin)` + `getFromPosition(pos)`; **lanza si falta cualquier origin**.

Los 8 entrantes de B tienen origin `rs_<grupoA>`, que **no existe** hasta que la fase
de grupos de A termina (su `Event_StageEnd` lo guarda en el store). Por lo tanto, con
DOS torneos separados, `asignarTeams2(B)` falla: no se puede resolver el ranking
inicial de B cuando parte depende de resultados futuros de A.

**Conclusión:** hoy la arquitectura NO soporta "un torneo cuyo ranking inicial
contiene equipos determinados por resultados posteriores de otro torneo".

## Problema 2 — el reOrder y el sembrado de los entrantes

Los 3ros de A no juegan la fase de grupos de B → su camino al título es más corto →
en el sourceRank deben ir **arriba** (mejor sembrados; además `tournamentFromGSG`
valida que "el último rank group inicial pueda llegar al primer lugar").

Pero en el **emparejamiento del cruce**, los 3ros de A deben quedar **por debajo de
los 1ros de B** (menor jerarquía dentro de B). El par que se intercambia es
**(entrantesA, 1rosB) → (1rosB, entrantesA)**: NO es (1rosB, 2dosB). La razón es que
1rosB están mejor rankeados deportivamente que los entrantesA, así que deben quedar
por encima; y como efecto secundario, tras el swap los entrantesA quedan adyacentes a
los 2dosB, que es justo el cruce (3ros de A vs 2dos de B). Para invertir ese orden
relativo existe el `ReOrderStageNode`. **Está comentado a propósito** en
`GSGCreators.createStage` (`case 'reOrder'`), porque activarlo sin resolver el
Problema 1 no tiene sentido: el caso que lo necesita no puede ejecutarse todavía.

## Problema 3 — dependencia temporal entre stages/torneos (no validada)

No hay verificación de que la fase de grupos de A termine ANTES de que arranque el
cruce de B. El orden correcto depende de las fechas (`matchList`/`schedList`). Si
están mal ordenadas, falla en runtime (`Event_StageStart` no encuentra el `rs_` en el
store). Sería deseable una validación al construir: "el `hwStart` de un stage debe ser
posterior al `hwEnd` de todas sus fuentes".

## Problema 4 — validaciones de nivel confederación (cupos por federación)

Quién define cuántos y cuáles equipos manda cada federación a cada torneo. Falta
validar, por ejemplo: si los 2 mejores de la federación F van a A, que esos no vayan
también a B; y que no se salteen posiciones (no mandar el 6º y 7º si no fueron el 3º,
4º, 5º). El enrutamiento actual es por índice/orden, no por identidad, así que nada
de esto se verifica.

---

## Opciones para resolverlo

### Opción 1 — un solo torneo multi-fase (funciona con el código actual)
Modelar A-grupos + B-completo como UN `Tournament`. El ranking inicial serían 64
equipos (32 para grupos A + 32 para grupos B), TODOS conocidos de federaciones. Los
3ros de A se enrutan internamente como rank groups a la ronda de cruce de B; no hay
dependencia cross-tournament en `asignarTeams2`. Es el uso natural del GSG y no
requiere cambios de código. (Desventaja: no refleja "dos torneos" como entidades
separadas.)

### Opción 2 — dos torneos, con entrada just-in-time (requiere extender el código)
Mantener A y B como torneos separados. B arranca solo con sus 32 conocidos; los 8
entrantes NO están en el ranking inicial de B, sino que entran por una stage cuyas
`qualifyConditions` referencian `rs_<grupoA>` y se resuelven en `Event_StageStart`
(que SÍ lee el store al arrancar el stage, a diferencia de `asignarTeams2` que lo hace
al crear). Cambios necesarios:
  1. Permitir que `asignarTeams2` tolere posiciones no resueltas al inicio (o que el
     torneo se cree sin resolver el ranking inicial completo).
  2. Permitir `qualifyConditions` cross-tournament en `tournamentFromGSG` (hoy solo se
     construyen desde los rank groups del propio GSG).
  3. Habilitar el `case 'reOrder'` en `createStage`.
  4. Agregar la validación temporal del Problema 3.

---

## Estado actual
- `confederationExample.ts`: Torneo A funcional; Torneo B con estructura definida pero
  no ejecutable (solo se valida `createGSG`).
- `ReOrderStageNode`: implementado y con tests, pero su `case` en `createStage` sigue
  COMENTADO hasta resolver el Problema 1.

---

# Principios de diseño del GSG que queremos fijar

Esta sección "blanquea" cómo QUEREMOS que funcione el GSG, más allá de lo que hoy
está implementado. Son invariantes objetivo para las próximas iteraciones (y para la
construcción gráfica del torneo en el frontend, que deberá validarlas en tiempo real).

## A) El problema del ORDEN

Todo el enrutamiento entre fases es por **índice/orden contiguo** de rank groups
(cada fase produce un array ordenado; la siguiente lo consume por `count`). No hay
routing por identidad ni por nombre. Consecuencias:

- El orden en que un StageGroup emite sus rank groups es fijo:
  `[1ros, 2dos, 3ros, 4tos]`. El diseñador del GSG debe conocerlo para rutear cada
  rama al stage correcto.
- El **sembrado** (posición en el sourceRank) tiene semántica: "arriba" = mejor
  sembrado / camino más largo/protegido. Un equipo que entra directo a una ronda
  avanzada (ej. saltea la fase de grupos) debe ir ARRIBA, aunque en el emparejamiento
  de esa ronda tenga que quedar por debajo (para eso está el reOrder).
- `tournamentFromGSG` ya valida una parte: que el ÚLTIMO rank group inicial pueda
  llegar al primer lugar (el peor sembrado tiene camino al título). Queremos más
  validaciones de coherencia de orden (abajo).

## B) Las bifurcaciones NO se pueden volver a cruzar

Cuando un stage parte su ranking de salida en rank groups, **cada rank group es una
rama**. Una rama se "bifurca" de otra cuando ambas salen del mismo stage pero se
rutean a destinos distintos en la fase siguiente.

Lo que hay que entender bien (y que antes estaba mal explicado):

- Bifurcarse **NO** significa "una rama sigue y la otra muere". Cualquier rama puede
  seguir compitiendo en **su propio** stage. Los perdedores de una llave pueden ir a
  otro `StageNode` a definir sus posiciones entre ellos con partidos reales — no
  necesariamente a un `transfer` que los arrastra al `FinalNode`.
- El caso extremo es un torneo tipo **vóley olímpico**, donde se definen TODAS las
  posiciones (1º, 3º, 5º, 7º...) por partido: cada rama que "cae" sigue jugando entre
  los suyos para ordenar su tramo de la tabla. Eso es perfectamente válido.

La regla, entonces, es más acotada: **dos ramas que YA se bifurcaron no pueden volver
a juntarse en un mismo stage posterior.** Lo prohibido es el *re-encuentro*, no que
una rama siga compitiendo. Un equipo que quedó en la rama de "perdedores" puede jugar
todo lo que haga falta, pero solo contra equipos de su misma rama (o de ramas que
nunca se separaron de la suya); no puede reaparecer en un stage junto a la rama de la
que se separó. Refleja la realidad deportiva: si perdiste la llave del título, seguís
jugando por el 5º puesto, pero no volvés a la rama del campeón.

Hoy el sistema NO valida esto: el enrutamiento por índice permite, en principio, que
el diseñador vuelva a juntar ramas ya separadas. Falta una validación de
alcanzabilidad que, para cada `StageNode`, verifique que los rank groups que recibe NO
provengan de ramas que ya se bifurcaron entre sí (ver §D.1 y RUNTIME_VALIDATIONS.md).

Relacionado (lo que SÍ hay hoy): `verifyPhaseCreator` obliga a rutear TODOS los rank
groups en cada fase (Σcount == RGs previos). Entonces una rama no puede "quedar
colgada" silenciosamente: o la consume un stage, o la arrastra un `transfer` hasta el
FinalNode. No hay "auto-eliminación"; el cierre de cada rama es explícito. Pero eso
NO impide re-cruzar: solo garantiza que nada quede sin rutear.

## C) Ramas que siguen compitiendo (definir CUALQUIER posición, no solo el título)

Corolario de B: no todas las ramas van hacia el título, y está perfecto. Es válido y
frecuente tener stages que **definen posiciones intermedias o bajas** con partidos
reales entre los integrantes de una rama:

- El 3er puesto, 5º, 7º de un torneo tipo vóley (cada rama define su tramo).
- Un playoff de **descenso** entre los peores de una división.

Ninguno viola B): en todos, una rama compite **entre sí misma** (o con ramas que
nunca se separaron de ella) para ordenar su propio tramo. Lo que B) prohíbe es
distinto: juntar en un stage a dos ramas que en algún punto anterior se separaron.

Ejemplo real en el código: `fede_inst_Example.ts`, `config_1161_2d` (2da división)
usa `rankGroupNumbers: [2, 6]` y una fase 2 con:
```ts
{ id: 2, stages: [
  { count: 1, stage: { type: 'transfer' } },
  { count: 2, stage: { type: 'playoff', opt: 'neutral', value: 1, draw: {...} } }, // define posiciones bajas
  { count: 5, stage: { type: 'transfer' } },
]}
```
El playoff de esa fase resuelve el orden de una parte de la tabla (define quién
asciende/desciende), mientras los transfers arrastran el resto. Es el patrón "stage
para determinar posiciones de una rama", que puede aplicarse a cualquier tramo (no
solo al fondo de la tabla).

## D) Validaciones objetivo (resumen de lo que falta)

1. **No re-cruzar ramas bifurcadas** (principio B).
2. **Orden del sembrado**: que los entrantes que saltean fases estén arriba, y que el
   reOrder solo se use para acomodar el emparejamiento, no para violar el sembrado.
3. **Dependencia temporal** (Problema 3): `hwStart` de un stage posterior al `hwEnd`
   de sus fuentes.
4. **Cupos por federación / confederación** (Problema 4): sin solapamientos ni saltos
   de posiciones entre torneos.
5. **Entradas desconocidas al inicio** (Problema 1): permitir que parte del ranking
   inicial se resuelva just-in-time (habilita torneos acoplados reales).
