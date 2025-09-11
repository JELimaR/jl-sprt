# Guía de Inicio Rápido - JSport

## Instalación y Configuración

### 1. Clonar e Instalar
```bash
git clone <repository-url>
cd jl-sprt
npm install
```

### 2. Compilar el Proyecto
```bash
npm run build
```

### 3. Ejecutar Ejemplos
```bash
npm start
```

## Primer Ejemplo - Sistema Básico

### Paso 1: Inicializar el Sistema
```typescript
import SportServerAPI from './src/JSportServerModule';
import JCalendar from './src/JCalendar/JCalendar';
import { JDateTime } from './src/JCalendar/JDateTimeModule';

// Crear instancia del API
const api = SportServerAPI();
const entities = api.getEntityController();

// Crear calendario
const calendar = new JCalendar(
  JDateTime.createFromDayOfYearAndYear(1, 2024).getIJDateTimeCreator()
);
```

### Paso 2: Configurar Entidades Básicas
```typescript
// Datos geográficos básicos
const continents = [
  { id: 'SA', name: 'Sudamérica' }
];

const countries = [
  { id: 'AR', name: 'Argentina', continentId: 'SA' },
  { id: 'BR', name: 'Brasil', continentId: 'SA' }
];

const towns = [
  { id: 'BA', name: 'Buenos Aires', countryId: 'AR' },
  { id: 'SP', name: 'São Paulo', countryId: 'BR' }
];

// Cargar datos geográficos
entities.loadGeogExampleData(continents, countries, towns);
```

### Paso 3: Crear Instituciones
```typescript
// Crear clubes
const buenosAires = towns.find(t => t.id === 'BA');
const saoPaulo = towns.find(t => t.id === 'SP');
const foundationDate = new JDate({ day: 1, interv: 0 });

entities.createInstitution({
  id: 'boca',
  name: 'Boca Juniors',
  shortName: 'Boca',
  abrevName: 'BOC',
  headquarters: buenosAires,
  funtationDay: foundationDate
});

entities.createInstitution({
  id: 'river',
  name: 'River Plate',
  shortName: 'River', 
  abrevName: 'RIV',
  headquarters: buenosAires,
  funtationDay: foundationDate
});

entities.createInstitution({
  id: 'santos',
  name: 'Santos FC',
  shortName: 'Santos',
  abrevName: 'SAN',
  headquarters: saoPaulo,
  funtationDay: foundationDate
});

console.log(`Instituciones creadas: ${entities.getInstitutions({}).length}`);
```

### Paso 4: Crear Federaciones y Confederaciones
```typescript
// Crear federaciones
const argentina = countries.find(c => c.id === 'AR');
const brasil = countries.find(c => c.id === 'BR');
const sudamerica = continents.find(c => c.id === 'SA');

entities.createFederation({
  id: 'afa',
  name: 'Asociación del Fútbol Argentino',
  shortName: 'AFA',
  areaAsosiated: argentina,
  headquarters: buenosAires,
  foundationDate: foundationDate,
  founderMembers: [bocaInstitution, riverInstitution],
  leagueSystem: {},
  cupSystem: {},
  rankings: {}
});

entities.createFederation({
  id: 'cbf',
  name: 'Confederação Brasileira de Futebol',
  shortName: 'CBF',
  areaAsosiated: brasil,
  headquarters: saoPaulo,
  foundationDate: foundationDate,
  founderMembers: [santosInstitution],
  leagueSystem: {},
  cupSystem: {},
  rankings: {}
});

// Crear confederación
entities.createConfederation({
  id: 'conmebol',
  name: 'CONMEBOL',
  shortName: 'CONMEBOL',
  areaAsosiated: sudamerica,
  headquarters: buenosAires,
  foundationDate: foundationDate,
  founderMembers: [afaFederation, cbfFederation]
});

// Asociar federaciones con confederación
entities.associateFederation('afa', 'conmebol');
entities.associateFederation('cbf', 'conmebol');
```

## Segundo Ejemplo - Torneo Simple

### Paso 1: Preparar Equipos y Ranking
```typescript
import { Ranking } from './src/JSportModule';
import Team from './src/JSportModule/data/Team';

// Crear equipos
const teams = [
  new Team('team_001', 'Equipo A'),
  new Team('team_002', 'Equipo B'),
  new Team('team_003', 'Equipo C'),
  new Team('team_004', 'Equipo D')
];

// Crear ranking inicial
const rankItems = teams.map((team, index) => ({
  pos: index + 1,
  team: team,
  origin: 'initial'
}));

const initialRanking = Ranking.fromTypeRanking({
  context: 'initial_ranking',
  items: rankItems,
  teams: teams
});
```

### Paso 2: Configurar Etapa de Eliminación Directa
```typescript
import StagePlayoff from './src/Tournament/Stage/StagePlayoff/StagePlayoff';

// Configuración de la etapa
const stageConfig = {
  idConfig: 'semifinal',
  type: 'playoff',
  teamsQty: 4,
  qualyQty: 2,
  qualyConditions: [{
    source: 'initial_ranking',
    qty: 4
  }]
};

const stageInfo = {
  id: 'semifinal_2024',
  season: '2024'
};

// Crear etapa
const stage = new StagePlayoff(stageInfo, stageConfig, calendar);
```

### Paso 3: Ejecutar y Obtener Resultados
```typescript
// Simular avance del calendario (esto ejecutaría los partidos)
// En un caso real, aquí se programarían y ejecutarían los partidos

// Obtener tabla final
const finalTable = stage.getTable('finished');
console.table(finalTable.map(item => item.getInterface()));

// Obtener ranking de clasificados
const qualifiedRanking = stage.getRelativeRank();
console.log('Equipos clasificados:', qualifiedRanking.teams.map(t => t.name));
```

## Tercer Ejemplo - Torneo Completo con Múltiples Fases

### Configuración de Torneo Completo
```typescript
import Tournament from './src/Tournament/Tournament';

// Configuración del torneo
const tournamentConfig = {
  idConfig: 'championship_2024',
  phases: [
    {
      n: 1,
      stages: [
        {
          idConfig: 'group_stage',
          type: 'league',
          teamsQty: 8,
          groups: 2,
          qualyQty: 4
        }
      ]
    },
    {
      n: 2, 
      stages: [
        {
          idConfig: 'semifinals',
          type: 'playoff',
          teamsQty: 4,
          qualyQty: 2
        }
      ]
    },
    {
      n: 3,
      stages: [
        {
          idConfig: 'final',
          type: 'playoff', 
          teamsQty: 2,
          qualyQty: 1
        }
      ]
    }
  ]
};

// Crear torneo
const tournament = Tournament.create(
  { id: 'championship_2024', season: '2024' },
  { gsgData: tournamentConfig, /* otros datos GSG */ },
  calendar
);
```

## Ejemplos Incluidos

El proyecto incluye varios ejemplos listos para ejecutar:

### APIExample
Ejemplo completo del uso del API:
```typescript
import APIExample from './src/examples/APIExample';
APIExample(); // Ejecuta ejemplo completo
```

### Ejemplos de Etapas
```typescript
import stageExample01 from './src/examples/stageExample01';
import stageLeagueExample from './src/examples/stageLeagueExample';

stageExample01(); // Ejemplo de eliminación directa
stageLeagueExample(); // Ejemplo de liga
```

### Ejemplo de Sistema Completo
```typescript
import systemExample_01 from './src/examples/systemExample_01';
systemExample_01(); // Sistema completo con múltiples componentes
```

## Scripts de Desarrollo

### Desarrollo con Watch
```bash
# Terminal 1: Compilar con watch
npm run dev:tsc

# Terminal 2: Ejecutar con nodemon
npm run dev:nodemon
```

### Testing
```bash
npm test
```

### Limpieza
```bash
npm run clean
```

## Próximos Pasos

1. **Revisar Ejemplos**: Explora los ejemplos en `src/examples/`
2. **Leer Documentación**: Revisa `docs/API.md` para referencia completa
3. **Arquitectura**: Entiende la estructura en `docs/ARCHITECTURE.md`
4. **Personalizar**: Adapta los ejemplos a tus necesidades específicas

## Solución de Problemas Comunes

### Error de Compilación TypeScript
```bash
# Limpiar y recompilar
npm run clean
npm run build
```

### Problemas de Memoria
El sistema incluye monitoreo de memoria. Si hay problemas:
```typescript
// Ver uso de memoria en consola al ejecutar
const memoryUsage = process.memoryUsage();
```

### Errores de Dependencias
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

## Recursos Adicionales

- **Ejemplos**: `src/examples/`
- **Tests**: Configurados con Jest
- **Tipos**: Definiciones TypeScript incluidas
- **Linting**: ESLint configurado

¡Listo para comenzar a crear torneos deportivos con JSport!