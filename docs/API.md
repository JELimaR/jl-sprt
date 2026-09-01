# API Reference - jl-sprt

Referencia de la API pública. Los tipos y firmas descritos aquí reflejan el código actual.

---

## Inicialización

### SportServerAPI()
Función principal para inicializar el sistema. Es el export default de `JSportServerModule`.

```typescript
import SportServerAPI from 'jl-sprt';

const api = SportServerAPI();
```

**Retorna**: `SportAPIController`

## SportAPIController

### getEntityController()
Obtiene el controlador de entidades deportivas.

```typescript
const entities = api.getEntityController();
```

**Retorna**: un objeto que implementa `IEntityController`

### getElementController()
Obtiene el controlador de elementos deportivos.

```typescript
const elements = api.getElementController();
```

**Retorna**: un objeto que implementa `IElementController`

> Nota: `IElementController` está actualmente vacío (reservado para uso futuro).

---

## IEntityController

Los métodos de creación reciben interfaces de datos **compactas y serializables** (`IXxxData`, con campos abreviados) y devuelven `boolean` indicando éxito. No devuelven la instancia de dominio.

### loadGeogExampleData(continents, countries, towns)
Carga datos geográficos.

```typescript
entities.loadGeogExampleData(continentData, countryData, townData);
```

**Parámetros**:
- `continents: IContinentData[]`
- `countries: ICountryData[]`
- `towns: ITownData[]`

**Retorna**: `void`

### Instituciones

```typescript
createInstitution(data: IInstitutionData): boolean;
getInstitutions(pag: IPaginationData): IInstitutionData[];
getInstitutionById(id: string): IInstitutionData;
associateInstitution(iid: string, fid: string): boolean;
```

### Federaciones

```typescript
createFederation(data: IFederationData): boolean;
getFederations(pag: IPaginationData): IFederationData[];
getFederationById(id: string): IFederationData;
associateFederation(fid: string, cid: string): boolean;
```

### Confederaciones

```typescript
createConfederation(data: IConfederationData): boolean;
getAllConfederations(): IConfederationData[];
getConfederationById(id: string): IConfederationData;
removeConfederation(id: string): boolean;
```

---

## Interfaces de datos de entidades (compactas)

Las entidades se crean vía el API con interfaces de campos abreviados. Ejemplos representativos:

```typescript
interface IContinentData { i: string; n: string; p: number; a: number; }        // id, nombre, población, área
interface ICountryData   { i: string; n: string; r: string; p: number; a: number; } // + región/continente
interface ITownData      { i: string; n: string; c: string; p: number; a: number; } // + country

interface IInstitutionData {
  i: string;  // id
  n: string;  // name
  sn: string; // shortName
  ab: string; // abrevName
  hq: string; // headquarters (townId)
  fd: number; // foundationDay
}

interface IFederationData {
  // campos de organización deportiva (id, nombre, área, sede, fundación, fundadores, miembros)
  lSys: TypeCategoryList<ILeagueSystemCreator>; // sistema de ligas por categoría
  cSys: TypeCategoryList<ICupSystemCreator>;    // sistema de copas por categoría
  rnks: TypeCategoryList<string[]>;             // rankings (ids de teams) por categoría
}
```

> Las clases de dominio (`Institution`, `Federation`, `Confederation`) y sus `IXxxCreator` (que usan objetos ricos como `Town`, `Country`, `JDate`) también se exportan y pueden instanciarse directamente cuando no se usa el API.

---

## JCalendar

### Constructor
```typescript
import { JCalendar, JDateTime } from 'jl-sprt';

const calendar = new JCalendar(
  JDateTime.createFromDayOfYearAndYear(1, 2024).getIJDateTimeCreator()
);
```

### Propiedades y métodos principales

```typescript
get now(): JDateTime;                 // fecha/hora actual (copia)
set now(dt: JDateTime);               // fijar la fecha actual
get init(): JDateTime;                // fecha de inicio
get events(): JEvent[];               // todos los eventos ordenados
addEvent(event: JEvent): void;        // agregar evento
getNextEvents(): { dt: JDateTime, events: JEvent[] };  // próximo conjunto de eventos
getCurrentEventList(): JEvent[];      // eventos en la fecha actual
advance(): void;                      // avanzar un intervalo
```

### Factory estático

```typescript
JCalendar.createFromYear(year: number): JCalendar;
```

---

## JDateTime

### Métodos estáticos principales

```typescript
JDateTime.createFromDayOfYearAndYear(day: number, year: number): JDateTime;
JDateTime.createFromHalfWeekOfYearAndYear(
  halfWeek: TypeHalfWeekOfYear,
  year: number,
  position: 'start' | 'middle' | 'end',
  interv?: TypeIntervalOfDay
): JDateTime;
```

> El sistema temporal usa "medias semanas del año" (`TypeHalfWeekOfYear`) como unidad de programación de partidos.

---

## Tournament

### create(info, creator, cal, sportProfile)
Crea un torneo a partir de datos GSG. **Requiere un `SportProfile`.**

```typescript
import { Tournament, FootballProfile } from 'jl-sprt';

const tournament = Tournament.create(
  { id: 'trn_001', season: 2024 },
  tournamentFromGSGData,
  calendar,
  new FootballProfile()
);
```

**Parámetros**:
- `info: IElementInfo` — `{ id: string; season: number }`
- `creator: ITournamentFromGSGData` — datos de creación GSG
- `cal: JCalendar` — calendario del torneo
- `sportProfile: AnySportProfile` — perfil del deporte

**Retorna**: `Tournament`

### Propiedades

```typescript
get phases(): Phase[];
get stagesMap(): Map<string, TGS>;
get graph(): GeneralStageGraph;
get qualyGenericRankItemList(): IGenericRankItem[];
```

### Métodos

```typescript
getRelativeRank(): Ranking;   // ranking final del torneo (context "tr_<id>")
```

---

## Ranking

### Factory estáticos

```typescript
Ranking.fromTypeRanking(tr: TypeRanking): Ranking;
Ranking.fromQualyCondition(qc: TQualyCondition): Ranking;
Ranking.fromRankItemArr(context: string, arr: IRankItem[], metadata?: IRankingMetadata): Ranking;

// Rankings derivados / combinados
Ranking.combine(context: string, sources: { ranking: Ranking; weight: number }[], metadata?: IRankingMetadata): Ranking;
Ranking.historical(context: string, store: RankingStore, baseContext: string, seasons: number[], weights?: number[], metadata?: IRankingMetadata): Ranking;
Ranking.aggregate(context: string, rankings: Ranking[], scoreFn: (team: Team, rankings: Ranking[]) => number, metadata?: IRankingMetadata): Ranking;
```

### Propiedades y métodos

```typescript
get context(): string;
get size(): number;
get isBlocked(): boolean;             // true si items y teams coinciden en cantidad
get metadata(): IRankingMetadata | undefined;

getGenericRankItems(): IGenericRankItem[];
getRankTable(): IRankItem[];
getFromPosition(pos: number): IRankItem;
getInterface(): TypeRanking;
copy(): Ranking;
```

---

## RankingStore

Almacén de rankings con historial. Reemplaza al antiguo `Map<string, Ranking>`.

```typescript
import { RankingStore } from 'jl-sprt';

const store = new RankingStore();

store.set(ranking.context, ranking);
store.get(context);                   // ranking actual (más reciente) por context
store.has(context);
store.getHistory(context);            // Ranking[] histórico
store.getBySeason(context, season);   // busca por metadata.season
store.forEach((ranking, context) => { ... });
store.keys();
store.clear();
store.size;                           // getter
```

El export `globalFinishedRankingsMap` es una instancia de `RankingStore`.

---

## Interfaces Principales

### IElementInfo
```typescript
interface IElementInfo {
  id: string;
  season: number;   // nota: numérico, no string
}
```

### IGenericRankItem
```typescript
interface IGenericRankItem {
  origin: string;   // context del ranking fuente
  pos: number;      // posición (slot)
}
```

### IRankItem
```typescript
interface IRankItem {
  origin: string;
  pos: number;
  team: Team;
  score?: number;   // puntuación del equipo (coeficiente, puntos, etc.)
}
```

### TypeRanking
```typescript
type TypeRanking = {
  context: string;
  items: IGenericRankItem[];
  teams: Team[];
  scores?: number[];            // scores alineados a teams (opcional)
  metadata?: IRankingMetadata;
};
```

### IRankingMetadata
```typescript
type TypeRankingGenerator =
  | 'stage' | 'phase' | 'tournament'
  | 'federation' | 'confederation' | 'international';

type TypeRankedEntity = 'institution' | 'federation';

interface IRankingMetadata {
  season?: number;
  generatedBy?: TypeRankingGenerator;
  rankedEntity?: TypeRankedEntity;
  sourceId?: string;
  timestamp?: number;
}
```

---

## Ejemplo de Uso Completo

```typescript
import SportServerAPI, {
  JCalendar, JDateTime, Tournament, FootballProfile, Ranking,
} from 'jl-sprt';

// 1. Inicializar API y calendario
const api = SportServerAPI();
const entities = api.getEntityController();
const cal = new JCalendar(
  JDateTime.createFromDayOfYearAndYear(1, 2024).getIJDateTimeCreator()
);

// 2. Cargar datos (formato compacto IXxxData)
entities.loadGeogExampleData(continents, countries, towns);
institutions.forEach((inst) => entities.createInstitution(inst));
federations.forEach((fed) => entities.createFederation(fed));

// 3. Crear torneo con un SportProfile
const tournament = Tournament.create(
  { id: 'championship_2024', season: 2024 },
  tournamentFromGSGData,
  cal,
  new FootballProfile()
);

// 4. (tras simular en el calendario) obtener el ranking final
const finalRanking = tournament.getRelativeRank();
```
