# API Reference - JSport

## Inicialización

### SportServerAPI()
Función principal para inicializar el sistema.

```typescript
import SportServerAPI from './JSportServerModule';

const api = SportServerAPI();
```

**Retorna**: `SportAPIController`

## SportAPIController

### getEntityController()
Obtiene el controlador de entidades deportivas.

```typescript
const entityController = api.getEntityController();
```

**Retorna**: `EntitiesController`

### getElementController()
Obtiene el controlador de elementos deportivos (torneos, etapas, etc.).

```typescript
const elementController = api.getElementController();
```

**Retorna**: `ElementController`

## EntitiesController

### Métodos de Carga de Datos

#### loadGeogExampleData(continents, countries, towns)
Carga datos geográficos de ejemplo.

```typescript
entityController.loadGeogExampleData(
  continentData,
  countryData, 
  townData
);
```

**Parámetros**:
- `continents`: Array de datos de continentes
- `countries`: Array de datos de países  
- `towns`: Array de datos de ciudades

### Gestión de Instituciones

#### createInstitution(data)
Crea una nueva institución deportiva.

```typescript
const institution = entityController.createInstitution({
  id: 'inst_001',
  name: 'Club Deportivo Ejemplo',
  townId: 'town_001'
});
```

**Parámetros**:
- `data: IInstitutionCreator`
  - `id: string` - Identificador único
  - `name: string` - Nombre de la institución
  - `shortName: string` - Nombre corto
  - `abrevName: string` - Nombre abreviado
  - `headquarters: Town` - Sede de la institución
  - `funtationDay: JDate` - Fecha de fundación

**Retorna**: `Institution`

#### getInstitutions(filter)
Obtiene lista de instituciones con filtros opcionales.

```typescript
const institutions = entityController.getInstitutions({
  townId: 'town_001'
});
```

**Parámetros**:
- `filter: object` - Filtros opcionales

**Retorna**: `Institution[]`

### Gestión de Federaciones

#### createFederation(data)
Crea una nueva federación.

```typescript
const federation = entityController.createFederation({
  id: 'fed_001',
  name: 'Federación Nacional',
  countryId: 'country_001'
});
```

**Parámetros**:
- `data: IFederationCreator`
  - `id: string` - Identificador único
  - `name: string` - Nombre de la federación
  - `shortName: string` - Nombre corto
  - `areaAsosiated: Country` - País asociado
  - `headquarters: Town` - Sede de la federación
  - `foundationDate: JDate` - Fecha de fundación

**Retorna**: `Federation`

#### getFederations(filter)
Obtiene lista de federaciones.

```typescript
const federations = entityController.getFederations({});
```

**Retorna**: `Federation[]`

#### associateFederation(federationId, confederationId)
Asocia una federación con una confederación.

```typescript
const success = entityController.associateFederation('fed_001', 'conf_001');
```

**Parámetros**:
- `federationId: string` - ID de la federación
- `confederationId: string` - ID de la confederación

**Retorna**: `boolean` - true si la asociación fue exitosa

### Gestión de Confederaciones

#### createConfederation(data)
Crea una nueva confederación.

```typescript
const confederation = entityController.createConfederation({
  id: 'conf_001',
  name: 'Confederación Continental',
  continentId: 'continent_001'
});
```

**Parámetros**:
- `data: IConfederationCreator`
  - `id: string` - Identificador único
  - `name: string` - Nombre de la confederación
  - `shortName: string` - Nombre corto
  - `areaAsosiated: Continent` - Continente asociado
  - `headquarters: Town` - Sede de la confederación
  - `foundationDate: JDate` - Fecha de fundación

**Retorna**: `Confederation`

#### getAllConfederations()
Obtiene todas las confederaciones.

```typescript
const confederations = entityController.getAllConfederations();
```

**Retorna**: `Confederation[]`

## JCalendar

### Constructor
```typescript
import JCalendar from './JCalendar/JCalendar';
import { JDateTime } from './JCalendar/JDateTimeModule';

const calendar = new JCalendar(
  JDateTime.createFromDayOfYearAndYear(1, 2024).getIJDateTimeCreator()
);
```

### Propiedades

#### now
Fecha y hora actual del calendario.

```typescript
const currentDateTime = calendar.now;
```

**Retorna**: `JDateTime`

## JDateTime

### Métodos Estáticos

#### createFromDayOfYearAndYear(day, year)
Crea una fecha desde día del año.

```typescript
const dateTime = JDateTime.createFromDayOfYearAndYear(100, 2024);
```

**Parámetros**:
- `day: number` - Día del año (1-365/366)
- `year: number` - Año

**Retorna**: `JDateTime`

#### createFromHalfWeekOfYearAndYear(halfWeek, weekDay, position, year)
Crea una fecha desde media semana del año.

```typescript
const dateTime = JDateTime.createFromHalfWeekOfYearAndYear(90, 1, 'start', 2024);
```

**Parámetros**:
- `halfWeek: number` - Media semana del año
- `weekDay: number` - Día de la semana
- `position: 'start' | 'end'` - Posición en la media semana
- `year: number` - Año

**Retorna**: `JDateTime`

## Tournament

### Métodos Estáticos

#### create(info, creator, calendar)
Crea un nuevo torneo desde datos GSG.

```typescript
const tournament = Tournament.create(
  { id: 'trn_001', season: '2024' },
  tournamentFromGSGData,
  calendar
);
```

**Parámetros**:
- `info: IElementInfo` - Información del elemento
- `creator: ITournamentFromGSGData` - Datos de creación GSG
- `calendar: JCalendar` - Calendario del torneo

**Retorna**: `Tournament`

### Propiedades

#### phases
Obtiene las fases del torneo.

```typescript
const phases = tournament.phases;
```

**Retorna**: `Phase[]`

#### stagesMap
Obtiene mapa de etapas por ID.

```typescript
const stagesMap = tournament.stagesMap;
```

**Retorna**: `Map<string, TGS>`

#### graph
Obtiene el grafo del torneo.

```typescript
const graph = tournament.graph;
```

**Retorna**: `GeneralStageGraph`

### Métodos

#### getRelativeRank()
Obtiene el ranking relativo actual del torneo.

```typescript
const ranking = tournament.getRelativeRank();
```

**Retorna**: `Ranking`

#### qualyGenericRankItemList
Obtiene lista de items de ranking de clasificación.

```typescript
const qualyItems = tournament.qualyGenericRankItemList;
```

**Retorna**: `IGenericRankItem[]`

## Ranking

### Métodos Estáticos

#### fromTypeRanking(data)
Crea un ranking desde datos de tipo.

```typescript
const ranking = Ranking.fromTypeRanking({
  context: 'tournament_001',
  items: rankItems,
  teams: teams
});
```

**Parámetros**:
- `data: TypeRanking`
  - `context: string` - Contexto del ranking
  - `items: IRankItem[]` - Items del ranking
  - `teams: Team[]` - Equipos

**Retorna**: `Ranking`

### Métodos

#### getRankTable()
Obtiene tabla de ranking.

```typescript
const table = ranking.getRankTable();
```

**Retorna**: `IRankItem[]`

#### getInterface()
Obtiene interfaz del ranking.

```typescript
const interface = ranking.getInterface();
```

**Retorna**: `TypeRanking`

## Interfaces Principales

### IElementInfo
```typescript
interface IElementInfo {
  id: string;
  season: string;
}
```

### IInstitutionCreator
```typescript
interface IInstitutionCreator {
  id: string;
  name: string;
  shortName: string;
  abrevName: string;
  headquarters: Town;
  funtationDay: JDate;
}
```

### IFederationCreator
```typescript
interface IFederationCreator {
  id: string;
  name: string;
  shortName: string;
  areaAsosiated: Country;
  headquarters: Town;
  foundationDate: JDate;
  founderMembers: Institution[];
  leagueSystem: TypeCategoryList<LeagueSystem>;
  cupSystem: TypeCategoryList<CupSystem>;
  rankings: TypeCategoryList<Team[]>;
}
```

### IConfederationCreator
```typescript
interface IConfederationCreator {
  id: string;
  name: string;
  shortName: string;
  areaAsosiated: Continent;
  headquarters: Town;
  foundationDate: JDate;
  founderMembers: Federation[];
}
```

### IRankItem
```typescript
interface IRankItem {
  pos: number;
  team: Team;
  origin: string;
}
```

### TypeRanking
```typescript
interface TypeRanking {
  context: string;
  items: IRankItem[];
  teams: Team[];
}
```

## Ejemplos de Uso Completo

### Ejemplo Básico
```typescript
// Inicializar sistema
const api = SportServerAPI();
const entities = api.getEntityController();

// Crear calendario
const calendar = new JCalendar(
  JDateTime.createFromDayOfYearAndYear(1, 2024).getIJDateTimeCreator()
);

// Cargar datos geográficos
entities.loadGeogExampleData(continents, countries, towns);

// Crear instituciones
const club = entities.createInstitution({
  id: 'club_001',
  name: 'Club Ejemplo',
  shortName: 'Club',
  abrevName: 'CE',
  headquarters: exampleTown,
  funtationDay: foundationDate
});

// Crear federación
entities.createFederation({
  id: 'fed_001', 
  name: 'Federación Nacional',
  shortName: 'FedNac',
  areaAsosiated: exampleCountry,
  headquarters: exampleTown,
  foundationDate: foundationDate,
  founderMembers: [club],
  leagueSystem: {},
  cupSystem: {},
  rankings: {}
});
```

### Ejemplo de Torneo
```typescript
// Crear ranking inicial
const initialRanking = Ranking.fromTypeRanking({
  context: 'initial',
  items: rankItems,
  teams: teams
});

// Crear torneo
const tournament = Tournament.create(
  { id: 'championship_2024', season: '2024' },
  tournamentConfig,
  calendar
);

// Obtener ranking final
const finalRanking = tournament.getRelativeRank();
```