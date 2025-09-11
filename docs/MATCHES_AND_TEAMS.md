# Sistema de Partidos y Equipos - JSport

## 🏟️ Match (Partido)

### ¿Qué es?
Un **Match** representa un partido individual entre dos equipos. Es la unidad básica de competición donde se generan los resultados que alimentan el sistema de rankings.

### Estados del Partido
```typescript
type TypeMatchState = 
  | 'created'      // Creado pero no programado
  | 'scheduled'    // Programado para una fecha
  | 'postponed'    // Pospuesto
  | 'reschuduled'  // Reprogramado
  | 'prev'         // Previo al inicio
  | 'playing'      // En curso
  | 'finished';    // Finalizado
```

### Estructura del Match
```typescript
class Match {
  private _info: IMatchInfo;         // Información del partido
  private _state: TypeMatchState;    // Estado actual
  private _homeTeam: Team;           // Equipo local
  private _awayTeam: Team;           // Equipo visitante
  private _date: JDateTime;          // Fecha y hora
  private _playing: JMatchPlay;      // Motor de simulación
  private _serie?: JSerie;           // Serie (ida/vuelta)
  
  // Métodos principales
  schedule(date: JDateTime): void;   // Programar partido
  start(): void;                     // Iniciar partido
  advance(): void;                   // Avanzar simulación
  finish(): void;                    // Finalizar partido
  
  // Propiedades
  get result(): IJResultInfo;        // Resultado del partido
  get homeTeam(): Team;              // Equipo local
  get awayTeam(): Team;              // Equipo visitante
}
```

### Información del Partido
```typescript
interface IMatchInfo {
  id: string;                        // ID único del partido
  hw: TypeHalfWeekOfYear;           // Semana del año
  season: number;                    // Temporada
  homeTeam: Team;                    // Equipo local
  awayTeam: Team;                    // Equipo visitante
  serie?: JSerie;                    // Serie asociada
  result?: IJResultInfo;             // Resultado
  allowedDraw: boolean;              // Si permite empate
  isNeutral: boolean;                // Si es en campo neutral
}
```

### Ciclo de Vida del Partido
```
created → scheduled → playing → finished
    ↓         ↓          ↓         ↓
  Creado   Programado  Jugando  Finalizado
```

### Ejemplo de Uso
```typescript
// Crear partido
const match = new Match({
  id: 'match_001',
  hw: 15, // Semana 15
  season: 2024,
  homeTeam: teamA,
  awayTeam: teamB,
  allowedDraw: true,
  isNeutral: false
});

// Programar partido
const matchDate = JDateTime.createFromHalfWeekOfYearAndYear(15, 2024, 'middle');
match.schedule(matchDate);

// Simular partido
match.start();
while (match.state === 'playing') {
  match.advance();
}

// Obtener resultado
const result = match.result;
console.log(`${result.homeGoals} - ${result.awayGoals}`);
```

---

## 👥 Team (Equipo)

### ¿Qué es?
Un **Team** representa un equipo deportivo que participa en el torneo. Mantiene información sobre la entidad que representa, categoría, partidos jugados y etapas en las que participa.

### Estructura del Team
```typescript
class Team {
  private _matches: Match[];         // Partidos del equipo
  private _entity: Institution | Federation; // Entidad que representa
  private _category: TypeCategory;   // Categoría del equipo
  private _stages: Map<string, TGS>; // Etapas donde participa
  
  get id(): string;                  // ID único del equipo
  get entity(): Institution | Federation; // Entidad
  get matches(): Match[];            // Partidos jugados
  
  // Métodos principales
  addStage(stage: TGS): void;       // Agregar etapa
  addNewMatch(match: Match): void;   // Agregar partido
  getTeamMatch(): TeamMatch;         // Obtener representación para partido
}
```

### Creación de Equipos
```typescript
interface ITeamCreator {
  entity: Institution | Federation;  // Entidad deportiva
  category: TypeCategory;            // Categoría (senior, juvenil, etc.)
  matches: Match[];                  // Partidos iniciales
}

// Ejemplo de creación
const team = new Team({
  entity: bocaJuniors,              // Institución
  category: 'senior',               // Categoría senior
  matches: []                       // Sin partidos iniciales
});
```

### ID del Equipo
El ID se genera automáticamente combinando categoría y entidad:
```typescript
get id(): string {
  return `${this._category}_${this._entity.id}`;
}
// Ejemplo: "senior_boca_juniors"
```

---

## 🏆 TeamTableItem (Item de Tabla)

### ¿Qué es?
**TeamTableItem** representa la posición de un equipo en una tabla de clasificación, incluyendo estadísticas como puntos, partidos jugados, goles, etc.

### Estructura
```typescript
class TeamTableItem {
  private _team: Team;               // Equipo
  private _bsId: string;            // ID de la etapa base
  private _stats: TeamStats;        // Estadísticas del equipo
  
  get team(): Team;                 // Equipo
  get bsId(): string;              // ID de etapa
  get points(): number;            // Puntos obtenidos
  get matchesPlayed(): number;     // Partidos jugados
  get wins(): number;              // Victorias
  get draws(): number;             // Empates
  get losses(): number;            // Derrotas
  get goalsFor(): number;          // Goles a favor
  get goalsAgainst(): number;      // Goles en contra
  get goalDifference(): number;    // Diferencia de goles
  
  getInterface(): ITeamTableItemInterface; // Interfaz para exportar
}
```

### Estadísticas del Equipo
```typescript
interface TeamStats {
  matchesPlayed: number;           // Partidos jugados
  wins: number;                    // Victorias
  draws: number;                   // Empates
  losses: number;                  // Derrotas
  goalsFor: number;               // Goles a favor
  goalsAgainst: number;           // Goles en contra
  points: number;                 // Puntos totales
}
```

### Función de Ordenamiento
```typescript
function simpleSortFunc(a: TeamTableItem, b: TeamTableItem, asc: boolean = true): number {
  // Criterios de ordenamiento:
  // 1. Puntos
  // 2. Diferencia de goles
  // 3. Goles a favor
  // 4. Partidos ganados
  
  if (a.points !== b.points) {
    return asc ? a.points - b.points : b.points - a.points;
  }
  
  if (a.goalDifference !== b.goalDifference) {
    return asc ? a.goalDifference - b.goalDifference : b.goalDifference - a.goalDifference;
  }
  
  if (a.goalsFor !== b.goalsFor) {
    return asc ? a.goalsFor - b.goalsFor : b.goalsFor - a.goalsFor;
  }
  
  return asc ? a.wins - b.wins : b.wins - a.wins;
}
```

---

## ⚽ Sistema de Simulación de Partidos

### JMatchPlay (Motor de Partido)
```typescript
class JMatchPlay {
  private _time: number = 0;        // Tiempo de juego
  private _homeTeamMatch: TeamMatch; // Equipo local en partido
  private _awayTeamMatch: TeamMatch; // Equipo visitante en partido
  private _result?: JResult;        // Resultado actual
  private _globalResult?: JResult;  // Resultado global (series)
  
  init(home: TeamMatch, away: TeamMatch): void; // Inicializar
  advance(): void;                  // Avanzar simulación
  
  get time(): number;               // Tiempo actual
  get result(): JResult;            // Resultado
}
```

### JResult (Resultado)
```typescript
class JResult {
  private _homeGoals: number;       // Goles equipo local
  private _awayGoals: number;       // Goles equipo visitante
  
  get homeGoals(): number;
  get awayGoals(): number;
  get teamWinner(): 'home' | 'away' | 'none'; // Ganador
  
  getResultInfo(): IJResultInfo;    // Información del resultado
}

interface IJResultInfo {
  homeGoals: number;               // Goles local
  awayGoals: number;               // Goles visitante
  teamWinner: 'home' | 'away' | 'none'; // Ganador
}
```

---

## 🔄 Flujo de Partidos en el Sistema

### 1. Creación y Programación
```typescript
// Los partidos se crean automáticamente cuando se asignan equipos a una etapa
stage.start(teams, calendar);

// Internamente se crean los partidos:
const match = new Match({
  id: generateMatchId(),
  homeTeam: team1,
  awayTeam: team2,
  hw: halfWeek,
  season: season,
  allowedDraw: stageConfig.allowDraw
});

// Se programan automáticamente
match.schedule(matchDate);
```

### 2. Ejecución Automática
```typescript
// El calendario ejecuta los partidos automáticamente
calendar.addEvent(new MatchEvent({
  dateTime: matchDateTime,
  match: match,
  callback: () => {
    match.start();
    while (match.state === 'playing') {
      match.advance();
    }
  }
}));
```

### 3. Actualización de Estadísticas
```typescript
// Después de cada partido, se actualizan las tablas
const result = match.result;

// Actualizar estadísticas del equipo local
homeTeamStats.matchesPlayed++;
if (result.teamWinner === 'home') {
  homeTeamStats.wins++;
  homeTeamStats.points += 3;
} else if (result.teamWinner === 'none') {
  homeTeamStats.draws++;
  homeTeamStats.points += 1;
} else {
  homeTeamStats.losses++;
}

homeTeamStats.goalsFor += result.homeGoals;
homeTeamStats.goalsAgainst += result.awayGoals;
```

### 4. Generación de Rankings
```typescript
// Al finalizar una etapa, se genera el ranking
const table = stage.getTable('finished');
const ranking = stage.getRelativeRank();

// El ranking se usa para la siguiente etapa
globalFinishedRankingsMap.set(ranking.context, ranking);
```

---

## 📊 Ejemplo Completo: Liga de 4 Equipos

```typescript
// Crear equipos
const teams = [
  new Team({ entity: boca, category: 'senior', matches: [] }),
  new Team({ entity: river, category: 'senior', matches: [] }),
  new Team({ entity: racing, category: 'senior', matches: [] }),
  new Team({ entity: independiente, category: 'senior', matches: [] })
];

// Crear liga
const league = new League(leagueInfo, leagueConfig);

// Asignar equipos (esto crea automáticamente todos los partidos)
league.assign(teams, calendar);

// Los partidos se ejecutan automáticamente según el calendario
// Fecha 1: Boca vs River, Racing vs Independiente
// Fecha 2: Boca vs Racing, River vs Independiente  
// Fecha 3: Boca vs Independiente, River vs Racing

// Obtener tabla final
const finalTable = league.getTable('finished');
console.table(finalTable.map(item => ({
  team: item.team.id,
  points: item.points,
  played: item.matchesPlayed,
  wins: item.wins,
  draws: item.draws,
  losses: item.losses,
  goalsFor: item.goalsFor,
  goalsAgainst: item.goalsAgainst,
  goalDiff: item.goalDifference
})));

// Resultado esperado:
// ┌─────────┬──────────────────┬────────┬────────┬──────┬───────┬─────────┬──────────┬──────────────┬──────────┐
// │ (index) │       team       │ points │ played │ wins │ draws │ losses  │ goalsFor │ goalsAgainst │ goalDiff │
// ├─────────┼──────────────────┼────────┼────────┼──────┼───────┼─────────┼──────────┼──────────────┼──────────┤
// │    0    │ 'senior_boca'    │   7    │   3    │  2   │   1   │    0    │    5     │      2       │    3     │
// │    1    │ 'senior_river'   │   6    │   3    │  2   │   0   │    1    │    4     │      3       │    1     │
// │    2    │ 'senior_racing'  │   3    │   3    │  1   │   0   │    2    │    3     │      4       │   -1     │
// │    3    │'senior_indep'    │   1    │   3    │  0   │   1   │    2    │    2     │      5       │   -3     │
// └─────────┴──────────────────┴────────┴────────┴──────┴───────┴─────────┴──────────┴──────────────┴──────────┘
```

Este sistema proporciona una simulación completa y realista de partidos deportivos, con estadísticas detalladas y rankings automáticos que alimentan el flujo del torneo.