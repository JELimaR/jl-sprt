# Conceptos Fundamentales - jl-sprt

## Visión General del Sistema

`jl-sprt` está construido sobre una jerarquía de elementos deportivos que representan la estructura completa de un torneo. La arquitectura sigue un modelo jerárquico donde cada nivel tiene responsabilidades específicas y bien definidas.

> Para una visión de extremo a extremo (entidades, temporadas, simulación y rankings), lee primero [GENERAL_FLOW.md](GENERAL_FLOW.md).

## Jerarquía de Elementos

```
Tournament
├── Phase (Fase)
│   └── Stage (Etapa)
│       └── BaseStage (League / SingleElimination)
│           ├── A_Match (Partido) → según SportProfile
│           └── Team (Equipo)
└── (usa) JCalendar para programar eventos
```

Cada `Stage` genera un `Ranking` al finalizar. El GeneralStageGraph (GSG) describe la estructura del torneo antes de crearlo.

---

## 🔄 Flujo Principal del Sistema

```
Entidades (estructura organizativa):
  International Entity → agrupa Confederations
    Confederation → agrupa Federations (por continente/región)
      Federation → agrupa Institutions, gestiona LeagueSystem y CupSystem por categoría
        Institution → agrupa Teams (uno por categoría de edad)
          Team → participa en Tournaments

LeagueSystem (dentro de Federation):
  Define divisiones por categoría → asigna teams a divisiones
  → al final de temporada: ascensos/descensos entre divisiones

Torneos (ejecución deportiva):
  GSG (grafo dirigido) → tournamentFromGSG() → ITournamentConfig → Tournament
    → crea Phases → crea Stages → programan eventos en JCalendar
    → el calendario avanza → simula partidos (A_Match según SportProfile)
    → genera Rankings → RankingStore almacena resultados
    → QualyConditions transfieren equipos entre Stages/Phases

Conexión entre ambos:
  Federation.updateRankings() → toma los rankings finalizados de los torneos
    → aplica ascensos/descensos y reordena el ranking interno para la siguiente temporada
```

Las entidades definen *quién* juega y cómo se organizan; Tournament/GSG define *cómo* se juega. El puente es `Federation.updateRankings()`, que usa los resultados de los torneos para actualizar la estructura de divisiones.

---

## 🏆 Tournament (Torneo)

### ¿Qué es?
Un **Tournament** es el elemento de más alto nivel que representa un torneo deportivo completo. Es el contenedor que organiza y coordina todas las fases de una competición.

### Características Principales
- **Múltiples fases**: un torneo puede tener varias fases secuenciales
- **Ranking final**: `getRelativeRank()` produce el ranking final (context `tr_<id>`)
- **SportProfile**: cada torneo se crea con un perfil de deporte que define la simulación

### Creación

```typescript
import { Tournament, FootballProfile } from 'jl-sprt';

const tournament = Tournament.create(
  { id: 'trn_001', season: 2024 },  // IElementInfo (season es number)
  tournamentFromGSGData,            // ITournamentFromGSGData
  calendar,                         // JCalendar
  new FootballProfile()             // SportProfile
);
```

---

## 📅 Phase (Fase)

### ¿Qué es?
Una **Phase** representa una fase específica dentro de un torneo. Las fases son secuenciales: cada una se completa antes de que comience la siguiente.

### Características Principales
- **Etapas paralelas**: una fase puede contener múltiples etapas que se ejecutan simultáneamente
- **Ranking de fase**: `getRelativeRank()` genera un ranking que combina las etapas de la fase (context `pr_<id>`)

### Ejemplos de Fases
1. **Fase de grupos**: múltiples grupos jugando simultáneamente
2. **Fase eliminatoria**: octavos, cuartos, semifinales, final

---

## 🎯 Stage (Etapa)

### ¿Qué es?
Un **Stage** es una unidad de competición dentro de una fase. Representa un formato particular (liga o eliminación directa).

### Tipos de Stage

#### StageGroup (Etapa de Grupos)
- Organiza equipos en grupos con formato liga (round robin)
- Cada `BaseStage` interno es una `League`
- Los mejores de cada grupo avanzan

#### StagePlayoff (Etapa Eliminatoria)
- Eliminación directa entre equipos
- Cada `BaseStage` interno es una `SingleElimination`
- Formato de partido único, ida/vuelta o campo neutral

### Características Comunes de Stage
- **Gestión temporal**: fechas de inicio y fin (en medias semanas)
- **Sorteo**: distribución de equipos en bombos
- **Generación de rankings**: `getRelativeRank()` produce el ranking de la etapa (context `rs_<id>`)

---

## 📊 Ranking System

### ¿Qué es?
El **Ranking** es el sistema de clasificación que determina el orden de los equipos según sus resultados. Es fundamental para la progresión entre fases/etapas y para los ascensos/descensos.

### Estructura de un Ranking
Un `Ranking` combina:
- `context`: string que identifica quién lo generó (ver convención de context)
- `items`: `IGenericRankItem[]` — slots `{ origin, pos }`
- `teams`: `Team[]` — equipos concretos alineados 1:1 con items
- `scores?`: puntuaciones opcionales (para rankings ponderados)
- `metadata?`: metadatos (season, generatedBy, rankedEntity, sourceId)

Un ranking está "bloqueado" (`isBlocked`) cuando la cantidad de teams coincide con la de items.

### Convención de context

| Patrón | Significado |
|--------|-------------|
| `rs_<stageId>` | Ranking final de un Stage |
| `pr_<phaseId>` | Ranking de una Phase |
| `tr_<tournamentId>` | Ranking final de un Tournament |
| `fr_<cat>_<fedId>` | Ranking interno de una Federación |
| `cr_<cat>_<confId>` | Ranking confederativo |
| `ir_<cat>_<intId>` | Ranking internacional |

### Flujo de Rankings
```
Ranking de Federación (fr_)  →  ranking inicial del torneo
        ↓
Stage 1 → rs_stage1     Stage 2 → rs_stage2
        ↓                       ↓
      Phase (pr_)  →  Tournament (tr_)
        ↓
Federation.updateRankings() → ascensos/descensos → nueva temporada
```

### Rankings combinados y ponderados
Además de los rankings simples, se pueden derivar rankings compuestos:
- `Ranking.combine()` — pondera múltiples rankings por peso
- `Ranking.historical()` — promedia rankings de varias temporadas (tipo coeficiente UEFA)
- `Ranking.aggregate()` — agrega con una función de score personalizada

### Almacenamiento: RankingStore
Todos los rankings finalizados se guardan en un `RankingStore` (el export `globalFinishedRankingsMap`), que mantiene el ranking actual y el historial por context.

---

## 🕸️ GeneralStageGraph (GSG)

El **GeneralStageGraph** es un grafo dirigido que representa la estructura completa del torneo: cómo fluyen los equipos entre etapas, fases y rankings. Es el "plano arquitectónico" del torneo.

### Propósito
- **Estructura**: describe el torneo antes de crearlo
- **Validación**: verifica consistencia (flujo de equipos, conectividad, potencias de 2 en playoffs, etc.)
- **Planificación**: calcula semanas mínimas necesarias

### Creación

```typescript
import { createGSG } from 'jl-sprt';

const initialCreator = {
  tournamentId: 'champions_2024',
  qualyrankList: [
    { origin: 'fr_S_F001', pos: 1 },
    { origin: 'fr_S_F001', pos: 2 },
    // ...
  ],
  rankGroupNumbers: [16], // 16 equipos iniciales en un grupo de ranking
};

const phaseCreators = [
  {
    id: 1,
    stages: [
      { count: 4, stage: { type: 'group', value: 4, opt: 'rr' } }, // 4 grupos de 4, round robin
    ],
  },
  {
    id: 2,
    stages: [
      { count: 1, stage: { type: 'playoff', value: 3, opt: 'h&a' } }, // eliminatoria ida/vuelta
    ],
  },
];

const gsg = createGSG(initialCreator, phaseCreators);
```

> El detalle completo de nodos, aristas y validaciones está en [GRAPH_SYSTEM.md](GRAPH_SYSTEM.md).

---

## 🏢 Sistema de Entidades Deportivas

### Jerarquía de Entidades
```
International Entity
└── Confederation (Continental)
    └── Federation (Nacional)
        ├── Institution (Club)
        │   └── Team (uno por categoría)
        ├── LeagueSystem (por categoría)
        └── CupSystem (por categoría)

GeogEntity (transversal): Continent → Country → Town
```

### Categorías de edad
`TypeCategory`: `S` (senior), `S23`, `S21`, `S19`, `S17`, `S15`, `S13`. La constante `CATEGORIES` lista todas.

### Institution (Club)
Representa un club que puede tener un equipo por categoría.

```typescript
class Institution {
  createTeam(category: TypeCategory): void;
  getTeam(category: TypeCategory): Team | undefined;
}
```

### Federation (Federación)
Organización nacional que gestiona instituciones y organiza competiciones nacionales.

```typescript
class Federation extends SportOrganization<...> {
  addInstitutionToCategory(inst: Institution, category: TypeCategory): void;
  updateLeagueSystem(ls: LeagueSystem): void;
  createTournamentList(): ITournamentFromGSGData[];
  getRanking(category: TypeCategory): Ranking;
  updateRankings(): void;   // aplica ascensos/descensos al final de temporada
}
```

### Confederation (Confederación)
Organización continental que agrupa federaciones y organiza competiciones continentales.

### LeagueSystem (Sistema de Ligas)
Define la estructura de divisiones y los ascensos/descensos de una federación por categoría.

```typescript
interface IDivisionCondition {
  N: number;  // cantidad de equipos en la división
  p: number;  // cuántos ascienden
  r: number;  // cuántos descienden
}

interface IDivisionConfig {
  level: number;                        // nivel (1 = primera división)
  condition: IDivisionCondition;
  fromGSGData: ITournamentFromGSGData;  // datos para crear el torneo de la división
}
```

### CupSystem (Sistema de Copas)
Torneos de copa (eliminación directa) organizados por la federación, por categoría.

---

## Integración Entidades ↔ Torneos

1. **Ranking de federación** → ranking inicial de los torneos de división
2. **Teams de instituciones** → participantes del torneo
3. **LeagueSystem** → configuración GSG de cada torneo de división
4. **Resultados del torneo** → `Federation.updateRankings()` → ascensos/descensos

Este modelo permite crear desde ligas nacionales simples hasta estructuras complejas multi-división con evolución temporada a temporada.
