# Preguntas para el plan de testing (Q.md)

Este documento recoge las **ambigüedades detectadas al leer el código real**, capa por capa,
antes de escribir los tests. La idea es que respondas debajo de cada pregunta (en el bloque
`> R:`) y con eso ajusto el plan y escribo los tests con el comportamiento correcto esperado
(no solo el que hoy tiene el código).

Convención:
- **[COMPORTAMIENTO]** = hay que decidir qué es lo correcto (el código podría estar mal y el test debe fijar lo bueno).
- **[CONFIRMAR]** = creo saber la respuesta, solo necesito que la confirmes.
- **[DATO]** = necesito un dato/valor concreto que no está en el código.

---

## Transversal (afecta a todas las capas)

1. **[COMPORTAMIENTO]** ¿Los tests deben verificar el comportamiento *actual* del código tal
   cual está, o el comportamiento *deseado*? Donde detecte que el código hace algo dudoso
   (lo marco abajo), ¿querés que el test fije lo correcto y anotemos el bug, o que "congele"
   lo que hay hoy?
   > R: Se busca testear el comportamiento *deseado*. Quiero que el test fije lo correcto.

2. **[CONFIRMAR]** Runner: `npm run test` (vitest en watch). Para correr una sola vez sin
   configurar scripts nuevos usaré `npx vitest run` internamente. ¿OK, o preferís que
   agregue igual un `test:run`?
   > R: mi idea es usar npm run test siempre

3. **[DATO]** ¿Hay una semilla "oficial" que quieras usar para las simulaciones deterministas
   (`reseedRandom(seed)`), o elijo una fija arbitraria (ej. `12345`) y la documento?
   > R: elijamos una semilla fija por el momento. Normalmente elijo el 13.

---

## Capa 1 — Ranking / RankingStore

Código leído: `src/JSportModule/Ranking/Ranking.ts`, `RankingStore.ts`, `interfaces.ts`.

4. **[COMPORTAMIENTO]** `Ranking.combine` y `aggregate` asignan `pos = idx + 1` tras ordenar
   por score descendente, **pero en empate de score el orden depende del orden de inserción
   del Map** (no hay desempate estable). ¿Qué se espera ante scores empatados: orden estable
   por inserción, por id de team, o es indistinto (y entonces el test no debe asertar el orden
   exacto de los empatados)?
   > R: Necesito que te desplayes más, ya que no entendí la pregunta. En general, el criterio de orden para una basestage, es el que se define para cada Profile. Viene definido en TeamTableItem
   >
   > **HALLAZGO (Kiro):** Aclaro la pregunta y aporto un dato clave. `combine` y `aggregate`
   > son métodos *estáticos nuevos* de `Ranking` que arman un ranking sumando/combinando
   > scores de varios rankings y **reasignan la posición** con `pos = idx+1` tras ordenar por
   > score. Eso es un ordenamiento **distinto** al de la BaseStage: la tabla de una fase se
   > ordena con el `SortFunc` del profile (`footballSortFunc`), correcto. `combine/aggregate`
   > ordenan solo por un `score` numérico y NO usan el profile.
   >
   > La ambigüedad concreta: si dos teams terminan con el MISMO score, `combine/aggregate` no
   > definen desempate (queda el orden en que el `Map` los recorrió). Ejemplo: A=10, B=10 →
   > ¿A antes que B, o indefinido?
   >
   > **DATO IMPORTANTE:** hoy `combine`, `aggregate`, `historical`, `getBySeason`,
   > `fromQualyCondition` y `addTeams` **NO se usan en ninguna parte del código fuente**
   > (grep sin resultados). Son API del refactor todavía no cableada.
   >
   > **PROPUESTA:** para `combine/aggregate`, ante empate de score desempatar de forma
   > **estable y determinista por `team.id`** (así el test es reproducible), y lo dejo como
   > comportamiento fijado. ¿De acuerdo? ¿O preferís que estos métodos NO se testeen aún por
   > no estar en uso?
   > > R (confirmá): De acuerdo

5. **[COMPORTAMIENTO]** `RankingStore.getBySeason` usa `hist.find(...)`, o sea devuelve el
   **primero** guardado con esa season, no el más reciente. Si se guardan dos rankings con la
   misma `metadata.season`, ¿cuál debe ganar: el primero (actual) o el último?
   > R: Tampoco me queda claro. Por season, va a haber miles de rankings guardados. Por ejemplo, la div de mayor rango de la liga de categoria S18 de la federacion F_025, debe tener un ranking por temporada (desde que se creo la misma). A su vez, al final de temporada, en funcion de los resultados de los torneos de cada division, se arma el ranking de Federation. Este es uno por temporada, ya que los nuevos miembros se agregan solo al principio de la nueva temporada. Espero que se entienda. 
   >
   > **HALLAZGO (Kiro):** Clave: el `context` YA es único por entidad (ej.
   > `fr_S18_F_025` es la federación F_025 categoría S18). El historial se guarda POR context.
   > Entonces dentro de UN mismo context, ¿puede haber dos rankings con la misma `season`?
   > Por lo que describís, **NO**: hay exactamente un ranking por (context, season). Si es así,
   > `getBySeason` nunca enfrenta el empate y da igual `find` vs "último".
   >
   > **PROPUESTA:** fijar como invariante "un ranking por (context, season)". El test de
   > `getBySeason` verifica que devuelve ese único ranking. Y agrego un test que documente que
   > guardar dos veces la misma season es un caso no soportado (o que gana el último, si
   > preferís tolerancia). ¿Confirmás la invariante "uno por (context, season)"?
   > > R (confirmá): confirmo. Tambien hay que verificar que siempre se guarde un Ranking bloqueado.

6. **[CONFIRMAR]** El constructor de `Ranking` solo valida `items.length === teams.length`
   cuando `teams.length !== 0`. Es decir, un ranking con teams vacíos (no bloqueado) siempre
   es válido. ¿Correcto que ese es el diseño (ranking "sin poblar")?
   > R: No me doy cuenta si existe algun caso de uso en el cual el ranking se cree sin poblar. Habría que verificarlo. Imagino que se penso para sustituir los arrays IGenericRankItem[] que se usan por ahí. Pero tal vez no valga la pena.
   >
   > **HALLAZGO (Kiro):** Sí existe y se usa: `Phase.getRelativeRank` crea el `TypeRanking`
   > con `teams: []` y luego lo va poblando (`out.teams.push(team)`) antes de
   > `Ranking.fromTypeRanking`. O sea, el "ranking sin poblar" (teams vacío) es un estado
   > intermedio **real y necesario**, no dead code. Un ranking se arma con items (posiciones
   > esperadas) y después se le asignan los teams.
   >
   > **PROPUESTA:** mantener el diseño (teams vacío = ranking no bloqueado, válido) y testear
   > exactamente eso: se puede construir con teams vacío, `isBlocked` es false, `getRankTable`
   > devuelve `[]`, y al poblar coincidiendo la cantidad pasa a bloqueado. ¿OK?
   > > R (confirmá): cofnirmo.

7. **[COMPORTAMIENTO]** `addTeams(t)` **no hace nada silenciosamente** si
   `items.length !== t.length` (no lanza, no avisa). ¿El test debe fijar que *debería lanzar*
   error, o se acepta el no-op silencioso?
   > R: debería arrojar error tal vez

8. **[CONFIRMAR]** Existe un campo privado `_final` con comentario "ver como se debe hacer"
   que no se usa en ningún lado. ¿Lo ignoro para los tests (dead code) o tiene un uso previsto
   que deba testear?
   > R: Sobre todo en el frontend y en el futuro simulador detallado, interesa ver rankings de torneos etc antes de finalizados. Por ejemplo, para un equipo, saber si esta en descenso para plantear un pártido. Para simplemente ver la tabla en tiempo real etc. CReo que estaba pensado de esa manera, pero puede no ser correcto.

9. **[COMPORTAMIENTO]** `getFromPosition(pos)` lanza el **mismo** error genérico tanto si el
   ranking no está bloqueado como si la posición no existe. ¿Alcanza con testear "lanza en
   ambos casos", o querés distinguir los dos motivos (implicaría cambiar el código para
   diferenciar el mensaje)?
   > R: Habría que lanzar errores distintos

10. **[DATO]** `metadata.timestamp` existe en la interfaz pero nunca se setea en el código que
    leí. ¿Alguien lo llena en otra capa, o es un campo aún no usado que puedo dejar fuera de
    los asserts?
    > R: no se llena por el momento

---

### Decisiones cerradas de Capa 1 (lo que voy a implementar/testear)

Con tus respuestas 7–10 ya puedo cerrar esto (confirmame lo de arriba en 4/5/6):

- **#7 `addTeams`**: cambio el código para que **lance error** si `items.length !== t.length`
  (hoy es no-op silencioso). Test: lanza en mismatch, asigna en match.
- **#8 `_final`**: es feature futura (ver tabla en vivo antes de finalizar). Lo **dejo como
  está**, sin test por ahora. No lo borro.
- **#9 `getFromPosition`**: cambio el código para lanzar **dos errores distintos**
  ("no bloqueado" vs "posición inexistente"). Tests separados para cada motivo.
- **#10 `metadata.timestamp`**: no se setea. **No lo asertaré** en los tests.
- **Transversal**: semilla fija **13**; runner **`npm run test`**; tests fijan el comportamiento
  **deseado** (con nota del bug cuando corrija algo).

> **Nota**: los cambios de código de #7 y #9 son pequeños y de bajo riesgo (mejoran manejo de
> errores). Los haré junto con los tests de Capa 1 salvo que prefieras revisarlos antes.

---

## Capa 2 — GeneralStageGraph (GSG)

Código leído: `GeneralStageGraph.ts`, `GSGCreators.ts` (nodes/NoneStageNode/RealStageNode leídos parcialmente por referencia).

11. **[COMPORTAMIENTO]** El plan dice que `createGSG` valida "playoff con participantes que no
    son potencia de 2" y "grupos fuera de rango 3–20". **No encontré esas validaciones en
    `createGSG`/`GSGCreators.ts`** (`validatePhaseCreatorQuantities` está vacía). ¿Dónde viven
    realmente esas reglas — en los nodos (`StagePlayoffNode`/`StageGroupNode`), en los
    `verify*Config`, o en el `BaseStage`? Necesito saber dónde asertar el throw.
    > R: me parece que estan en verifyConfig
    >
    > **VERIFICADO (Kiro) — leído el código:** están en varios lugares, y NO hay una
    > validación literal "potencia de 2":
    > - **Playoff**: se valida *divisibilidad por 2^rounds*, no potencia de 2. En
    >   `RealStageNode.ts` constructor de `StagePlayoffNode` (~L104-110): lanza si
    >   `participants / 2**roundsNumber` no es entero. Y en
    >   `verifyBaseStageConfig.ts` `verifySingleEliminationConfig` (~L59-63) +
    >   `SingleElmination.constructorVerification` (~L24-30) vía `maxNumberRound()`:
    >   lanza si `roundsNumber > maxNumberRound(participantsNumber)`. Además
    >   `SingleElmination.teamsSortForDraw` lanza si la cantidad de teams es impar.
    > - **Grupos 3–20**: hardcodeado en `RealStageNode.ts`
    >   `calculateParticipantsPerGroupArray(pn, gn)` (~L164-166): lanza si `pn/gn < 3`
    >   o `pn/gn > 20`.
    > - **Liga 2–20**: hardcodeado en `verifyBaseStageConfig.verifyLeagueConfig` (~L25-29),
    >   `League.constructorVerification` (~L37-42) y `RoundRobin` (~L5-8).
    >
    > Para los tests asertaré el throw en el nivel de config (`verify*`) y en los nodos
    > según el caso. `validatePhaseCreatorQuantities` en GSGCreators.ts está VACÍA (stub).

12. **[DATO]** El rango de grupos "3–20" del plan: ¿de dónde sale ese 3 y ese 20? No los vi
    como constantes. ¿Son valores reales del dominio o los inventó el plan? Si son reales,
    ¿dónde están definidos?
    > R: Estan definidos. No tiene sentido una RoundRobin de menos de 3 y más de 20 es demasiado largo.

13. **[CONFIRMAR]** La regla de arista "source y target del mismo tipo" que sí existe
    (`addDirectedEdge`: `if (sourceIsRGN == targetIsRGN) throw`) en realidad valida
    "ambos RankGroup o ninguno", **no** "mismo tipo de nodo" en general. ¿Confirmás que la
    invariante real es *"toda arista conecta un RankGroupNode con un no-RankGroupNode"*?
    > R: Es correcto

14. **[COMPORTAMIENTO]** `getHwsNumberMinimum()` en realidad devuelve `Math.max(...)` de los
    caminos (el nombre dice "Minimum" pero calcula el máximo). ¿El comportamiento correcto es
    el máximo (y el nombre está mal), o debería ser el mínimo?
    > R: DE una rampida busqueda, me parece que quiere determinar la "menor" fecha que puede empezar algo. (verificar donde se usa)
    >
    > **VERIFICADO (Kiro):** `getHwsNumberMinimum()` (GeneralStageGraph.ts ~L147-151) recorre
    > todos los caminos simples ini→fin, suma las half-weeks de los RealStageNode de cada
    > camino y devuelve `Math.max(...)`. Semánticamente ES correcto que sea el máximo: el
    > "mínimo tiempo necesario para completar el torneo" = duración del camino más largo (camino
    > crítico); el torneo no puede terminar antes que su rama más larga. El nombre alude a
    > "mínimo tiempo requerido", por eso usa max. **Único call site**: `graphExample.ts` L67,
    > solo un `console.log` (no alimenta lógica). Test: fijo que devuelve la duración del camino
    > más largo. No renombro (fuera de alcance), pero lo documento en el test.

15. **[DATO]** Para un GSG mínimo de test necesito un ejemplo válido de `TInitialCreator` +
    `TPhaseCreator[]`. ¿Puedo basarme en alguno de `src/examples/graphExample.ts` /
    `graphData01.ts` como fixture canónico, o preferís que arme uno nuevo mínimo?
    > R: Si, te puedes basar en graphExample.ts para entenderlo correctamente

16. **[CONFIRMAR]** El plan menciona un "issue conocido" de que dos equipos del mismo grupo
    origen pueden cruzarse en primera ronda de playoff. ¿Sigue vigente ese bug (para marcar el
    test como `todo`/documentar), o ya se corrigió?
    > R: En realidad, eso es una regla de emparejamientos, que puede o no ser necesaria su verificacion. Por ejemplo, en Libertadores antes no podian estar en el mismo grupo equipos del mismo pais. DE repende, en un torneo de copa de una federation no pueden cruzarse equipos de una misma division etc. No esta del todo implementado esto aún

---

## Capa 3 — SportProfiles

Código leído: `ISportProfile.ts`, `FootballProfile.ts`, `FootballMatchPlay.ts`, `FootballTeamTableItem.ts`, `randomSource.ts`.

17. **[CONFIRMAR]** Fútbol: gol local con prob `0.10`, visitante `0.08`, por intervalo de 5
    min, avanzando `_time += 5`. ¿Cuántos `advance()` compone un partido completo (o sea, cuál
    es la condición `finished`)? No leí aún `A_MatchPlay`/`A_Match` — ¿el largo del partido lo
    fija el match (ej. 90 → 18 intervalos) o el MatchPlay?
    > R: Use 80 minutos. Esto esta en MatchPlay o en el propio Event del partido.
    >
    > **VERIFICADO (Kiro):** `A_MatchPlay` (A_MatchPlay.ts) NO tiene condición de `finished`
    > propia: solo expone `init()`, `advance()` y `time`. El fútbol hace `_time += 5` por
    > `advance()`. La cantidad de `advance()` la controla el Event del partido externamente
    > (80 min → 16 intervalos de 5). Para tests de MatchPlay en aislamiento: llamo `init()` y
    > luego N `advance()` yo mismo (ej. 16) con `reseedRandom(13)` para reproducibilidad, y
    > verifico el resultado determinista. No dependo del Event.

18. **[COMPORTAMIENTO]** `footballSortFunc` ordena primero por `pos` (¡posición previa!) antes
    que por puntos, salvo en la rama `isSE`. Para una tabla de liga normal (no SE), el orden
    efectivo termina siendo `pos → ps → sg → gf`. ¿Es correcto que la posición previa pese
    **antes** que los puntos en una liga? Intuitivamente esperaría `puntos → dif. goles →
    goles a favor`. ¿Qué orden fija el test como correcto?
    > R: No es la posicion previa, es la posicion actual. La posicion dentro de un grupo determina la posicion del ranking global de la stage si es un StageGroup. Esto es, el ranking de la stage, coloca primero a los que estaban en la posicion 1 de cada grupo. Luego a los que estaban en la posicion 2. Los de la misma posicion los ordena en funcion de sus criterios de ordenamiento (goles, puntos etc.)
    >
    > **ENTENDIDO (Kiro):** Coincide con el código. En un StageGroup con varios grupos, el
    > ranking global de la stage intercala por posición de grupo: todos los 1° primero, luego
    > los 2°, etc. `footballSortFunc` (no-SE) ordena por `pos` (posición de grupo) y, a igual
    > `pos`, por los criterios del profile: `ps` (puntos) → `sg` (dif. goles) → `gf`. El caso
    > `isSE` (single elimination) tiene otra rama (prioriza `P` = partidos/ronda alcanzada).
    > Test: para un solo grupo (pos 1..N distintos) el orden es directo; para varios grupos,
    > verifico el intercalado por posición. Dentro de misma pos, verifico desempate del profile.

19. **[DATO]** ¿Qué significan `P`, `pm`, `pos` en `SortFunc` y qué es `isSE`
    (¿"single elimination"?)? Necesito la semántica exacta para escribir asserts de orden que
    no sean adivinados.
    > R: P: partidos jugados, pm: promedio de puntos, pos: posicion. isSe: Is Single Elimination?
    >
    > **VERIFICADO (Kiro) en A_TeamTableItem.ts:** `P` = partidos jugados (suma de resultados);
    > `ps` = puntos (abstracto por profile; fútbol = 3W+D); `pm` = ps/P redondeado a 3 dec (0
    > si P=0); `pos` = posición (seteable, default 1); `isSE` = is single elimination (bool).
    > Confirmado, sin ambigüedad.

20. **[COMPORTAMIENTO]** El plan dice: verificar el TODO de `volleyBaseStageExample` — si
    volley aún no simula `createMatch`/`createSerie`, marcar tests como `skip`. ¿Volley y
    American Football **ya simulan** de verdad hoy, o quedan como `todo`? (Afecta cuántos tests
    reales de Capa 3 escribo ya.)
    > R: no se si siguen estando esos TODO
    >
    > **VERIFICADO (Kiro):** Ya NO hay TODO en `volleyBaseStageExample.ts`, y **volley SÍ
    > simula** de verdad: `VolleyMatchPlay` está completo (best-of-5, sets a 25 / tie-break a
    > 15, cada `advance()` = un rally, prob 0.52 team1). **American Football también simula**
    > (`AFMatchPlay`: `advance()` suma puntos con prob 0.12/0.10; tiene un TODO menor sobre
    > afinar probabilidades/scoring pero funciona). Conclusión: escribo tests reales de los
    > TRES perfiles (football, volley, AF), ninguno queda como `skip`. El TODO de AF lo dejo
    > documentado en el test (probabilidades provisionales).

---

## Capa 4 — Stage / BaseStage

Código leído parcialmente (estructura de `Tournament/Stage/`).

21. **[DATO]** Round robin: ¿la fórmula esperada es `N(N-1)/2` (solo ida) y `N(N-1)` (ida y
    vuelta)? ¿El "ida y vuelta" lo controla `TypeBaseStageOption`? ¿Qué valores tiene ese tipo?
    > R: export type TypeBaseStageOption = 'home' | 'h&a' | 'neutral' - pudiste buscarlo
    >
    > **VERIFICADO (Kiro) — tenés razón, lo confirmé en código:** `TypeBaseStageOption =
    > 'home' | 'h&a' | 'neutral'`. Fórmula real (`League.getCantMatches`, RoundRobin):
    > **'home' y 'neutral' → N(N-1)/2 partidos; 'h&a' → N(N-1)**. La liga solo admite N entre
    > 2 y 20 (tabla de scheduling m2..m20). Test parametrizado por opt con esas fórmulas.

22. **[CONFIRMAR]** `BaseStage.calcTableValues` "lanza si un team del match no está en
    participantes". ¿Confirmás que ese es el contrato (y no, por ejemplo, ignorar el match)?
    > R: debe ser ese el contrato. El anidamiento deberia generar que no aparezca en esa lista algun match que no correponda al torneo o basestage o pahse etc.
    >
    > **VERIFICADO (Kiro):** `BaseStage.calcTableValues` (BaseStage.ts ~L90-115) crea items solo
    > para `this.participants`; por cada match con resultado busca home/away TTI por id y si
    > NO los encuentra lanza `"non finded ... En BaseStage.calcTableValues"`. Solo evalúa
    > matches que cumplen `matchConditionFunc(m) && !!m.result` (partial/finished). Test: match
    > con un team ajeno a participantes → lanza.

23. **[DATO]** SingleElimination: para armar un test necesito el helper que ya usan los
    ejemplos. ¿Hay un ejemplo canónico (`stageExample*.ts`, `baseStageExample.ts`) que sirva
    como fixture, o construyo el stage directo con un profile mockeado?
    > R: deberias construirlos todos de nuevo.

---

## Capa 5 — Tournament / Phase

Código leído: `Phase.ts`, `globalFinishedRankingsMap.ts`.

24. **[COMPORTAMIENTO — importante]** `Phase.getRelativeRank` **NO usa un `RankingStore`
    inyectado**: lee de `globalFinishedRankingsMap`, que es un **singleton de módulo**
    compartido por todo (tournaments, phases, federations...). El plan asume un store por
    instancia. Esto hace que los tests **compartan estado global** y haya que llamar
    `globalFinishedRankingsMap.clear()` entre tests. ¿Aceptás esta realidad (y testeo con
    `clear()` en `beforeEach`), o querés refactorizar para inyectar el store (cambio de diseño
    antes de testear)?
    > R: Creo que es mejor practica refactorizar

25. **[CONFIRMAR]** Contexts reales: Phase usa `pr_<idConfig>` con metadata
    `generatedBy: 'phase'`. El plan menciona además `tr_<id>` para Tournament con
    `generatedBy: 'tournament'`. ¿Confirmás esos formatos exactos para Tournament? (No leí aún
    `Tournament.ts` en detalle.)
    > R: confirmo

26. **[COMPORTAMIENTO]** `getRelativeRank` lanza `"No hay sourceRanking"` si falta un origin en
    el mapa global. ¿El test debe cubrir ese throw poblando el global parcialmente? ¿O ese
    caso "no debería pasar nunca" en uso normal?
    > R:
    > **PROPUESTA (Kiro):** Es un caso de error legítimo (un origin faltante = config mal
    > armada o stage previo no terminado). Lo cubro con un test que puebla el store
    > parcialmente y espera el throw. Bajo costo, buena señal de regresión.
    > > R (confirmá):

---

### NOTA IMPORTANTE sobre #24 — refactor del store global

Respondiste "es mejor práctica refactorizar". De acuerdo en el principio, pero quiero acordar
el ALCANCE antes de tocar código, porque el `globalFinishedRankingsMap` está acoplado en varios
lugares (verificado en código):
- `Phase.getRelativeRank` (lee)
- `Tournament.getRelativeRank` (lee)
- `Federation.updateRankingsPerCategory` / `updateLeagueSystem` (lee)
- `Event_StageEnd` (escribe `rs_`), `Event_StageStart` (lee qualifyConditions)
- `asignarTeams2` (escribe `ini_`, lee sources)
- `src/index.ts` lo re-exporta como API pública
- varios `examples/*`

**Dos opciones:**
- **(A) Refactor completo ahora**: inyectar un `RankingStore` (por Tournament/Federation o vía
  contexto de simulación) y eliminar el singleton. Es un cambio transversal, medio-alto riesgo,
  toca API pública (`src/index.ts`) y todos los examples. Debería ir en su propia rama/commit y
  con los tests de integración como red de seguridad **después**.
- **(B) Testear ahora con `clear()` en `beforeEach`** (el singleton sigue), y hacer el refactor
  como tarea separada más adelante, cuando los tests de integración ya existan y cubran el
  comportamiento (así el refactor es seguro).

**Mi recomendación: (B) primero, (A) después.** Escribir los tests sobre el diseño actual nos da
la red de seguridad para refactorizar sin romper. Refactorizar primero, sin tests, es
arriesgado. ¿Vamos con B (testeo ya) y agendamos A como refactor posterior? ¿O preferís A ya?
> > R (decidí A o B):

---

## Capa 6 — Entidades (Federation / LeagueSystem / Institution / Confederation)

No leído en detalle todavía (lo haré según tus respuestas para no gastar esfuerzo en
suposiciones).

27. **[DATO]** Ascensos/descensos: el plan dice "ascensos (pos ≤ p) y descensos (pos > N−r)".
    ¿`p` y `r` son parámetros de configuración de la división/LeagueSystem? ¿Dónde se definen
    (nombre del campo)?
    > R:
    > **VERIFICADO (Kiro) en LeagueSystem.ts:** están en la interfaz `IDivisionCondition`
    > (~L37-42): `N` = cantidad de equipos de la división, `p` = cuántos ASCIENDEN (promote),
    > `r` = cuántos DESCIENDEN (relegate). Se aplican en `Federation.updateRankingsPerCategory`
    > (Federation.ts ~L283-330): recorre el `getRankTable()` del ranking final del torneo de
    > división (`tr_<divTourId>`); `pos <= p` asciende, `pos > size - r` desciende, resto se
    > queda; luego `setTeamInRanking` valida no-repetidos y pertenencia. `getDivGenericRank`
    > exige que la suma de `N` == cantidad de equipos del ranking o lanza.

28. **[CONFIRMAR]** Contexts de federación: `fr_<cat>_<id>`. ¿Confirmado? ¿`cat` es la
    categoría (edad/género) y `id` el de la federación?
    > R:
    > **VERIFICADO (Kiro):** Confirmado. `Federation.getRanking(category)` (Federation.ts
    > ~L256-270) construye `fr_<category>_<id>` (ej. `fr_S_F014`) con metadata
    > `{ generatedBy: 'federation', rankedEntity: 'institution', sourceId: id }`. Otros
    > contexts verificados: Tournament `tr_<idConfig>` (generatedBy 'tournament'), Phase
    > `pr_<idConfig>` ('phase'), Stage `rs_<idConfig>` ('stage'), inicial `ini_<idConfig>`.

29. **[DATO]** Para tests de multi-temporada y transición de LeagueSystem: ¿existe un ejemplo
    canónico (`fede_inst_Example.ts`) que ya corra una temporada completa y pueda adaptar a
    determinista, o hay que construir el escenario desde cero?
    > R:
    > **VERIFICADO (Kiro):** `fede_inst_Example.ts` ES la corrida de referencia: usa la clase
    > real `Federation`, crea 8 instituciones, y corre un loop de temporadas 1154–1166
    > (calendario nuevo por año, altas de miembros programadas, LeagueSystem/transición en años
    > 1156/1160/1161, crea torneos por división, `exampleAdvance(cal)`, guarda `tr_`, y
    > `federation.updateRankings()`). Lo adaptaré a determinista (`reseedRandom(13)`) y con
    > aserciones. `systemExample_01.ts` usa una clase auxiliar `FednAux` (no la real) → no lo
    > uso. `APIExample.ts` solo carga entidades, no corre torneos.

---

## Capa 7 — Integración (end-to-end)

30. **[DATO]** ¿Cuál es el ejemplo que hoy consideras "la corrida de referencia" que sí
    funciona de punta a punta (crear federación → torneos → avanzar calendario → rankings)?
    ¿`fede_inst_Example.ts`, `APIExample.ts`, u otro? Ese será la base del test de temporada.
    > R:
    > **VERIFICADO (Kiro):** `fede_inst_Example.ts` (ver #29). Es la única corrida end-to-end
    > con la `Federation` real que avanza calendario y produce rankings.

31. **[COMPORTAMIENTO]** Por el singleton global (pregunta 24), un test end-to-end deja
    rankings en `globalFinishedRankingsMap`. ¿Confirmás que puedo `clear()` ese global en
    `beforeEach`/`afterEach` de la suite de integración sin romper nada?
    > R:
    > **VERIFICADO (Kiro):** Sí, `clear()` limpia `_current` e `_history`, y es el ÚNICO estado
    > global mutable relevante (no hay contadores de id globales; los ids son determinísticos).
    > `clear()` en `beforeEach` es seguro. (Sujeto a la decisión A/B de #24.)

32. **[DATO]** Criterio de "temporada completa jugada": ¿cómo se detecta que todos los partidos
    se jugaron — avanzando el `JCalendar` hasta cierta fecha, o hay un flag
    `isFinished`/`allPlayed` a nivel torneo/temporada que pueda asertar?
    > R:
    > **VERIFICADO (Kiro):** No hay flag a nivel Tournament/temporada. La finalización es por
    > CASCADA de `isFinished`: `StageGroup.isFinished` = todos sus grupos; `StagePlayoff` = su
    > playoff; `Phase.isFinished` = todas sus stages. `Tournament` no tiene `isFinished` pero
    > `getRelativeRank()` toma la última phase `isFinished` (o context 'none' si ninguna). El
    > disparador es el calendario: cada Stage agenda `Event_StageStart`/`Event_StageEnd`;
    > `exampleAdvance(cal)` avanza hasta que no quedan eventos; `Event_StageEnd` verifica
    > `isFinished` (lanza si no) y guarda `rs_`. Aserción de test: tras avanzar, cada
    > `phase.isFinished === true` y existen los `tr_`/`rs_` esperados en el store.

---

## HALLAZGO (Kiro) — el sorteo (Bombo) ahora es determinista [RESUELTO]

Al escribir el test de integración (Capa 7) detecté que, con `intervalOfDrawDate` seteado
(camino `teamsDraw`), el emparejamiento variaba entre corridas aunque se usara la misma
semilla, porque `Bombo` llamaba a `CollectionsUtilsFunctions.shuffled({ array })` sin pasar
`randFunction`, cayendo en `Math.random`.

**Resuelto:** `shuffled` de jl-utlts acepta `randFunction?: () => number` (verificado en
`node_modules/jl-utlts/dist/Utils/CollectionsUtilsFunctions.d.ts`). Se inyectó `randomFloat`
(de `randomSource`) en `Bombo.start()`:
`CUF.shuffled({ array, randFunction: randomFloat })`. Así una sola semilla (`reseedRandom(13)`)
gobierna tanto los scores de los partidos como los sorteos.

Cubierto por dos tests en `season.test.ts`: "determinista SIN sorteo" y "determinista CON
sorteo". Ambos verifican que dos corridas con la misma semilla producen el mismo ranking.

---

## Estado de implementación (Kiro)

- **Capa 1 (Ranking + RankingStore)**: DONE. 44 tests en verde. Ajustes de código aplicados
  (getFromPosition 2 errores, addTeams throw, store.set exige bloqueado, combine por team.id).
- **Refactor del store global → SimulationContext**: DONE. Eliminado el singleton
  `globalFinishedRankingsMap`; store inyectado vía `SimulationContext {calendar, store}`
  threadeado por Tournament→Phase→Stage→Event. `tsc --noEmit` limpio.
- **Capa 7 (integración de temporada)**: DONE (versión mínima). 3 tests: temporada completa de
  una división end-to-end, determinismo (sin sorteo), y aislamiento de stores.
- Total suite actual: **47 tests en verde**.
- Pendiente: Capas 2, 3, 4, 5, 6.

---

## Orden propuesto de implementación (según prioridad del plan)

1. Capa 1 (Ranking + RankingStore) — empiezo por acá apenas respondas 4–10.
2. Capa 7 (integración de temporada) — depende de 24 y 30–32.
3. Capa 2 (GSG) — depende de 11–16.
4. Capas 3–4 (Profiles + Stage) — depende de 17–23.
5. Capa 6 (Entidades) — depende de 27–29.
6. Capa 5 (Tournament/Phase) — depende de 24–26.

> Podés responder solo el bloque de la Capa 1 primero si querés que arranque ya con los tests
> de Ranking mientras completás el resto.


---

## HALLAZGO (Kiro) — Capa 2: TableStageNode parece tener la invariante invertida

Al testear los nodos del GSG detecté una posible inconsistencia en `TableStageNode`
(`src/JSportModule/GeneralStageGraph/NoneStageNode.ts`):

- El constructor valida `if (data.participants > data.qNumber) throw` → exige
  `participants <= qNumber`.
- Pero `getRanksGroups()` corta el ranking en `qNumber`:
  `items.slice(0, qNumber)` (clasificados) e `items.slice(qNumber)` (resto).

Consecuencia: si `participants <= qNumber`, el segundo grupo (`slice(qNumber)`)
**siempre queda vacío**. Es decir, con la invariante actual la "tabla" nunca parte en dos
grupos no vacíos, lo cual contradice su propósito documentado (dividir un ranking en
clasificados + eliminados). La intención probablemente sea la inversa: `qNumber < participants`
(qNumber = cuántos clasifican, y debe ser menor que el total para que haya eliminados).

**Estado:** los tests de `nodes.test.ts` fijan el comportamiento ACTUAL (con un comentario que
marca la duda), para no romper nada sin confirmar. `TableStageNode` no se usa hoy en los
examples ni en los tests de integración (los torneos actuales usan group/playoff/transfer).

**Pregunta:** ¿la invariante correcta de `TableStageNode` es `qNumber < participants`
(dividir en dos no vacíos)? Si confirmás, ajusto el constructor y los tests.
> R:
