# Sistema de Partidos y Equipos - jl-sprt

Este documento describe el sistema de partidos, equipos y tablas de posiciones. El sistema es **multi-deporte**: las clases base son abstractas y cada deporte las implementa a través de un `SportProfile`.

---

## 🏟️ A_Match (Partido)

### ¿Qué es?
`A_Match<ScoreType>` es la clase abstracta que representa un partido individual entre dos equipos. La lógica común (programar, iniciar, avanzar, finalizar) vive en la clase base; cada deporte provee su propio `A_MatchPlay` para la simulación.

Cada perfil de deporte define su clase concreta: `FootballMatch`, `VolleyMatch`, `AFMatch`, etc.

### Estados del Partido
```typescript
type TypeMatchState =
  | 'created'      // creado pero no programado
  | 'scheduled'    // programado para una fecha
  | 'postponed'    // pospuesto
  | 'reschuduled'  // reprogramado
  | 'prev'         // previo al inicio
  | 'playing'      // en curso
  | 'finished';    // finalizado
```

### Estructura (abstracta)
```typescript
abstract class A_Match<ScoreType extends TMatchScore> {
  protected _state: TypeMatchState;
  protected _id: string;
  protected _homeTeam: Team;
  protected _awayTeam: Team;
  protected _date: JDateTime;
  protected _allowedDraw: boolean;
  protected _playing: A_MatchPlay<ScoreType>;   // motor de simulación (por deporte)

  get id(): string;
  get homeTeam(): Team;
  get awayTeam(): Team;
  get date(): JDateTime;
  get state(): TypeMatchState;
  get isFinished(): boolean;
  get result(): IA_ResultInfo<ScoreType> | undefined;

  schedule(d: JDateTime): void;   // programar
  start(): void;                  // iniciar (inicializa el A_MatchPlay)
  finish(): void;                 // finalizar
  abstract advance(): void;       // avanzar la simulación (implementado por cada deporte)
}
```

### Creación
Los partidos se crean a través del `SportProfile`, no directamente. Por ejemplo, en una liga o eliminatoria:

```typescript
const match = sportProfile.createMatch({
  id: 'match_001',
  hw: 15,               // media semana del año
  season: 2024,
  homeTeam: teamA,
  awayTeam: teamB,
  allowedDraw: true,
  isNeutral: false,
});
```

---

## 👥 Team (Equipo)

### ¿Qué es?
Un **Team** representa un equipo que participa en el torneo. Mantiene la entidad que representa, la categoría, los partidos jugados y las etapas en las que participa.

Un Team puede representar:
- una **Institution** (club) → participa en ligas/copas nacionales y torneos confederativos de clubes
- una **Federation** (selección nacional) → participa en torneos confederativos e internacionales de selecciones

### Estructura
```typescript
class Team {
  private _matches: A_Match<any>[];
  private _entity: Institution | Federation;
  private _category: TypeCategory;
  private _stages: Map<string, TGS>;

  get id(): string;                          // `${category}_${entity.id}`
  get entity(): Institution | Federation;
  get matches(): A_Match<any>[];

  addStage(stage: TGS): void;
  addNewMatch(match: A_Match<any>): void;
  getTeamMatch(): TeamMatch;                 // representación ligera para el partido
}
```

### Creación
```typescript
interface ITeamCreator {
  entity: Institution | Federation;
  category: TypeCategory;
  matches: A_Match<any>[];
}

const team = new Team({
  entity: bocaJuniors,
  category: 'S',    // senior
  matches: [],
});
```

### ID del Equipo
El ID combina categoría y entidad:
```typescript
get id(): string { return `${this._category}_${this._entity.id}`; }
// Ejemplo: "S_boca_juniors"
```

---

## 🏆 A_TeamTableItem (Item de Tabla)

### ¿Qué es?
`A_TeamTableItem<Res, Punt>` es la clase abstracta que representa la fila de un equipo en una tabla de clasificación. Es genérica sobre:
- `Res`: tipos de resultado del deporte (ej. fútbol: `'W' | 'D' | 'L'`)
- `Punt`: tipos de puntuación del deporte (ej. fútbol: `'gf' | 'ga'`)

Cada deporte define su clase concreta con su propia lógica de puntos y ordenamiento: `FootballTeamTableItem`, `VolleyTeamTableItem`, `AFTeamTableItem`.

### Estructura (abstracta)
```typescript
abstract class A_TeamTableItem<Res extends string, Punt extends string> {
  get team(): Team;
  get bsId(): string;                 // id del BaseStage
  get pos(): number;                  // posición (asignada al ordenar)
  get P(): number;                    // partidos jugados (suma de resultados)
  get matchResults(): { [k in Res]: number };
  get matchPuntuations(): { [k in Punt]: number };

  abstract get ps(): number;          // puntos (definido por deporte)
  abstract getSortFunc(): SortFunc;   // función de ordenamiento (definida por deporte)

  addMatchResult(r: Res): void;
  addMatchPuntuation(p: Punt): void;
  getInterface(): IA_TeamTableItemBase;
}
```

### Ordenamiento
La función de ordenamiento **la provee cada item concreto** mediante `getSortFunc()`. El consumidor (League, SingleElimination) no importa una función hardcodeada:

```typescript
const items = this.calcTableValues(ttms);
if (items.length > 0) {
  const sortFunc = items[0].getSortFunc();  // viene del tipo concreto del deporte
  items.sort((a, b) => sortFunc(a, b, isSingleElimination));
}
```

Así, `FootballTeamTableItem.getSortFunc()` ordena por puntos, diferencia de goles, etc., mientras que otro deporte puede ordenar con criterios distintos, sin cambiar el resto del sistema.

---

## ⚽ Simulación: A_MatchPlay y A_Result

### A_MatchPlay (Motor de Partido)
```typescript
abstract class A_MatchPlay<ScoreType> {
  protected _time: number;
  protected _result: A_Result<ScoreType> | undefined;

  abstract init(one: TeamMatch, two: TeamMatch): void;
  abstract advance(): void;
  get time(): number;
  get result(): A_Result<ScoreType> | undefined;
}
```

Cada deporte implementa `advance()` con su propia lógica de simulación (por ejemplo, probabilidad de gol por intervalo en fútbol).

### A_Result (Resultado)
```typescript
abstract class A_Result<ScoreType> {
  abstract getResultInfo(): IA_ResultInfo<ScoreType>;
  // + métodos para registrar y consultar el score (definidos por deporte)
}
```

El `ScoreType` varía por deporte: `number` para fútbol/basket (goles/puntos), estructuras más ricas para volleyball (sets + puntos por set), etc.

### A_Serie (Series ida/vuelta)
`A_Serie<MS, SS>` generaliza las eliminatorias a doble partido. Cada deporte resuelve el desempate de forma distinta (goles globales en fútbol, Golden Set en volleyball, etc.). El `SportProfile` provee el factory `createSerie()`.

---

## 🎛️ ISportProfile

Todo lo específico de un deporte se encapsula en un `ISportProfile`, que actúa como fábrica:

```typescript
interface ISportProfile<MatchScoreType, SerieScoreType, Res extends string, Punt extends string> {
  createMatch(info: IMatchCreationInfo): A_Match<MatchScoreType>;
  createSerie(info: ISerieCreationInfo): A_Serie<MatchScoreType, SerieScoreType>;
  createResult(teamOneId: string, teamTwoId: string): A_Result<MatchScoreType>;
  createMatchPlay(globalResult?: A_Result<MatchScoreType>): A_MatchPlay<MatchScoreType>;
  createTableItem(team: Team, bsId: string): A_TeamTableItem<Res, Punt>;
  updateTableFromResult(tti: A_TeamTableItem<Res, Punt>, resultInfo: IA_ResultInfo<MatchScoreType>, teamId: string): void;
}
```

Perfiles implementados:
- `FootballProfile` — fútbol (goles; 3 pts victoria, 1 pt empate)
- `VolleyballProfile` — volleyball (sets, puntos por set)
- `AmericanFootballProfile` — fútbol americano

Agregar un deporte nuevo = crear un profile con sus clases concretas (`A_Match`, `A_Result`, `A_MatchPlay`, `A_TeamTableItem`, `A_Serie`). El resto del sistema (Tournament, Phase, Stage, GSG, JCalendar, Entities) no cambia.

---

## 🔄 Flujo de Partidos en el Sistema

### 1. Asignación y creación
Al iniciar un Stage (evento `Event_StageStart`), se sortean los equipos y el `BaseStage` crea los partidos vía `sportProfile.createMatch()` / `createSerie()`.

### 2. Ejecución por el calendario
El `JCalendar` avanza en el tiempo y ejecuta los eventos de partido en su fecha. Cada partido se simula con su `A_MatchPlay`.

### 3. Cálculo de la tabla
`BaseStage.calcTableValues()` construye las filas usando el profile:

```typescript
this.participants.forEach((team) =>
  out.push(this._sportProfile.createTableItem(team, this.info.id))
);

this.matches.forEach((m) => {
  if (condicion(m) && m.result) {
    const homeTTI = out.find(t => t.team.id === m.homeTeam.id);
    const awayTTI = out.find(t => t.team.id === m.awayTeam.id);
    this._sportProfile.updateTableFromResult(homeTTI, m.result, homeTTI.team.id);
    this._sportProfile.updateTableFromResult(awayTTI, m.result, awayTTI.team.id);
  }
});
```

### 4. Generación del ranking
Al finalizar la etapa (`Event_StageEnd`), se ordena la tabla y se genera el `Ranking` (`rs_<stageId>`), que se guarda en el `RankingStore`.

```typescript
const ranking = stage.getRelativeRank();
globalFinishedRankingsMap.set(ranking.context, ranking);
```

---

## Resumen

- Los partidos y tablas son **abstractos y parametrizados por deporte**.
- El `SportProfile` es la única pieza que conoce las reglas concretas de cada deporte.
- El ordenamiento de la tabla lo define cada `A_TeamTableItem` concreto vía `getSortFunc()`.
- El resultado de cada etapa alimenta el sistema de rankings, que conecta con la evolución de las federaciones temporada a temporada.
