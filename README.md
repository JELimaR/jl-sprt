# JSport - Sistema de Gestión de Torneos Deportivos

## Descripción

JSport es una librería TypeScript para la gestión completa de torneos deportivos. Proporciona un sistema robusto para crear, configurar y ejecutar torneos con diferentes formatos (eliminación directa, ligas, grupos especiales), gestión de calendarios, rankings y entidades deportivas.

## Características Principales

### 🏆 Gestión de Torneos
- **Múltiples formatos**: Eliminación directa, ligas, grupos especiales
- **Fases múltiples**: Soporte para torneos con múltiples fases
- **Sistema de clasificación**: Rankings automáticos y manuales
- **Grafos de torneo**: Visualización y gestión de la estructura del torneo

### 📅 Sistema de Calendario
- **Gestión temporal**: Control preciso de fechas y horarios
- **Eventos programados**: Automatización de partidos y fases
- **Intervalos personalizables**: Configuración flexible de tiempos

### 🏢 Entidades Deportivas
- **Instituciones**: Gestión de clubes y organizaciones
- **Federaciones**: Control de federaciones deportivas
- **Confederaciones**: Manejo de confederaciones internacionales
- **Geografía**: Soporte para continentes, países y ciudades

### 📊 Sistema de Rankings
- **Rankings dinámicos**: Actualización automática basada en resultados
- **Múltiples contextos**: Rankings por torneo, fase o general
- **Clasificaciones**: Sistema de clasificación automática entre fases

## Estructura del Proyecto

```
src/
├── JSportModule/          # Módulo principal de deportes
│   └── data/
│       └── Entities/      # Entidades deportivas
├── JSportServerModule/    # API del servidor
├── Tournament/           # Gestión de torneos
├── JCalendar/           # Sistema de calendario
└── examples/            # Ejemplos de uso
```

## Instalación

```bash
npm install
```

## Scripts Disponibles

```bash
# Compilar el proyecto
npm run build

# Desarrollo con watch
npm run dev:tsc

# Ejecutar con nodemon
npm run dev:nodemon

# Ejecutar tests
npm run test

# Limpiar archivos generados
npm run clean

# Iniciar aplicación
npm start
```

## Documentación Detallada

### 📚 Guías Disponibles

- **[Conceptos Fundamentales](docs/CONCEPTS.md)** - Explicación detallada de Tournament, Phase, Stage, Ranking y GeneralStageGraph
- **[Partidos y Equipos](docs/MATCHES_AND_TEAMS.md)** - Sistema de partidos, equipos y simulación
- **[Arquitectura](docs/ARCHITECTURE.md)** - Estructura técnica y patrones de diseño
- **[API Reference](docs/API.md)** - Documentación completa de la API
- **[Guía de Inicio Rápido](docs/QUICK_START.md)** - Tutorial paso a paso

## Uso Básico

### 1. Inicialización del Sistema

```typescript
import SportServerAPI from './JSportServerModule';
import JCalendar from './JCalendar/JCalendar';
import { JDateTime } from './JCalendar/JDateTimeModule';

// Crear instancia del API
const ssapi = SportServerAPI();
const entities = ssapi.getEntityController();
const elements = ssapi.getElementController();

// Inicializar calendario
const cal = new JCalendar(
  JDateTime.createFromDayOfYearAndYear(1, 2024).getIJDateTimeCreator()
);
```

### 2. Gestión de Entidades

```typescript
// Cargar datos geográficos
entities.loadGeogExampleData(continents, countries, towns);

// Crear instituciones
entities.createInstitution({
  id: 'inst_001',
  name: 'Club Ejemplo',
  shortName: 'Club',
  abrevName: 'CE',
  headquarters: town,
  funtationDay: foundationDate
});

// Crear federaciones
entities.createFederation({
  id: 'fed_001',
  name: 'Federación Nacional',
  countryId: 'country_001'
});
```

### 3. Creación de Torneos

```typescript
import Tournament from './Tournament/Tournament';

// Configuración del torneo
const tournamentConfig = {
  idConfig: 'torneo_001',
  phases: [
    {
      stages: [
        {
          type: 'playoff',
          teams: 16,
          format: 'single_elimination'
        }
      ]
    }
  ]
};

// Crear torneo
const tournament = Tournament.create(
  { id: 'trn_001', season: '2024' },
  tournamentFromGSGData,
  calendar
);
```

### 4. Gestión de Rankings

```typescript
import { Ranking } from './JSportModule';

// Crear ranking inicial
const initialRanking = Ranking.fromTypeRanking({
  context: 'initial',
  items: rankItems,
  teams: teams
});

// Obtener ranking actualizado
const currentRanking = tournament.getRelativeRank();
```

## Ejemplos Incluidos

El proyecto incluye varios ejemplos en la carpeta `src/examples/`:

- **APIExample**: Uso completo del API
- **stageExample01-03**: Ejemplos de diferentes tipos de etapas
- **stageLeagueExample**: Ejemplo de liga
- **systemExample_01**: Ejemplo de sistema completo
- **graphExample**: Visualización de grafos de torneo

## API Principal

### SportAPIController
```typescript
const api = SportServerAPI();
const entityController = api.getEntityController();
const elementController = api.getElementController();
```

### Métodos Principales

#### Entidades
- `createInstitution(data)`: Crear institución
- `createFederation(data)`: Crear federación  
- `createConfederation(data)`: Crear confederación
- `getInstitutions(filter)`: Obtener instituciones
- `getFederations(filter)`: Obtener federaciones

#### Elementos
- `createTournament(config)`: Crear torneo
- `createStage(config)`: Crear etapa
- `getRankings()`: Obtener rankings

## Configuración

### TypeScript
El proyecto usa TypeScript con configuración estricta. Ver `tsconfig.json` para detalles.

### Testing
Configurado con Jest para pruebas unitarias. Ejecutar con `npm test`.

### Linting
ESLint configurado para mantener calidad de código.

## Dependencias Principales

- **canvas**: Renderizado de gráficos
- **graphology**: Manejo de grafos
- **jl-utlts**: Utilidades auxiliares

## Desarrollo

### Estructura de Módulos

1. **JSportModule**: Core del sistema deportivo
2. **JSportServerModule**: API y controladores
3. **Tournament**: Lógica de torneos
4. **JCalendar**: Sistema temporal
5. **Entities**: Entidades deportivas

### Patrones de Diseño

- **Factory Pattern**: Para creación de elementos
- **Observer Pattern**: Para eventos del calendario
- **Strategy Pattern**: Para diferentes tipos de torneo

## Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

ISC License

## Autor

JELimaR

---

Para más ejemplos y documentación detallada, revisar los archivos en la carpeta `examples/`.