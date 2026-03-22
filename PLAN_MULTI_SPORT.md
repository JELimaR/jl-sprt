# Plan de Generalización Multi-Deporte

## Estado Actual

El sistema tiene una base genérica parcial con `A_TeamTableItem<Res, Punt>`, pero el resto del sistema (Match, Result, BaseStage, League, SingleElimination, Stage) está hardcodeado a fútbol: usa `TeamTableItem` directamente, `simpleSortFunc`, y `Result` asume scores de goles.

### Archivos Afectados

| Archivo | Problema |
|---------|----------|
| `Match/Result.ts` | `score: number` asume goles |
| `Match/MatchPlay.ts` | `advance()` simula goles con probabilidad fija |
| `Match/Match.ts` | Crea `JMatchPlay` directamente |
| `Tournament/Stage/BaseStage.ts` | `calcTableValues()` crea `new TeamTableItem()` y llama `addWM()`, `addGf()`, etc. |
| `Tournament/Stage/StageGroup/League/League.ts` | Importa `simpleSortFunc` de `TeamTableItem` |
| `Tournament/Stage/StagePlayoff/SingleElimination/SingleElmination.ts` | Importa `simpleSortFunc` de `TeamTableItem` |
| `Tournament/Stage/Stage.ts` | `getTable()` retorna `TeamTableItem[]` |

### Lo que NO cambia
- `Ranking`, `IGenericRankItem`, `IRankItem` → agnósticos del deporte
- `GSG` y toda la estructura de grafos → no dependen del deporte
- `JCalendar` y eventos → agnósticos
- `Entities` (Federation, Institution, etc.) → agnósticos
- La estructura Tournament → Phase → Stage → BaseStage → no cambia, solo se parametriza

---

## Concepto Central: `ISportProfile`

Un `ISportProfile` encapsula todo lo específico de un deporte: cómo se crea un resultado, cómo se simula un partido, cómo se crea un item de tabla, y cómo se actualizan las estadísticas desde un resultado.

```typescript
interface ISportProfile<Res extends string, Punt extends string> {
  createResult(teamOneId: string, teamTwoId: string): A_Result<any>;
  createMatchPlay(globalResult?: A_Result<any>): A_MatchPlay<any>;
  createTableItem(team: Team, bsId: string): A_TeamTableItem<Res, Punt>;
  updateTableFromResult(
    tti: A_TeamTableItem<Res, Punt>,
    resultInfo: IJResultInfo,
    isHome: boolean
  ): void;
}
```

### Sobre el ordenamiento (sort)

La función de ordenamiento **ya viene definida en cada implementación concreta** de `A_TeamTableItem` (por ejemplo, `GoalTeamTableItem.getSortFunc()`). El `ISportProfile` no necesita duplicar esa lógica: al crear el `TableItem` correcto vía `createTableItem()`, el sort se obtiene del propio item con `getSortFunc()`.

Es decir, el Profile asocia indirectamente el sort al crear la instancia concreta correcta:

```
FootballProfile.createTableItem() → GoalTeamTableItem → getSortFunc() → goalSimpleSortFunc
BasketballProfile.createTableItem() → BasketTeamTableItem → getSortFunc() → basketSortFunc
```

El consumidor (League, SingleElimination) solo necesita:
```typescript
const items = this.calcTableValues(ttms);
const sortFunc = items[0].getSortFunc(); // viene del tipo concreto
items.sort((a, b) => sortFunc(a, b, isSE));
```

---

## Capas a Modificar (de abajo hacia arriba)

### Capa 1: `A_Result` y `GoalResult`

Extraer la lógica actual de `JResult` a una clase abstracta.

```typescript
// A_Result.ts (nuevo)
abstract class A_Result<ScoreType> {
  abstract addScore(teamId: string, ...args: any[]): void;
  abstract getScore(teamId: string): ScoreType;
  abstract getResultInfo(): IJResultInfo;
  abstract getTeamResultInfo(teamId: string): {
    res: string;
    puntuations: Record<string, number>;
  };
}

// GoalResult.ts (renombrar/refactorear JResult)
class GoalResult extends A_Result<number> {
  // Lo que hoy es JResult, sin cambios funcionales
}
```

**Deportes diferentes**:
- Fútbol: `GoalResult` → score es `number` (goles)
- Basketball: `BasketResult` → score es `number` (puntos)
- Volleyball: `VolleyResult` → score podría ser `{ sets: number, points: number[] }`

### Capa 2: `A_MatchPlay` y `GoalMatchPlay`

Extraer la simulación a una clase abstracta.

```typescript
// A_MatchPlay.ts (nuevo)
abstract class A_MatchPlay<ScoreType> {
  abstract init(one: TeamMatch, two: TeamMatch): void;
  abstract advance(): void;
  abstract get time(): number;
  abstract get result(): A_Result<ScoreType> | undefined;
}

// GoalMatchPlay.ts (renombrar/refactorear JMatchPlay)
class GoalMatchPlay extends A_MatchPlay<number> {
  // La simulación actual: Math.random() < 0.10 para goles
}
```

### Capa 3: `Match` → Usar el Profile

`Match` recibe el `ISportProfile` para crear el `MatchPlay` y `Result` correctos.

```typescript
class Match {
  constructor(imi: IMatchInfo, sportProfile: ISportProfile<any, any>) {
    // ...
    this._playing = sportProfile.createMatchPlay(this._serie?.result);
  }
}
```

### Capa 4: `BaseStage.calcTableValues()` → Usar el Profile

Hoy crea `new TeamTableItem(...)` y llama métodos específicos de fútbol. Con el profile:

```typescript
calcTableValues(ttms: TypeTableMatchState): A_TeamTableItem<any, any>[] {
  const out: A_TeamTableItem<any, any>[] = [];
  this.participants.forEach((team) =>
    out.push(this._sportProfile.createTableItem(team, this.info.id))
  );

  this.matches.forEach((m: Match) => {
    if (matchConditionFunc(m) && m.result) {
      let homeTTI = out.find(t => t.team.id === m.homeTeam.id);
      let awayTTI = out.find(t => t.team.id === m.awayTeam.id);
      if (homeTTI && awayTTI) {
        // Delegado al profile en vez de addWM/addGf hardcodeado
        this._sportProfile.updateTableFromResult(homeTTI, m.result, true);
        this._sportProfile.updateTableFromResult(awayTTI, m.result, false);
      }
    }
  });

  return out;
}
```

### Capa 5: `League` y `SingleElimination` → Sort genérico

Reemplazar `simpleSortFunc` importado por el sort del propio item:

```typescript
// League.getTable()
getTable(ttms: TypeTableMatchState): A_TeamTableItem<any, any>[] {
  let out = this.calcTableValues(ttms);
  if (out.length > 0) {
    const sortFunc = out[0].getSortFunc();
    out.sort((a, b) => sortFunc(a, b, false));
  }
  out.forEach((tti, idx) => tti.pos = idx + 1);
  return out;
}

// SingleElimination.getTable()
getTable(ttms: TypeTableMatchState): A_TeamTableItem<any, any>[] {
  let out = this.calcTableValues(ttms);
  // ... asignar pos por ronda ...
  if (out.length > 0) {
    const sortFunc = out[0].getSortFunc();
    out.sort((a, b) => sortFunc(a, b, true));
  }
  return out;
}
```

### Capa 6: `Stage` → Tipo de retorno genérico

```typescript
abstract getTable(ttms: TypeTableMatchState): A_TeamTableItem<any, any>[];
```

`getRelativeRank()` no cambia porque solo usa `tti.team`, `tti.bsId` y `tti.pos`, que están en `A_TeamTableItem`.

### Capa 7: Propagación del Profile

Tournament → Phase → Stage → BaseStage → Match

```typescript
// Tournament recibe el profile
const tournament = Tournament.create(info, gsgData, calendar, sportProfile);

// Lo propaga internamente
Phase.create(phaseInfo, phaseConfig, calendar, sportProfile);
Stage.create(stageInfo, stageConfig, calendar, sportProfile);
BaseStage.constructor(info, config, sportProfile);
Match.constructor(matchInfo, sportProfile);
```

---

## Implementación del `FootballProfile`

```typescript
class FootballProfile implements ISportProfile<GoalMatchResults, GoalMatchPuntuations> {

  createResult(teamOneId: string, teamTwoId: string): GoalResult {
    return new GoalResult(teamOneId, teamTwoId);
  }

  createMatchPlay(globalResult?: A_Result<any>): GoalMatchPlay {
    return new GoalMatchPlay(globalResult);
  }

  createTableItem(team: Team, bsId: string): GoalTeamTableItem {
    return new GoalTeamTableItem(team, bsId);
  }

  updateTableFromResult(
    tti: GoalTeamTableItem,
    resultInfo: IJResultInfo,
    isHome: boolean
  ): void {
    const myScore = isHome
      ? resultInfo.teamOneScore.score
      : resultInfo.teamTwoScore.score;
    const theirScore = isHome
      ? resultInfo.teamTwoScore.score
      : resultInfo.teamOneScore.score;
    const myTeamId = tti.team.id;

    tti.addGf(myScore);
    tti.addGa(theirScore);

    if (resultInfo.teamWinner === myTeamId) {
      tti.addWM();
    } else if (resultInfo.teamLoser === myTeamId) {
      tti.addLM();
    } else {
      tti.addDM();
    }
  }
}
```

---

## Orden de Implementación

| Paso | Tarea | Archivos |
|------|-------|----------|
| 1 | Crear `A_Result` abstracto, refactorear `JResult` → `GoalResult` | `Match/A_Result.ts`, `Match/GoalResult.ts` |
| 2 | Crear `A_MatchPlay` abstracto, refactorear `JMatchPlay` → `GoalMatchPlay` | `Match/A_MatchPlay.ts`, `Match/GoalMatchPlay.ts` |
| 3 | Crear `ISportProfile` y `FootballProfile` | `profiles/ISportProfile.ts`, `profiles/FootballProfile.ts` |
| 4 | Modificar `BaseStage.calcTableValues()` para usar profile | `Tournament/Stage/BaseStage.ts` |
| 5 | Modificar `League.getTable()` y `SingleElimination.getTable()` | `League.ts`, `SingleElmination.ts` |
| 6 | Cambiar `Stage.getTable()` return type a `A_TeamTableItem` | `Tournament/Stage/Stage.ts` |
| 7 | Modificar `Match` para recibir profile | `Match/Match.ts` |
| 8 | Propagar profile: Tournament → Phase → Stage → BaseStage → Match | Varios |

---

## Ejemplo de Uso Final

```typescript
const footballProfile = new FootballProfile();
const basketballProfile = new BasketballProfile();

// Torneo de fútbol
const footballTournament = Tournament.create(info, gsgData, calendar, footballProfile);

// Torneo de basketball  
const basketballTournament = Tournament.create(info, gsgData, calendar, basketballProfile);
```

---

## Ejemplo: Agregar Basketball

Para agregar un nuevo deporte, se necesitan:

1. `BasketResult extends A_Result<number>` → puntos en vez de goles
2. `BasketMatchPlay extends A_MatchPlay<number>` → simulación de basketball
3. `BasketTeamTableItem extends A_TeamTableItem<BasketRes, BasketPunt>` → con su propio `getSortFunc()`
4. `BasketballProfile implements ISportProfile<BasketRes, BasketPunt>`

El resto del sistema (Tournament, Phase, Stage, GSG, Calendar, Entities) funciona sin cambios.
