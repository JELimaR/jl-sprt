# Plan — separar dependencias de `jl-sprt-core` y `jl-sprt-match`

> Estado: **plan de refactorización**.
> No describe una implementación ya realizada. El objetivo es eliminar las
> dependencias invertidas y modelar correctamente la participación de un equipo
> en un partido.

## 1. Objetivo

Conseguir una dirección de dependencias estable:

```text
jl-sprt-core
    <- jl-sprt-match
    <- JSportModule / engine
```

En particular:

- `jl-sprt-core` no debe importar desde `JSportModule` ni desde `Tournament`.
- `jl-sprt-match` debe depender del core y de librerías externas neutrales,
  no de los modelos concretos del engine.
- `JSportModule` debe orquestar entidades, calendario, stages y ranking sin
  definir los contratos fundamentales del partido.
- La participación de un equipo en un partido debe modelarse como un `TeamRoster`,
  no como un `LineUp` limitado ni como otro `Team`.

## 2. Problemas actuales

### 2.1. Dependencias invertidas del core

Actualmente el core importa directamente:

- `Team` desde `JSportModule/data/Team`.
- `TeamMatch` desde `JSportModule/data/Team`.
- `TypeBaseStageOption` desde `JSportModule/data`.
- `A_TeamTableItem` desde `JSportModule/Ranking`.
- `JEventMatch` desde `JSportModule/Match/EventMatch`.

Esto produce acoplamientos y ciclos como:

```text
A_Match -> Team -> A_Match
A_Match -> EventMatch -> A_Match
jl-sprt-core -> JSportModule
```

El core deja de ser reutilizable y el engine se convierte en una dependencia
transitiva de todas las implementaciones de match.

### 2.2. `Team` mezcla varias responsabilidades

El `Team` actual representa simultáneamente:

- identidad del equipo;
- relación con `Institution` o `Federation`;
- pertenencia a stages;
- historial y calendario de matches;
- estado deportivo de la temporada;
- creación del objeto `TeamMatch`.

El historial no debe eliminarse: el `Team` lo necesita para decidir convocatorias,
carga, cansancio y forma. Lo que debe separarse es la identidad institucional de
la evolución deportiva y de la participación puntual en un match.

### 2.3. `TeamMatch` no modela correctamente la participación

`TeamMatch` se encuentra dentro de `Team.ts`, depende del engine y contiene un
`Player` vacío. Además, el mismo tipo se usa para fútbol, volleyball y
American Football, aunque cada deporte tiene reglas distintas para:

- número de titulares;
- suplentes;
- posiciones;
- cambios;
- restricciones de jugadores;
- estados durante el partido.

La distinción entre el equipo de temporada y su participación concreta en un
match es necesaria. El nombre correcto será `TeamRoster`, y debe representar el
estado operativo del equipo desde que comienza el match hasta que termina:
jugadores disponibles, titulares, suplentes, formación, estrategia y cambios.

### 2.4. `ISportProfile` mezcla match y ranking

El contrato actual obliga al profile deportivo a crear:

- match;
- serie;
- resultado;
- simulador;
- tabla de posiciones;
- actualización de ranking.

La parte de match es propia de `jl-sprt-match`; la tabla es una integración con
el sistema de competición/ranking del engine.

## 3. Arquitectura objetivo

### 3.1. `jl-sprt-core`

Debe contener únicamente contratos y modelos neutrales:

```text
TeamRef / Team
Person              (persona reutilizable por instituciones, árbitros,
             entrenadores, administración y jugadores)
A_Match
A_MatchPlay
A_Result
A_ResultSerie
A_Serie
A_TeamTableItem y contratos genéricos de ranking
scores genéricos
contratos mínimos de calendario, si son necesarios
```

El core no debe conocer:

- `Institution`;
- `Federation`;
- `Stage`;
- `Tournament`;
- `Ranking`;
- `EventMatch`;
- jugadores concretos de un deporte;
- `FootballScore`, `IVolleyScore`, etc.

### 3.2. `jl-sprt-match`

Debe contener las implementaciones concretas por deporte:

```text
football/
  FootballMatch
  FootballMatchPlay
  FootballResult
  FootballSerie
  FootballPlayer
  FootballTeamRoster
  FootballProfile

volleyball/
  VolleyMatch
  VolleyMatchPlay
  VolleyResult
  VolleySerie
  VolleyPlayer
  VolleyballTeamRoster
  VolleyballProfile

americanFootball/
  AFMatch
  AFMatchPlay
  AFResult
  AFSerie
  AmericanFootballPlayer
  AmericanFootballTeamRoster
  AmericanFootballProfile
```

También pueden vivir aquí los scores específicos y la fuente de aleatoriedad
usada por las simulaciones.

### 3.3. `JSportModule` / engine

Debe conservar la orquestación del sistema:

```text
Institution
Federation
Stage
Tournament
Calendar
EventMatch
Ranking
  TeamRegistry / CompetitionTeam
```

`EventMatch` debe recibir o adaptarse a un `A_Match`; `A_Match` no debe crear
`EventMatch` directamente.

## 4. Modelo de equipo y participación

### 4.1. Equipo y evolución temporal

Crear un contrato neutral en core para que el match pueda referirse a un equipo
sin depender de `Institution` o `Federation`:

```typescript
export interface TeamRef {
  readonly id: string;
  readonly name: string;
}
```

Inicialmente puede ser una interfaz para reducir el impacto del refactor. El
`Team` de dominio no debe reducirse a una identidad inmutable: vive durante el
ciclo deportivo que el dominio defina y conserva estado deportivo, historial,
calendario, objetivos, obligaciones, entrenamiento, forma y química.

No se introducirá `TeamSeason` por ahora. El propio `Team` gestionará su estado
temporal y podrá mantener historiales o snapshots internos cuando sea necesario.
Una abstracción temporal separada solo se añadirá si el código demuestra que el
estado de una época debe existir de forma independiente del equipo.

El `Team` actual del engine puede implementar `TeamRef` sin que `TeamRef` conozca
sus entidades propietarias.

### 4.2. Asociación con entidades y afiliaciones

Separar la relación institucional del equipo:

```text
CompetitionTeam / ManagedTeam
  team: TeamRef
  entity: Institution | Federation
  category: TypeCategory
  stages
  competition history
  institutional affiliation history
```

La relación puede ser unidireccional desde el engine hacia el equipo:

```text
Institution/Federation -> Team
```

El core no debe importar `Institution` ni `Federation`. El engine puede aportar
un `ManagedTeam` o `CompetitionTeam` que implemente `TeamRef` y mantenga esa
relación, además del estado deportivo e institucional.

Una afiliación no implica que el equipo se transforme en otro equipo. Por
ejemplo, si Estrella Roja pertenece a una institución que inicialmente está
vinculada a la Federación Yugoslava y, tras cambios históricos, esa institución
pasa a relacionarse con la Federación Serbia, el equipo sigue siendo Estrella
Roja. Lo que cambia es la relación institucional, que debe registrarse como un
proceso histórico con fecha o vigencia, no como una sustitución instantánea de
identidad ni como la creación de una selección nacional distinta.

### 4.3. `Person` y `Player`

No mantener un `Player` vacío dentro de `Team.ts`.

Modelo propuesto:

```text
Person
  identidad humana común

Player
  persona que participa en un deporte

FootballPlayer / VolleyPlayer / AFPlayer
  atributos, posiciones y reglas específicas del deporte
```

`Person` sí pertenece al core porque tendrá usos reales fuera de los matches:
instituciones, árbitros, entrenadores, administración y jugadores pueden
referenciar la misma identidad humana.

Las características deportivas no pertenecen a `Person`. `Player` puede ser un
rol o una composición de `Person`, y las especializaciones por deporte deben
vivir en `jl-sprt-match`.

No usar `PlayerMatch` como identidad alternativa del jugador. El estado dentro de
un partido debe modelarse como participación:

```text
TeamRoster
  contiene jugadores disponibles para el partido
  conoce titulares y suplentes
  permite sustituciones y cambios de estado
```

### 4.4. `TeamMatch` -> `TeamRoster`

Renombrar conceptualmente `TeamMatch` a `TeamRoster`. El roster será específico
por deporte y formará parte de la configuración del profile:

```text
FootballProfile -> FootballTeamRoster
VolleyballProfile -> VolleyballTeamRoster
AmericanFootballProfile -> AmericanFootballTeamRoster
```

El roster lo crea el `Team`, mediante la política deportiva del profile o una
fábrica asociada al equipo. No debe crearse al construir el `Match`, porque el
match puede programarse meses antes de jugarse y los titulares pueden lesionarse
o cambiar antes del inicio.

Al iniciar el partido, el engine/profile debe pedir al `Team` un snapshot actual
del roster:

```text
  Team (estado deportivo + calendario)
  -> crea TeamRoster actual
  -> Match.start(roster)
  -> roster evoluciona hasta finish()
```

El core solo debe parametrizar el tipo de roster:

```typescript
abstract class A_MatchPlay<ScoreType, RosterType> {
  abstract init(home: RosterType, away: RosterType): void;
}
```

Ejemplos:

```typescript
A_MatchPlay<number, FootballTeamRoster>
A_MatchPlay<IVolleyScore, VolleyballTeamRoster>
```

El roster debe soportar cambios, no solo describir la alineación inicial:

- titulares y suplentes;
- disponibilidad e indisponibilidad;
- formación;
- estrategia general;
- sustituciones;
- expulsiones, lesiones y cambios de posición, si el deporte los necesita.

Así un cambio de jugador no exige cambiar el equipo estable ni introducir reglas
de fútbol en el core.

## 5. Profile deportivo cohesivo

No se dividirá el profile en `ISportMatchProfile` e `ISportRankingProfile`.
En este dominio, el resultado de un partido determina estadísticas, puntuación,
desempates y ordenamiento. Esas reglas forman parte natural del deporte y deben
permanecer juntas.

El profile completo pertenece a `jl-sprt-match` y su definición concreta también:

```typescript
interface ISportProfile<MatchScore, SerieScore, Roster, ResultKey, PunctuationKey> {
  createMatch(info: IMatchCreationInfo): A_Match<MatchScore>;
  createSerie(info: ISerieCreationInfo): A_Serie<MatchScore, SerieScore>;
  createResult(teamOneId: string, teamTwoId: string): A_Result<MatchScore>;
  createMatchPlay(): A_MatchPlay<MatchScore, Roster>;
  createTeamRoster(team: TeamRef, context: TeamRosterContext): Roster;
  createTableItem(team: TeamRef, baseStageId: string): A_TeamTableItem<ResultKey, PunctuationKey>;
  updateTableFromResult(...): void;
}
```

Por tanto, `FootballProfile`, `VolleyballProfile` y
`AmericanFootballProfile` definen conjuntamente:

- cómo se simula el partido;
- qué resultado produce;
- qué score utiliza;
- cómo se crea el `TeamRoster`;
- qué estadísticas acumula el equipo;
- cómo se puntúa una tabla;
- cómo se ordena el ranking;
- cómo se resuelven las series y sus desempates.

`A_TeamTableItem`, `IA_TeamTableItemBase`, `AnyTeamTableItem` y `SortFunc`
pueden vivir en `jl-sprt-core` como abstracciones genéricas de ranking. Los
`FootballTeamTableItem`, `VolleyTeamTableItem` y equivalentes permanecen junto
al profile concreto en `jl-sprt-match`. `Ranking` continúa en el engine y
consume el profile, pero no define las reglas deportivas.

La separación entre profile de match y profile de ranking solo sería necesaria si
el mismo deporte tuviera varias reglas de ranking intercambiables e independientes
de sus resultados. No es la situación actual y no se introducirá esa complejidad
por ahora.

## 6. Granularidad del paquete de deportes

La primera implementación mantendrá un único paquete lógico `jl-sprt-match`,
organizado internamente por deporte:

```text
jl-sprt-match/
  football/
  volleyball/
  americanFootball/
```

Esto permite compartir los contratos del core, mantener una API coherente y
evitar versionar tres paquetes mientras todavía evolucionan los límites de
`Team`, `TeamRoster`, `Person` y `SportProfile`.

No se crearán todavía paquetes independientes como `jl-sprt-football` o
`jl-sprt-volleyball`. Esa extracción tendrá sentido si un deporte necesita:

- publicarse o versionarse por separado;
- dependencias propias incompatibles con otros deportes;
- ciclos de desarrollo y releases independientes;
- ser instalado sin incluir los demás deportes;
- un equipo de mantenimiento o una API pública independiente.

La estructura actual deja abierta esa extracción futura: cada subcarpeta debe
evitar depender de otra subcarpeta deportiva y compartir únicamente core y
dependencias neutrales.

## 7. Plan de ejecución por fases

### Fase 1 — congelar contratos y registrar dependencias

- Crear tests de compilación/importación para `jl-sprt-core`.
- Documentar los imports permitidos y prohibidos.
- Confirmar que ningún archivo de core importa `JSportModule`, `Tournament` o
  un profile concreto.
- No cambiar aún el comportamiento de los partidos.

Criterio de salida:

```text
jl-sprt-core no añade nuevas dependencias hacia el engine.
```

### Fase 2 — extraer contratos mínimos de equipo

- Crear `TeamRef` en core.
- Crear `Person` en core con identidad reutilizable fuera del match.
- Hacer que el `Team` del engine implemente `TeamRef`.
- Cambiar `A_Match`, `A_Serie` e `IMatchCreationInfo` para usar `TeamRef`.
- Mantener temporalmente el `Team` del engine como adaptador con su historial,
  calendario y estado deportivo.
- Mantener en `Team` el estado temporal, los objetivos, obligaciones, entrenamiento,
  forma, química, historial y calendario.
- Modelar el historial de afiliaciones institucionales sin cambiar la identidad
  del equipo ni convertirlo en otro equipo.
- Eliminar de los contratos core métodos como `addNewMatch` y `getTeamMatch`;
  el historial seguirá siendo responsabilidad del `Team` o del engine que lo
  gestione, pero no del contrato mínimo `TeamRef`.

Criterio de salida:

```text
A_Match y A_Serie pueden compilar sin importar Team.ts.
```

### Fase 3 — desacoplar calendario y `EventMatch`

- Crear una capa `Scheduling`/`MatchScheduler` en el engine.
- Hacer que `EventMatch` sea el adaptador entre calendario y match.
- Evitar que `A_Match` instancie `JEventMatch`.
- Mantener inicialmente una operación equivalente a `match.schedule()` que solo
  cambie el estado del match o delegue al scheduler, sin importar `EventMatch`.
- Actualizar `EventMatch` y los stages para que el scheduler construya el evento
  y lo registre en `JCalendar`.
- Preservar el comportamiento de `start`, `advance` y `finish`.

Criterio de salida:

```text
jl-sprt-core no importa JCalendar concreto ni EventMatch.
```

### Fase 4 — introducir `TeamRoster` genérico

- Cambiar `A_MatchPlay<ScoreType>` a `A_MatchPlay<ScoreType, RosterType>`.
- Definir el momento de creación del roster como `start()`, no como construcción
  del match ni como programación del evento.
- Eliminar `TeamMatch` de `Team.ts` y sustituirlo por `TeamRoster` específico del
  deporte.
- Hacer que el `Team` cree el roster mediante el profile o una fábrica
  deportiva, usando el estado actual de jugadores, forma, lesiones y calendario.
- Mantener una migración temporal en los constructores para no romper todos los
  tests a la vez.

Criterio de salida:

```text
A_MatchPlay no importa TeamMatch desde JSportModule.
```

### Fase 5 — mover jugadores y rosters concretos a `jl-sprt-match`

- Crear `FootballPlayer` y `FootballTeamRoster`.
- Crear `VolleyPlayer` y `VolleyballTeamRoster`.
- Crear equivalentes de American Football cuando las reglas estén definidas.
- Renombrar las implementaciones a `FootballTeamRoster`, `VolleyballTeamRoster`
  y `AmericanFootballTeamRoster`.
- Modelar sustituciones y cambios en el `TeamRoster`, no en `LineUp`.
- Mantener los datos específicos fuera del core.

Criterio de salida:

```text
Cada deporte puede expresar sus reglas de titulares, suplentes y cambios.
```

### Fase 6 — consolidar el profile deportivo

- Mantener un único `ISportProfile` cohesivo en `jl-sprt-match`.
- Mantener `FootballTeamTableItem`, `VolleyTeamTableItem` y equivalentes dentro
  del profile concreto, porque definen puntuaciones, desempates y ordenación.
- Mantener `Ranking` en el engine, consumiendo esas estrategias del profile.
- Adaptar `FootballProfile`, `VolleyballProfile` y `AmericanFootballProfile`.
- Actualizar `Tournament`, `Stage` y `Ranking` para consumir el contrato
  adecuado.
- Mover `A_TeamTableItem`, `IA_TeamTableItemBase`, `AnyTeamTableItem` y `SortFunc`
  al core, y actualizar los table items concretos para depender de esa base.

Criterio de salida:

```text
jl-sprt-match depende de core, no del ranking del engine.
```

### Fase 7 — retirar compatibilidad y limpiar exports

- Eliminar métodos legacy `getTeamMatch`, cuando el scheduler y los profiles ya
  creen `TeamRoster` al iniciar el match.
- Eliminar `TeamMatch` y `Player` vacíos de `Team.ts`.
- Revisar los barrels de `jl-sprt-core`, `jl-sprt-match` y `src/index.ts`.
- Actualizar documentación y ejemplos.
- Mantener solo nombres que representen correctamente el dominio.

## 8. Matriz de dependencias permitidas

| Módulo | Puede importar | No debe importar |
|---|---|---|
| `jl-sprt-core` | tipos propios, librerías neutrales, contratos externos mínimos | `JSportModule`, `Tournament`, `EventMatch`, `Ranking`, entidades |
| `jl-sprt-match` | `jl-sprt-core`, librerías neutrales, `jl-utlts` | `JSportModule/data/Team`, `JSportModule/Ranking`, `Tournament` |
| `JSportModule` | `jl-sprt-core`, `jl-sprt-match`, calendario, entidades, ranking | no debe duplicar contratos core |
| `Tournament` | core, engine y `ISportProfile` de `jl-sprt-match` | detalles internos de `TeamRoster` deportivos |
| `EventMatch` | calendario, `A_Match` | no debe ser importado por core |

## 9. Validaciones por fase

Después de cada fase ejecutar:

```bash
npm run build
npm test -- --run
```

Además, incorporar una comprobación de arquitectura que falle si aparecen
imports prohibidos, por ejemplo:

```text
src/jl-sprt-core/** -> JSportModule/**
src/jl-sprt-core/** -> Tournament/**
src/jl-sprt-match/** -> JSportModule/**
```

La suite debe conservar como mínimo:

- tests de duración de `EventMatch`;
- tests de descanso entre sets y entretiempo;
- tests de perfiles concretos;
- tests de series;
- tests de integración de Tournament y Ranking;
- un test específico de sustitución dentro de cada `TeamRoster`;
- un test que compruebe que una lesión/cambio ocurrido antes de `start()` afecta
  al roster creado para el match, aunque el match haya sido programado meses
  antes.

## 10. Orden recomendado

El orden más seguro es:

```text
1. TeamRef y Person en core
2. mantener el estado e historial dentro de Team y modelar afiliaciones
3. mover `A_TeamTableItem` y sus contratos genéricos al core
4. desacoplar A_Match de EventMatch mediante Scheduling
5. parametrizar A_MatchPlay con RosterType
6. crear TeamRoster concretos
7. mover Player y sus especializaciones deportivas
8. consolidar y validar el `ISportProfile` cohesivo
9. retirar TeamMatch y dependencias legacy
```

No conviene mover primero `Team.ts` completo al core: trasladaría al core sus
acoplamientos actuales y escondería el problema en otra carpeta.
