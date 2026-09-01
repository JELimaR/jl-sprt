# Plan de Testing - jl-sprt

## Objetivo

Asegurar el uso confiable de la librería `jl-sprt` mediante una suite de tests que cubra desde las unidades básicas (fechas, rankings) hasta la simulación completa de temporadas. El objetivo es poder refactorizar y agregar deportes/formatos con confianza de no romper el comportamiento existente.

## Herramientas

- **Runner**: `vitest` (ya configurado, `npm run test`)
- **Convención de ubicación**: carpetas `__tests__/` junto al módulo bajo prueba (como ya existe en `JCalendar/__tests__/`)
- **Convención de nombres**: `<Modulo>.test.ts`

### Scripts sugeridos (package.json)

```jsonc
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",          // una sola ejecución (CI)
    "test:coverage": "vitest run --coverage"
  }
}
```

> Para cobertura se necesita `@vitest/coverage-v8` como devDependency.

---

## Estrategia por capas

El sistema tiene una dependencia clara de abajo hacia arriba. Se testea en ese orden para que un fallo en una capa baja no genere ruido en las altas.

```
Capa 1 (dominio agnóstico):                  Ranking / RankingStore
Capa 2 (estructura):                         GeneralStageGraph (GSG)
Capa 3 (deporte):                            SportProfiles (Match, Result, MatchPlay, TableItem, Serie)
Capa 4 (competición):                        Stage / BaseStage (League, SingleElimination)
Capa 5 (orquestación):                       Tournament / Phase
Capa 6 (entidades):                          Institution / Federation / Confederation / LeagueSystem
Capa 7 (integración):                        Simulación de temporada completa (end-to-end)
```

> **Fuera de alcance: JCalendar y JDateTime.** La carpeta `JCalendar` (fechas, calendario y eventos) se está extrayendo a un paquete independiente reutilizable. Sus tests pertenecen a ese paquete, no a `jl-sprt`. En esta suite, el calendario y las fechas se tratan como una **dependencia externa confiable**: se usan en los tests de integración, pero no se testean sus internals aquí. El archivo actual `JCalendar/__tests__/JCalendar.test.ts` debe migrar al nuevo paquete.

---

## Capa 1 — Ranking y RankingStore

Prioridad **alta**: es el pegamento de todo el sistema y fue recientemente refactorizado.

### Ranking (`JSportModule/Ranking/__tests__/Ranking.test.ts`)
- **Construcción y validación**:
  - `fromTypeRanking` con items y teams alineados
  - error cuando `items.length !== teams.length` (con teams no vacío)
  - `fromQualyCondition`: genera items según min/max pos, sin teams (no bloqueado)
  - `fromRankItemArr`: genera items + teams + scores + metadata
- **isBlocked**: true solo cuando items y teams coinciden
- **getRankTable**: vacío si no está bloqueado; con score cuando corresponde
- **getFromPosition**: devuelve el team/score correcto; lanza si no bloqueado o pos inexistente
- **getInterface / copy**: preservan items, teams, scores y metadata (inmutabilidad)
- **metadata**: se almacena y expone correctamente
- **combine**:
  - suma ponderada de scores por team (peso × score)
  - teams sin score se tratan como 0
  - ordena por score descendente
  - team presente en varios sources se acumula una sola vez
- **historical**:
  - toma rankings por season del store
  - aplica pesos por temporada
  - devuelve ranking vacío si no hay sources
- **aggregate**:
  - recopila teams únicos
  - aplica `scoreFn` y ordena descendente

### RankingStore (`JSportModule/Ranking/__tests__/RankingStore.test.ts`)
- `set` / `get`: guarda y recupera el más reciente
- `set` dos veces mismo context: `get` devuelve el último, `getHistory` devuelve ambos
- `getBySeason`: encuentra por `metadata.season`; undefined si no existe
- `has`, `keys`, `size`, `forEach`, `clear`
- Aislamiento: dos instancias de store no comparten estado (regresión del refactor del global)

---

## Capa 2 — GeneralStageGraph (GSG)

### createGSG (`JSportModule/GeneralStageGraph/__tests__/GSG.test.ts`)
- Grafo mínimo: `INI → RG → (stage) → RG → FIN` bien conectado
- `getQualyRankList`: devuelve la lista del InitialNode
- `getInitialRankings` / `getFinalRankings`: cantidad y tamaños esperados
- `getHwsNumberMinimum`: cálculo sobre el camino más largo
- **Validaciones que deben lanzar**:
  - playoff con participantes que no son potencia de 2
  - grupos fuera del rango permitido (3–20 por grupo)
  - phase que requiere más rank groups de los que produce la anterior
  - source y target del mismo tipo en una arista
- `getAllSimplePath('ini','fin')`: al menos un camino en grafos válidos

### tournamentFromGSG
- Convierte un GSG válido en `ITournamentConfig` con las phases/stages esperadas
- `qualyRules` se propagan a `qualifyConditions`
- Verificación de fechas (schedList/matchList) consistente

---

## Capa 3 — SportProfiles

Un archivo de test por perfil, más un test de contrato compartido.

### Contrato ISportProfile (`profiles/__tests__/profileContract.test.ts`)
Para cada perfil (`FootballProfile`, `VolleyballProfile`, `AmericanFootballProfile`), parametrizado:
- `createMatch` devuelve una instancia de `A_Match`
- `createResult` / `createMatchPlay` / `createTableItem` / `createSerie` devuelven instancias correctas
- `createTableItem(...).getSortFunc()` existe y ordena de forma total (transitiva)

### FootballProfile (`profiles/football/__tests__/FootballProfile.test.ts`)
- **Determinismo**: mockear la fuente de aleatoriedad para simulación reproducible
- Simular un match completo (`start` → `advance*` → `finished`): estados correctos
- `updateTableFromResult`: victoria = 3 pts, empate = 1, derrota = 0; gf/ga acumulados
- Ordenamiento: puntos → diferencia de goles → goles a favor
- Serie ida/vuelta: acumulación de goles globales y resolución de empate

### VolleyballProfile / AmericanFootballProfile
- Mismos casos adaptados a las reglas del deporte
- **Nota**: verificar el TODO de `volleyBaseStageExample` — si `createMatch`/`createSerie` de volley no simulan aún, marcar esos tests como `todo`/`skip` documentando la brecha

---

## Capa 4 — Stage / BaseStage

### League (`Tournament/Stage/StageGroup/League/__tests__/League.test.ts`)
- Con N equipos y round robin: cantidad de partidos = N(N-1)/2 (ida) o N(N-1) (ida y vuelta)
- Cada par se enfrenta la cantidad correcta de veces
- `getTable('finished')`: ordenada, posiciones 1..N asignadas
- Tabla parcial vs finalizada

### SingleElimination (`.../SingleElimination/__tests__/SingleElimination.test.ts`)
- Participantes potencia de 2: rondas = log2(N)
- Solo el ganador de cada serie avanza
- `getTable`: orden por ronda alcanzada
- Primera ronda: dos del mismo grupo origen no se cruzan si hay draw (issue conocido del index.ts)

### BaseStage.calcTableValues
- Construye una fila por participante vía el profile
- Actualiza correctamente desde resultados
- Lanza si un team del match no está en participantes

---

## Capa 5 — Tournament / Phase

### Phase (`Tournament/__tests__/Phase.test.ts`)
- `isFinished` solo cuando todas las stages terminaron
- `getRelativeRank`: resuelve teams desde el store según `rankItemList`; context `pr_<id>`; metadata `generatedBy: 'phase'`
- Lanza si falta un sourceRanking en el store

### Tournament (`Tournament/__tests__/Tournament.test.ts`)
- `create`: construye las phases desde la config
- `getRelativeRank`: toma la última phase terminada; context `tr_<id>`; metadata `generatedBy: 'tournament'`
- `graph` / `qualyGenericRankItemList` coherentes con el GSG de entrada

---

## Capa 6 — Entidades

### Federation (`JSportModule/data/Entities/__tests__/Federation.test.ts`)
- `addInstitutionToCategory`: agrega team; rechaza duplicados; error si la institución no tiene team en la categoría
- `getRanking`: ranking con context `fr_<cat>_<id>`, metadata `federation`/`institution`
- `getDivGenericRank`: divide el ranking según condiciones; error si la suma de N no coincide
- `updateLeagueSystem`: valida cantidad de equipos y consistencia; lanza si faltan equipos
- `createTournamentList`: un torneo por división configurada
- `updateRankings`: aplica ascensos (pos ≤ p) y descensos (pos > N−r) y reordena sin perder ni duplicar teams

### LeagueSystem
- `getTeamsCount`: suma de N por división
- `getLeagueSystemTransitionCondition`: casos de crecimiento/reducción de divisiones; validación del cociente entre tamaños

### Institution / Confederation
- Institution: `createTeam` / `getTeam` por categoría
- Confederation: alta y consulta de federaciones miembro

---

## Capa 7 — Integración (end-to-end)

Prioridad **alta**: son los tests que "aseguran el uso" real de la app.

### Simulación de una temporada (`__tests__/integration/season.test.ts`)
Basado en el flujo de `fede_inst_Example`, pero determinista:
1. Crear federación con N instituciones
2. Definir LeagueSystem
3. Crear torneos → asignar equipos → avanzar calendario
4. Verificar: todos los partidos se jugaron, cada torneo produjo su ranking, no hay teams duplicados/perdidos

### Simulación multi-temporada (`.../multiSeason.test.ts`)
- Correr 3+ temporadas seguidas
- Verificar ascensos/descensos coherentes entre temporadas
- Verificar que el número de equipos por división se mantiene
- Transición de LeagueSystem (agregar una división) sin errores

### Inicialización vía API (`.../api.test.ts`)
Basado en `APIExample`:
- Cargar geografía + instituciones + federaciones + confederaciones
- Asociaciones federación↔confederación
- Consultas (`getFederations`, `getAllConfederations`, etc.) devuelven lo esperado

---

## Determinismo y helpers de test

La simulación usa aleatoriedad (probabilidad de gol, sorteos). Para tests confiables:
- **Semilla determinista**: la simulación de partidos usa `randomFloat()` de `src/JSportModule/Match/randomSource.ts` (envoltorio de `RandomNumberGenerator` de `jl-utlts`). Llamar `reseedRandom(seed)` antes de simular garantiza la misma secuencia de resultados. Ambas funciones se exportan desde el índice de la librería.
- **Sorteos (Bombo)**: `Bombo` usa `CollectionsUtilsFunctions.shuffled` de `jl-utlts`, que acepta un `randFunction` opcional. Para tests deterministas, verificar/permitir inyectar esa función.
- **Fixtures compartidos** (`__tests__/fixtures/`): builders de teams, federaciones y GSG mínimos reutilizables para no repetir setup.
- **Snapshots**: usar con cautela solo en estructuras estables (ej. estructura de un GSG serializado), no en resultados aleatorios.

---

## Prioridad de implementación

| Prioridad | Capas | Motivo |
|-----------|-------|--------|
| 1 (crítica) | Ranking + RankingStore (Capa 1) | Núcleo recién refactorizado, alto riesgo de regresión |
| 2 (alta) | Integración temporada (Capa 7) | Asegura el uso real de la app |
| 3 (alta) | GSG (Capa 2) | Muchas validaciones críticas |
| 4 (media) | Profiles + Stage (Capas 3–4) | Lógica deportiva; necesita determinismo |
| 5 (media) | Federation / LeagueSystem (Capa 6) | Ascensos/descensos |
| 6 (baja) | Tournament / Phase (Capa 5) | Complementan cobertura |

---

## Definición de "hecho"

- Cada capa tiene al menos un archivo de test que cubre sus caminos felices y sus validaciones que lanzan.
- `npm run test:run` pasa en verde.
- La simulación de temporada completa corre sin errores de forma determinista.
- Cobertura objetivo inicial: 60% de líneas en `JSportModule` y `Tournament`, priorizando lógica sobre getters triviales.
