# Plan — Taxonomía de torneos del mundo

> Registra el modelo COMPLETO de torneos que simula un `SportWorld` (ver
> `SPORT_WORLD.md`), distinguiendo qué es construible HOY y qué es trabajo futuro.
> El objetivo es capturar la visión sin bloquear el avance: `closeSeason()` se
> implementa ahora solo para el nivel FEDERACIÓN (clubes), con los demás niveles
> diseñados como extensión.

---

## 1. Ejes del modelo

Un torneo del mundo se clasifica por dos ejes independientes:

### Eje A — Organizador (quién crea y corre el torneo)
1. **Federación** (ámbito nacional).
2. **Confederación** (ámbito continental): agrupa federaciones.
3. **Organismo mundial** (FIFA / FIBA / IHF): ámbito global. Hoy SIN clase concreta.

### Eje B — Tipo de participante
- **Clubes**: teams de **instituciones** (`Institution.createTeam` → `A_Team` con
  `owner = Institution`). ES LO ÚNICO QUE EXISTE HOY.
- **Selecciones**: teams de **federaciones** (una federación representada por un
  equipo, p. ej. la selección nacional). NO EXISTE HOY (futuro).

El cruce de ejes da la matriz de torneos:

| Organizador | Participantes | Ejemplo real | Estado |
|---|---|---|---|
| Federación | clubes | Liga/Copa nacional | **IMPLEMENTADO** (`Federation.createTournamentList` + `LeagueSystem`) |
| Confederación | clubes | Champions / Libertadores | **FALTA generación** (Confederation no genera torneos) |
| Organismo mundial | clubes | Mundial de Clubes | **FALTA entidad + generación** |
| Federación | selección | — | **FUTURO** (no hay selecciones) |
| Confederación | selecciones | Eurocopa / Copa América | **FUTURO** (no hay selecciones) |
| Organismo mundial | selecciones | Mundial | **FUTURO** (no hay selecciones) |

---

## 2. Qué existe hoy

- **`Institution.createTeam(category)`**: crea el team (club) de una institución, con
  `owner = Institution`. Única fuente de teams.
- **`Federation`**: tiene `leagueSystem` y `cupSystem` por categoría,
  `createTournamentList()` (deriva torneos de división del `LeagueSystem`),
  `updateRankings(store)` (ascensos/descensos al cerrar temporada), `getRanking(cat)`
  (ranking `fr_<cat>_<fedId>`).
- **`Confederation`**: solo `addMember(federation)` + `getData()`. **No** tiene
  cup/league systems ni `createTournamentList`.
- **Organismo mundial**: no existe (hay un `JInternationalEntity` comentado en
  `src/Entities/`). El `RankingStore` ya contempla `generatedBy: 'international'` en su
  metadata, anticipando el nivel.
- **Acoplamiento cross-torneo**: el motor ya resuelve participantes diferidos vía
  `teamsAssign` + orígenes `rs_`/`tr_`/`fr_` en el `RankingStore` (un torneo puede
  tomar "los campeones de la liga X" cuando esa liga termine). Esta es la pieza que
  permite que una copa continental tome clubes clasificados de las ligas nacionales.

---

## 3. Qué falta para cada nivel

### 3.1 Confederación de clubes (Champions / Libertadores) — SIGUIENTE natural
Falta:
- Un `CupSystem`/`LeagueSystem` (o equivalente) en `Confederation`, análogo al de
  `Federation`, y un `createTournamentList()` de confederación.
- Que los participantes se tomen de los **rankings de las federaciones miembro**
  (orígenes `fr_`/`tr_` de cada federación), vía el acoplamiento ya existente.
- Agendar sus eventos en el calendario del mundo en ventanas que no colisionen con las
  ligas nacionales.
No requiere modelo de team nuevo (son clubes).

### 3.2 Organismo mundial de clubes (Mundial de Clubes)
Falta:
- Una **entidad del organismo mundial** (hoy inexistente; `JInternationalEntity`
  comentado). Decidir si se modela como clase concreta o como un `SportWorld`-level
  organizer sin entidad (el usuario dijo que por ahora no ve necesidad de clase).
- Generación de su(s) torneo(s) tomando clubes clasificados de las confederaciones.

### 3.3 Selecciones (cualquier organizador) — FUTURO
Falta el concepto base:
- **Team de federación** (`Federation.createTeam` o equivalente): un `A_Team` cuyo
  `owner` sea la `Federation` (la selección nacional). `A_Team.entity: ITeamOwner`
  ya admite cualquier owner con `{id, name}`, así que la Federación podría ser owner;
  falta el método de creación y el modelo de roster/jugadores (ligado a Personas).
- Una vez exista, los torneos de selecciones (continentales, mundial) se arman igual
  que los de clubes pero con estos teams.

---

## 4. Impacto en `closeSeason()` (ver SPORT_WORLD.md)

La transición de temporada orquesta la creación de los torneos del año N+1 de TODOS los
niveles. El diseño del método contempla los tres, pero la implementación es incremental:

```
closeSeason():
  // consolidación (todos los niveles que hayan corrido)
  1. graba rankings finales de los torneos del año N (tr_) en el store
  2. por cada federación: updateRankings (ascensos/descensos)   [IMPLEMENTADO]
  3. (futuro) por cada confederación: consolidar su ranking continental
  4. snapshot histórico de la temporada N

  // generación del año N+1
  5. por cada federación: createTournamentList() -> crear torneos (clubes)  [IMPLEMENTADO]
  6. (futuro) por cada confederación: crear torneos continentales (clubes)
  7. (futuro) organismo mundial: crear torneos globales (clubes)
  8. (futuro, cuando existan selecciones) torneos de selecciones en 5/6/7
  9. currentSeason = N+1
```

**Alcance de la implementación actual (Paso 4 de SPORT_WORLD.md):** pasos 1, 2, 4, 5, 9
(nivel federación, clubes). Los pasos 3, 6, 7, 8 quedan como enganches documentados.

---

## 5. Qué queda FUERA (por ahora)
- Generación de torneos de **confederación** y **organismo mundial** (clubes): diseñados
  acá, no implementados en esta tanda.
- **Selecciones** (teams de federación) y todo torneo que las use: futuro, requiere
  modelo de team de federación + Personas.
- Clase concreta del **organismo mundial**: pendiente de decisión (puede no necesitarse).
