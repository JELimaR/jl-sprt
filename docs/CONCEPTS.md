# Conceptos Fundamentales - JSport

## Visión General del Sistema

JSport está construido sobre una jerarquía de elementos deportivos que representan la estructura completa de un torneo. La arquitectura sigue un modelo jerárquico donde cada nivel tiene responsabilidades específicas y bien definidas.

## Jerarquía de Elementos

```
Tournament
├── Phase (Fase)
│   ├── Stage (Etapa)
│   │   ├── BaseStage (Liga/Eliminación)
│   │   │   ├── Match (Partido)
│   │   │   └── Team (Equipo)
│   │   └── Ranking (Clasificación)
│   └── GeneralStageGraph (Grafo)
└── Calendar (Calendario)
```

---

## 🔄 Flujo Principal del Sistema

```
Entidades (estructura organizativa):
  Confederation → agrupa Federations (por continente/región)
    Federation → agrupa Institutions, gestiona LeagueSystem (divisiones, ascensos/descensos)
      Institution → agrupa Teams
        Team → participa en Tournaments

LeagueSystem (dentro de Federation):
  Define divisiones por categoría → asigna teams a divisiones
  → al final de temporada: promociones/relegaciones entre divisiones

Torneos (ejecución deportiva):
  GSG (grafo dirigido) → tournamentFromGSG() → TournamentConfig → Tournament
    → crea Phases → crea Stages → programan Events en JCalendar
    → Calendar avanza → ejecuta EventMatch → Match.play()
    → actualiza Rankings → globalFinishedRankingsMap almacena resultados
    → QualyConditions transfieren equipos entre Stages/Phases

Conexión entre ambos:
  Federation.updateLeagueSystem() → toma rankings finalizados
    → redistribuye teams en divisiones para la siguiente temporada
```

Las entidades definen *quién* juega y cómo se organizan, mientras que Tournament/GSG define *cómo* se juega. El puente entre ambos es `Federation.updateLeagueSystem()` que usa los resultados de los torneos para actualizar la estructura de divisiones.

---

## 🏆 Tournament (Torneo)

### ¿Qué es?
Un **Tournament** es el elemento de más alto nivel que representa un torneo deportivo completo. Es el contenedor principal que organiza y coordina todas las fases de una competición.

### Características Principales
- **Múltiples Fases**: Un torneo puede tener varias fases secuenciales
- **Gestión de Estado**: Controla el estado general del torneo
- **Ranking Global**: Mantiene el ranking final del torneo
- **Configuración Centralizada**: Define reglas globales y configuraciones

---

## 📅 Phase (Fase)

### ¿Qué es?
Una **Phase** representa una fase específica dentro de un torneo. Las fases son secuenciales y cada una debe completarse antes de que comience la siguiente.

### Características Principales
- **Etapas Paralelas**: Una fase puede contener múltiples etapas que se ejecutan simultáneamente
- **Control de Flujo**: Gestiona la transición entre fases
- **Ranking de Fase**: Genera rankings que alimentan la siguiente fase
- **Validación**: Verifica que se cumplan las condiciones para avanzar

### Ejemplos de Fases
1. **Fase de Grupos**: Múltiples grupos jugando simultáneamente
2. **Fase Eliminatoria**: Octavos, cuartos, semifinales, final
3. **Fase de Clasificación**: Rondas previas de clasificación

---

## 🎯 Stage (Etapa)

### ¿Qué es?
Un **Stage** es una unidad de competición específica dentro de una fase. Representa un formato particular de competición (liga, eliminación directa, etc.).

### Tipos de Stage

#### 1. **StageGroup** (Etapa de Grupos)
- **Propósito**: Organizar equipos en grupos para competición tipo liga
- **Formato**: Todos contra todos dentro de cada grupo
- **Clasificación**: Los mejores de cada grupo avanzan


#### 2. **StagePlayoff** (Etapa Eliminatoria)
- **Propósito**: Eliminación directa entre equipos
- **Formato**: Partidos eliminatorios (ida/vuelta o partido único)
- **Clasificación**: Solo el ganador avanza


### Características Comunes de Stage
- **Gestión Temporal**: Control de fechas de inicio y fin
- **Sistema de Sorteo**: Algoritmos para asignación de equipos
- **Validación de Reglas**: Verificación de reglas de sorteo y participación
- **Generación de Rankings**: Creación de clasificaciones para siguientes fases

---

## 📊 Ranking System

### ¿Qué es?
El **Ranking** es el sistema de clasificación que determina el orden de los equipos basado en sus resultados. Es fundamental para la progresión entre fases y etapas.

### Tipos de Ranking

#### 1. **Ranking Inicial**
- Clasificación previa al torneo
- Define posiciones de siembra
- Usado para sorteos y emparejamientos

#### 2. **Ranking de Etapa**
- Generado al finalizar cada etapa
- Basado en resultados específicos de esa etapa
- Determina clasificados para siguiente fase

#### 3. **Ranking de Fase**
- Consolidado de todas las etapas de una fase
- Usado para transición entre fases
- Puede combinar múltiples rankings de etapa

#### 4. **Ranking Final**
- Clasificación final del torneo
- Determina posiciones finales de todos los participantes

### Flujo de Rankings
```
Ranking Inicial → Stage 1 → Ranking Etapa 1 → Stage 2 → Ranking Etapa 2
                     ↓                            ↓
                Fase 1 Ranking  →  Fase 2  →  Ranking Final
```

## 🕸️ GeneralStageGraph (GSG)

### ¿Qué es?
El **GeneralStageGraph** es un grafo dirigido que representa la estructura completa del torneo, mostrando cómo fluyen los equipos entre diferentes etapas y fases.

### Propósito Principal
- **Visualización**: Representación gráfica de la estructura del torneo
- **Validación**: Verificación de que la estructura es válida
- **Planificación**: Cálculo de recursos y tiempos necesarios
- **Flujo de Datos**: Control del movimiento de equipos entre etapas

### Componentes del Grafo

#### Nodos (Nodes)
1. **InitialNode**: Punto de entrada del torneo
2. **StageNode**: Representa una etapa específica
3. **RankGroupNode**: Representa un grupo de ranking
4. **FinalNode**: Punto final del torneo

#### Aristas (Edges)
- Representan el flujo de equipos entre nodos
- Direccionales (de origen a destino)
- Validadas según reglas del torneo

### Estructura del GSG
```typescript
class GeneralStageGraph {
  private _id: string;               // ID del torneo
  private _graph: DirectedGraph<NodeAttributes>; // Grafo dirigido
  private _phases: PhaseNode[];      // Nodos de fase
  
  // Métodos principales
  addNode(attributes: NodeAttributes): string;
  addDirectedEdge(source: NodeAttributes, target: NodeAttributes): string;
  getAllSimplePath(start: string, end: string): NodePath[];
  
  // Análisis del grafo
  getHwsNumberMinimum(): number;     // Semanas mínimas necesarias
  getInitialRankings(): Ranking[];   // Rankings iniciales requeridos
  getQualyRankList(): IGenericRankItem[]; // Lista de clasificación
  getFinalRankings(): Ranking[];     // Rankings finales generados
}
```

### Tipos de Nodos

#### 1. **InitialNode**
```typescript
class InitialNode extends ANode {
  data: {
    tournamentId: string;            // ID del torneo
    qualyRankList: IGenericRankItem[]; // Lista de clasificación inicial
    rankGroups: number[];            // Grupos de ranking
  }
}
```

#### 2. **StageNode**
```typescript
class StageNode extends ANode {
  data: {
    participants: number;            // Número de participantes
    // Datos específicos según tipo de etapa
  }
}
```

#### 3. **RankGroupNode**
```typescript
class RankGroupNode extends ANode {
  data: {
    sourceData: Ranking;             // Datos del ranking fuente
  }
}
```

### Creación del GSG
```typescript
// Configuración inicial
const initialCreator = {
  tournamentId: 'champions_2024',
  qualyrankList: [
    { pos: 1, origin: 'league_champion' },
    { pos: 2, origin: 'league_champion' },
    // ...
  ],
  rankGroupNumbers: [16] // 16 equipos iniciales
};

// Configuración de fases
const phaseCreators = [
  {
    id: 1,
    stages: [
      {
        count: 4, // 4 grupos
        stage: {
          type: 'group',
          value: 4, // 4 equipos por grupo
          opt: 'rr' // round robin
        }
      }
    ]
  },
  {
    id: 2,
    stages: [
      {
        count: 1, // 1 etapa eliminatoria
        stage: {
          type: 'playoff',
          value: 3, // 3 rondas (octavos, cuartos, semis, final)
          opt: 'h&a' // ida y vuelta
        }
      }
    ]
  }
];

// Crear el grafo
const gsg = createGSG(initialCreator, phaseCreators);
```

### Análisis y Validación
```typescript
// Obtener caminos posibles
const paths = gsg.getAllSimplePath('ini', 'fin');

// Calcular semanas mínimas necesarias
const minWeeks = gsg.getHwsNumberMinimum();

// Validar estructura
const isValid = paths.length > 0 && minWeeks > 0;
```

### Flujo de Información en el GSG
```
InitialNode → RankGroupNode → StageNode → RankGroupNode → ... → FinalNode
     ↓              ↓             ↓             ↓                    ↓
  Rankings    Clasificados   Resultados   Nuevos Rankings    Ranking Final
```

---

## 🔄 Flujo Completo del Sistema

### 1. Inicialización
```typescript
// Crear API y calendario
const api = SportServerAPI();
const calendar = new JCalendar(dateTime);

// Configurar entidades
const entities = api.getEntityController();
entities.loadGeogExampleData(continents, countries, towns);
```

### 2. Creación del Torneo
```typescript
// Definir estructura con GSG
const gsgData = createGSG(initialCreator, phaseCreators);

// Crear torneo
const tournament = Tournament.create(info, gsgData, calendar);
```

### 3. Ejecución
```typescript
// El calendario ejecuta automáticamente:
// 1. Eventos de inicio de etapa (sorteos, asignaciones)
// 2. Partidos programados
// 3. Eventos de fin de etapa (rankings, clasificaciones)
// 4. Transiciones entre fases
```

### 4. Resultados
```typescript
// Obtener rankings en cualquier momento
const currentRanking = tournament.getRelativeRank();

// Obtener resultados específicos
const stageResults = stage.getTable('finished');
```

---

## 🎮 Ejemplos Prácticos

### Torneo Simple (Copa)
```typescript
// 16 equipos, eliminación directa
const cupConfig = {
  phases: [{
    stages: [{
      type: 'playoff',
      participants: 16,
      rounds: 4 // octavos, cuartos, semis, final
    }]
  }]
};
```

### Torneo con Grupos + Eliminatorias
```typescript
// 32 equipos: 8 grupos de 4, luego eliminatorias
const championshipConfig = {
  phases: [
    {
      stages: [{
        type: 'group',
        groups: 8,
        participantsPerGroup: [4,4,4,4,4,4,4,4],
        qualyPerGroup: 2
      }]
    },
    {
      stages: [{
        type: 'playoff',
        participants: 16, // 2 por grupo
        rounds: 4
      }]
    }
  ]
};
```

---

## 🏢 Sistema de Entidades Deportivas

### Jerarquía de Entidades
```
Confederation (Continental)
├── Federation (Nacional)
│   ├── Institution (Club)
│   │   └── Team (Equipo por categoría)
│   ├── LeagueSystem (Sistema de Ligas)
│   └── CupSystem (Sistema de Copas)
└── GeogEntity (Geográficas)
    ├── Continent
    ├── Country
    └── Town
```

### Institution (Institución/Club)
**Propósito**: Representa un club deportivo que puede tener equipos en diferentes categorías.

```typescript
class Institution {
  private _teams: TypeCategoryList<Team> = {}; // Equipos por categoría
  
  createTeam(category: TypeCategory): void;     // Crear equipo
  getTeam(category: TypeCategory): Team;        // Obtener equipo
}
```

**Características**:
- Puede tener múltiples equipos (senior, juvenil, etc.)
- Pertenece a una ciudad específica
- Miembro de federaciones

### Federation (Federación)
**Propósito**: Organización nacional que gestiona instituciones y organiza competiciones.

```typescript
class Federation extends SportOrganization {
  // Sistemas de competición por categoría
  private _leagueSystem: TypeCategoryList<LeagueSystem>;
  private _cupSystem: TypeCategoryList<CupSystem>;
  private _rankings: TypeCategoryList<Team[]>;
  
  // Métodos principales
  addInstitutionToCategory(inst: Institution, category: TypeCategory): void;
  updateLeagueSystem(ls: LeagueSystem): void;
  createTournamentList(): ITournamentFromGSGData[];
  getRanking(category: TypeCategory): Ranking;
}
```

**Responsabilidades**:
- Gestionar instituciones miembro
- Organizar sistemas de ligas por categoría
- Mantener rankings nacionales
- Crear torneos de liga y copa

### Confederation (Confederación)
**Propósito**: Organización continental que agrupa federaciones nacionales.

```typescript
class Confederation extends SportOrganization {
  // Miembros son federaciones
  members: Map<string, Federation>;
}
```

**Responsabilidades**:
- Agrupar federaciones del continente
- Organizar competiciones continentales
- Coordinar entre federaciones

### LeagueSystem (Sistema de Ligas)
**Propósito**: Define la estructura de divisiones y ascensos/descensos de una federación.

```typescript
class LeagueSystem {
  private _category: TypeCategory;              // Categoría del sistema
  private _divisionConfigList: IDivisionConfig[]; // Configuración de divisiones
  
  getDivisionConfigList(): IDivisionConfig[];   // Obtener divisiones
  getTeamsCount(): number;                      // Total de equipos necesarios
  getGenericRankOrdered(): IGenericRankItem[];  // Ranking genérico ordenado
}

interface IDivisionConfig {
  level: number;                               // Nivel de la división (1=primera)
  condition: IDivisionCondition;               // Condición de participación
  fromGSGData: ITournamentFromGSGData;        // Datos para crear torneo
}
```

### Flujo de Entidades en el Sistema

#### 1. Creación de Estructura Geográfica
```typescript
// Continentes → Países → Ciudades
const continent = new Continent(continentData);
const country = new Country(countryData);
const town = new Town(townData);
```

#### 2. Creación de Instituciones
```typescript
// Clubes en ciudades específicas
const institution = new Institution({
  id: 'club_001',
  name: 'Club Deportivo',
  headquarters: town,
  // ...
});

// Crear equipos por categoría
institution.createTeam('senior');
institution.createTeam('juvenil');
```

#### 3. Creación de Federaciones
```typescript
// Federación nacional
const federation = new Federation({
  id: 'fed_nacional',
  areaAsosiated: country,
  founderMembers: [institution1, institution2],
  // ...
});

// Agregar instituciones a categorías
federation.addInstitutionToCategory(institution, 'senior');
```

#### 4. Configuración de Sistemas de Liga
```typescript
// Definir sistema de divisiones
const leagueSystem = new LeagueSystem({
  category: 'senior',
  divisions: [
    { level: 1, teams: 20, promote: 0, relegate: 3 },
    { level: 2, teams: 22, promote: 3, relegate: 4 },
    // ...
  ]
});

federation.updateLeagueSystem(leagueSystem);
```

#### 5. Generación de Torneos
```typescript
// La federación genera automáticamente los torneos
const tournaments = federation.createTournamentList();

// Cada torneo corresponde a una división
tournaments.forEach(tournamentData => {
  const tournament = Tournament.create(info, tournamentData, calendar);
});
```

### Integración con el Sistema de Torneos

Las entidades se integran perfectamente con el sistema de torneos:

1. **Rankings de Federación** → **Rankings Iniciales de Torneo**
2. **Equipos de Instituciones** → **Participantes del Torneo**  
3. **Sistema de Ligas** → **Configuración GSG del Torneo**
4. **Resultados de Torneo** → **Nuevos Rankings de Federación**

---

## 🕸️ Sistema de Grafos de Torneo (GeneralStageGraph)

### ¿Qué es el GeneralStageGraph?
El **GeneralStageGraph (GSG)** es un grafo dirigido que representa la estructura completa de un torneo, mostrando cómo fluyen los equipos entre diferentes etapas, fases y rankings. Es el "plano arquitectónico" del torneo.

### Tipos de Nodos en el Grafo

#### 1. **Nodos de Control**

##### InitialNode (`ini`)
**Propósito**: Punto de entrada del torneo donde se definen los equipos participantes.

```typescript
interface IInitialNodeData {
  id: 'ini';
  tournamentId: string;
  qualyRankList: IGenericRankItem[]; // Lista de clasificados inicial
  rankGroups: number[];              // Grupos de ranking [28, 2, 12]
}
```

**Características**:
- Único nodo de entrada al torneo
- Define la distribución inicial de equipos
- Genera rankings iniciales para las primeras etapas

##### FinalNode (`fin`)
**Propósito**: Punto final del torneo donde convergen todos los resultados.

```typescript
interface IFinalNodeData {
  id: 'fin';
  nodeLvl: 0;
}
```

**Características**:
- Único nodo de salida del torneo
- Recibe los rankings finales de todas las ramas
- No genera rankings (es el destino final)

#### 2. **Nodos de Etapa Real (RealStageNode)**

Estos nodos representan etapas donde se juegan partidos reales.

##### StageGroupNode (`GRP`)
**Propósito**: Etapas de grupos donde los equipos juegan en formato de liga.

```typescript
interface IStageGroupNodeData {
  participants: number;    // Total de participantes
  groupsNumber: number;    // Número de grupos
  opt: TypeBaseStageOption; // 'rr' (round robin) o 'h&a' (ida y vuelta)
}
```

**Características**:
- Divide participantes en grupos equilibrados
- Cada grupo juega formato liga (todos contra todos)
- Genera rankings por posición en grupos
- Calcula automáticamente participantes por grupo

**Ejemplo**: 16 equipos en 4 grupos = 4 equipos por grupo

##### StagePlayoffNode (`PLY`)
**Propósito**: Etapas eliminatorias donde los equipos se enfrentan en eliminación directa.

```typescript
interface IStagePlayoffNodeData {
  participants: number;    // Debe ser potencia de 2
  roundsNumber: number;    // Número de rondas eliminatorias
  opt: TypeBaseStageOption; // 'single', 'h&a', 'neutral'
}
```

**Características**:
- Eliminación directa por rondas
- Participantes debe ser potencia de 2 (8, 16, 32, etc.)
- Genera rankings por ronda de eliminación
- Soporta ida/vuelta o partido único

**Ejemplo**: 16 equipos, 4 rondas = Octavos → Cuartos → Semis → Final

#### 3. **Nodos de Procesamiento (NoneStageNode)**

Estos nodos procesan rankings sin jugar partidos.

##### TransferStageNode (`TRF`)
**Propósito**: Transfiere equipos de una etapa a otra sin modificaciones.

```typescript
interface IStageNodeData {
  participants: number; // Número de equipos que pasan
}
```

**Características**:
- No juega partidos (0 semanas de duración)
- Pasa equipos directamente a la siguiente etapa
- Útil para reorganizar flujos del torneo
- Mantiene el ranking original

##### TableStageNode (`TBL`)
**Propósito**: Divide un ranking en clasificados y eliminados.

```typescript
interface ITableStageNodeData {
  participants: number; // Total de equipos
  qNumber: number;      // Cantidad que clasifica
}
```

**Características**:
- Separa un ranking en dos grupos
- Los primeros `qNumber` clasifican
- Los restantes son eliminados
- Útil para cortes de clasificación

**Ejemplo**: De 20 equipos, los primeros 8 clasifican

##### ReOrderStageNode (`ROR`)
**Propósito**: Reordena dos rankings intercambiando su orden.

```typescript
interface IStageNodeData {
  participants: number;
}
```

**Características**:
- Recibe exactamente 2 rankings
- Invierte el orden: [A, B] → [B, A]
- Útil para dar prioridad a diferentes criterios

#### 4. **Nodos de Ranking (RankGroupNode)**

##### RankGroupNode (`RG`)
**Propósito**: Representa un grupo específico de equipos clasificados.

```typescript
interface IRankGroupNode {
  sourceData: Ranking; // Ranking que representa
}
```

**Características**:
- Conecta etapas con rankings
- Cada ranking se convierte en un RankGroupNode
- Permite flujo granular de equipos
- Tamaño más pequeño en visualización

### Flujo de Datos en el Grafo

```
InitialNode → RankGroupNode → StageNode → RankGroupNode → ... → FinalNode
     ↓              ↓             ↓             ↓                    ↓
  Equipos     Clasificados   Partidos    Nuevos Rankings    Ranking Final
```

### Ejemplo de Estructura Completa

```typescript
// Torneo con grupos + eliminatorias
const tournamentStructure = {
  ini: {
    qualyRankList: [/* 32 equipos */],
    rankGroups: [32] // Un grupo de 32 equipos
  },
  
  phase1: {
    stages: [
      {
        type: 'group',
        participants: 32,
        groupsNumber: 8,    // 8 grupos de 4 equipos
        opt: 'rr'
      }
    ]
    // Genera: 8 RankGroupNodes (primeros de cada grupo)
    //         8 RankGroupNodes (segundos de cada grupo)
    //         etc.
  },
  
  phase2: {
    stages: [
      {
        type: 'table',
        participants: 16,   // Primeros y segundos
        qNumber: 16         // Todos clasifican
      }
    ]
    // Genera: 1 RankGroupNode con 16 equipos clasificados
  },
  
  phase3: {
    stages: [
      {
        type: 'playoff',
        participants: 16,
        roundsNumber: 4,    // Octavos → Final
        opt: 'h&a'
      }
    ]
    // Genera: RankGroupNodes por cada ronda eliminada
  },
  
  fin: {
    // Recibe el ranking final del torneo
  }
};
```

### Validaciones del Grafo

El GSG realiza validaciones automáticas:

1. **Flujo de Equipos**: Verifica que el número de equipos sea consistente
2. **Conectividad**: Todos los nodos deben estar conectados
3. **Potencias de 2**: Playoffs requieren participantes en potencia de 2
4. **Grupos Equilibrados**: Grupos deben tener entre 3-20 equipos
5. **Fechas Válidas**: Suficientes semanas para completar el torneo

### Visualización del Grafo

El sistema genera automáticamente visualizaciones PNG que muestran:

- **Nodos coloreados** por tipo
- **Etiquetas descriptivas** (INI, GRP, PLY, TRF, TBL, RG, FIN)
- **Conexiones dirigidas** mostrando flujo de equipos
- **Layout automático** con espaciado de 50px
- **Dimensiones dinámicas** según complejidad del torneo

### Casos de Uso Comunes

#### Copa Simple
```
INI → RG → PLY → RG → FIN
```

#### Liga Regular
```
INI → RG → GRP → RG → FIN
```

#### Torneo Complejo
```
INI → RG → GRP → RG → TBL → RG → PLY → RG → FIN
      ↓         ↓         ↓         ↓
   32 equipos  Grupos   16 mejores  Final
```

Este sistema proporciona flexibilidad total para crear cualquier formato de torneo deportivo, desde copas simples hasta competiciones complejas con múltiples fases y formatos mixtos, todo integrado con un sistema completo de entidades deportivas que refleja la estructura real del deporte organizado.