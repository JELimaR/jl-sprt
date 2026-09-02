# Principio B — No re-cruzar ramas bifurcadas (especificación)

> Estado: **IMPLEMENTADA**. `verifyNoRecross(gsg)` en
> `src/JSportModule/GeneralStageGraph/verifyNoRecross.ts`, enganchada en
> `tournamentFromGSG` tras `createGSG`. Tests en
> `src/JSportModule/GeneralStageGraph/__tests__/verifyNoRecross.test.ts`.

Relacionado: `docs/plans/COUPLED_TOURNAMENTS.md` §B y §D.1 (donde se enunció el
principio de forma incompleta). Este documento lo reemplaza como definición
operativa.

---

## 0. Objetivo

Dado un GSG **ya construido** (`createGSG` produjo el grafo), verificar una regla
estructural: **dos ramas que se separaron en una bifurcación no pueden volver a
juntarse, en un mismo stage, en ninguna fase posterior.**

Es una verificación *a posteriori* sobre el grafo terminado. Punto de enganche
natural: dentro de `tournamentFromGSG`, luego de `createGSG`, junto a las demás
verificaciones. Devuelve OK o lanza con diagnóstico. Severidad: **error duro**.

---

## 1. Idea central: la regla es PRESERVACIÓN DEL ORDEN

Todo el ruteo del GSG entre fases es **posicional, por bloques contiguos y en
orden** (`createPhaseNodes`: cada stage toma `count` RankGroups consecutivos del
array ordenado que emitió la fase anterior). No hay routing por identidad.

Consecuencia: existe un **orden global del ranking** conceptual del torneo. A cada
RankGroup (RG) se le puede asignar un **índice de orden global** = su posición en
ese ranking (arriba = mejor).

**La regla "no re-cruzar" es equivalente a: el orden global se preserva a lo largo
de TODAS las fases, y cada stage consume siempre un RANGO CONTIGUO de ese orden.**

Si el orden se preserva y cada stage recibe como fuentes un bloque de RG con
índices de orden **consecutivos** (sin huecos ocupados por RG que fueron a otro
stage), es **imposible** re-cruzar ramas: no podés juntar "algo de arriba" con
"algo de abajo" salteando lo del medio, porque eso implicaría fuentes no contiguas
en el orden.

Un re-cruce = un stage cuyas fuentes tienen índices de orden global **no
contiguos** (hay un hueco: RG intermedios que fueron ruteados a otro stage).

### 1.1. Qué nodos "parten" el orden (producen varios RG)

Verificado en código (`getRanksGroups()` de cada nodo):

| Nodo                | # RG de salida | Efecto sobre el orden |
|---------------------|----------------|-----------------------|
| `StageGroupNode`    | varios (1ros, 2dos, …) | parte el bloque en sub-bloques ordenados |
| `StagePlayoffNode`  | varios (campeón, finalista, semis, …) | idem |
| `TableStageNode`    | 2 (clasificados / eliminados) | idem |
| `TransferStageNode` | pasa igual (`return this.r`) | **no altera nada**: puro pasaje |
| `ReOrderStageNode`  | 2, INTERCAMBIADOS (`[r[1], r[0]]`) | **ROMPE el orden a propósito** |

- `transfer` es un medio de paso: mantiene el orden intacto.
- group / playoff / table **parten** el bloque de entrada en sub-bloques, pero cada
  sub-bloque sigue siendo contiguo y en orden → NO rompe la preservación global.
- `reOrder` es el **único** nodo que altera el orden (intercambia dos RG). Es la
  única fuente posible de re-cruce en el modelo actual.

---

## 2. El único punto conflictivo: `reOrder`

`reOrder` invierte el orden de exactamente 2 RG. Existe para un caso muy concreto
(competiciones de confederación tipo UEFA, ver `NoneStageNode.ts`): los equipos
"entrantes" (que bajan de otro torneo) deben quedar POR DEBAJO de los locales en el
emparejamiento del cruce, aunque estructuralmente vengan "arriba" en el sembrado.

**Restricción acordada:** un `reOrder` legítimo solo aparece cuando **una de sus
dos fuentes es EXTERNA al torneo** (viene de otro GSG: un `tr_`/`rs_` de otro
torneo, caso acoplado). Reordenar dos ramas **internas** ya separadas del mismo
torneo sería exactamente el re-cruce que la regla prohíbe.

Por lo tanto la validación se concentra en:
1. Verificar que cada stage consume un rango contiguo del orden global (preservación).
2. Verificar que todo `reOrder` tiene al menos una fuente externa al torneo (no
   reordena dos ramas internas ya bifurcadas).

---

## 3. Formalización (notación del usuario)

Sea la fase `P` con stages `S_{P,1}, …, S_{P,n}`, que emite en orden los RankGroups
`RG_{P,1}, …, RG_{P,r}`.

La fase `P+1` con stages `S'_{P+1,1}, …, S'_{P+1,n'}` emite `RG'_{P+1,1}, …,
RG'_{P+1,r'}`.

Para algún `i`, el stage `S'_{P+1,i}` tiene como fuentes el bloque contiguo
`RG_{P,h} … RG_{P,h+k}` y produce como salida el bloque contiguo `RG'_{P+1,l} …
RG'_{P+1,l+m}`.

**Barrera:** ningún `RG'_{P+1, ≤ l-1}` (estrictamente por encima del bloque de
`S'`) puede cruzarse, en ninguna fase posterior, con ningún `RG'_{P+1, ≥ l+m+1}`
(estrictamente por debajo). "Cruzarse" = ser fuentes del mismo stage.

Como el ruteo posterior también es contiguo y ordenado, esta barrera se respeta
**automáticamente** mientras el orden se preserve. La única forma de violarla es un
`reOrder` que reordene RG a través del punto de corte.

### 3.1. Qué NO viola la regla
- **Eliminados de un stage con ramas "de abajo".** Los eliminados que produce un
  stage `S'` están DENTRO de su bloque de salida `[l, l+m]`, no estrictamente
  arriba ni abajo. Reunirlos con ramas inferiores respeta la contigüidad.
- **Confluencia legítima** (6 grupos → repechaje → eliminatoria): los 1ros y los 2
  del repechaje forman un rango contiguo del orden al entrar a la eliminatoria.

---

## 4. Algoritmo propuesto (a implementar)

Sobre el GSG ya construido:

1. Asignar a cada RG un **índice de orden global** coherente con el orden de emisión
   fase a fase (ya existe parcialmente: los RG salen ordenados de `getRanksGroups`
   y se rutean por índice; hay que materializar ese índice de forma explícita y
   estable a través de las fases).
2. Para cada stage real/table de cada fase: verificar que sus RG fuente tienen
   índices de orden global **contiguos** (sin huecos). Si hay hueco → re-cruce →
   error con diagnóstico (qué stage, qué RG, qué hueco).
3. Para cada `reOrder`: verificar que al menos una de sus 2 fuentes es **externa al
   torneo** (origen `tr_`/`rs_` de otro `idConfig`). Si ambas son internas → error.

### 4.1. Estado del código HOY (revisado)

La validación de contigüidad/no-recross **NO existe** todavía. Verificaciones
existentes revisadas y por qué NO cubren el Principio B:

| Verificación | Qué valida | ¿No-recross? |
|---|---|---|
| `verifyPhaseCreator` (GSGCreators) | Σcount == #RG previos (solo CANTIDAD) | No |
| `tournamentFromGSG` L51-60 | existe camino último-ini → primer-fin (alcanzabilidad débil, un solo par) | No |
| `verifyQualyRulesConditions` | qualyRules del ranking FINAL = unión de RG completos consecutivos | No (solo salida final) |
| `verifyTournamentConfig` | orden TEMPORAL (fechas), tamaño de fuentes | No |
| `verifyPhaseConfig` | stages dentro de fechas; sin dependencias intra-fase | No |
| `verifyCoupledTournaments` | DAG cross-tournament, ciclos, orden topológico/temporal | No |

**Piezas reutilizables** (lo que "en partes ya se hace"):
- El ruteo YA es contiguo por construcción (`createPhaseNodes` toma RG
  consecutivos por índice). El orden se preserva mecánicamente al ARMAR; falta
  VERIFICAR que un `reOrder` no lo rompió y que las fuentes de cada stage son un
  rango contiguo.
- `verifyQualyRulesConditions` ya implementa el patrón "un corte debe ser unión de
  rank groups COMPLETOS y consecutivos" (sobre el ranking final). Es el mismo
  patrón conceptual, buena referencia de estilo para la nueva validación.

Conclusión: escribir la validación desde cero, apoyada en los recorridos que ya
existen (`getSourceNeighbors`, `getTargetNeigbhors`, `phases`).

---

## 5. Ejemplos

### 5.1. VÁLIDO — 6 grupos → repechaje → eliminatoria de 8
- Fase 1: 6 grupos. Orden de salida: [6×1ros, 6×2dos, …].
- Fase 2: 6 1ros pasan; "4 mejores 2dos" → repechaje (produce 2 clasificados).
- Fase 3 (eliminatoria de 8): 6 1ros + 2 del repechaje = rango contiguo del orden.
- Sin violación: no hay hueco; el orden se preserva.

### 5.2. INVÁLIDO — re-encuentro tras separación consumada
- Fase 1: un grupo emite 1ros y 2dos.
- Fase 2: 1ros → `S_A` (por el título), 2dos → `S_B` (posiciones bajas).
- Fase 3: un stage junta un descendiente de `S_A` con uno de `S_B` **salteando** lo
  intermedio → fuentes NO contiguas → **VIOLACIÓN**.

### 5.3. VÁLIDO — reOrder con fuente externa (UEFA)
- Torneo B recibe, vía `reOrder`, sus locales (internos) y los entrantes (externos,
  `rs_`/`tr_` de A). El reOrder tiene una fuente externa → permitido.

### 5.4. INVÁLIDO — reOrder entre dos ramas internas
- Un `reOrder` que intercambia dos RG ambos internos al mismo torneo → reordena
  ramas ya separadas → **VIOLACIÓN**.

---

## 6. Estado de la especificación

### Cerrado
- La regla ES preservación del orden global + contigüidad de fuentes por stage (§1).
- Nodos que parten el orden vs. transfer (pasaje) vs. reOrder (rompe orden) (§1.1),
  verificado en código.
- `reOrder` es el único que puede violar, y solo es legítimo con **fuente externa
  al torneo** (§2), confirmado por el usuario.
- Formalización en notación del usuario (§3) y ejemplos (§5).
- Verificación a posteriori sobre el GSG, error duro (§0).

### Resuelto durante la implementación
1. **Índice de orden global (linaje):** cada RG lleva un intervalo `[lo, hi]`. Se
   siembra desde los RG iniciales (intervalos consecutivos) y se propaga fase a
   fase: bifurcantes/transfer reparten sub-intervalos contiguos en orden; reOrder
   intercambia; externas quedan `null`. No hizo falta materializar nada nuevo en
   el grafo: el orden se reconstruye recorriendo `phases` con `getSourceNeighbors`
   / `getTargetNeigbhors`.
2. **Detección de "externo":** la externalidad NO es visible en el sourceData del
   RG (el `InitialNode` re-etiqueta todo como `ini_<tid>` y pierde el origin). SÍ
   está en el `qualyRankList` del `InitialNode`: un RG inicial es externo si alguna
   de las posiciones de su bloque (según `rankGroups`) tiene un origin `rs_`/`tr_`
   de OTRO torneo (los `fr_` de federación e `ini_`/`rs_` propios son internos).
   `verifyNoRecross.detectExternalInitialRgs` implementa esto.
3. **Alcance:** la contigüidad es intra-torneo; el chequeo de reOrder usa la
   externalidad sembrada desde el ranking inicial. Confirmado con el ejemplo
   acoplado real (`confederationExample`), que pasa.

### Nota (a futuro, fuera de alcance)
El usuario mencionó que las ramas externas deberían además tener "un camino hacia
el primer lugar del ranking final". Eso lo cubre PARCIALMENTE la verificación
existente en `tournamentFromGSG` (último rank inicial → primer rank final). No se
reforzó acá.
