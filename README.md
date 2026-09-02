# jl-sprt - Sistema de Gestión de Torneos Deportivos

## Descripción

`jl-sprt` es una librería TypeScript para modelar y simular el mundo del deporte organizado: instituciones (clubes), federaciones nacionales, confederaciones continentales y una entidad internacional. Permite crear torneos con diferentes formatos (ligas, eliminación directa, grupos), simular partidos temporada a temporada, y mantener rankings que determinan ascensos, descensos y clasificaciones.

El sistema es **agnóstico del deporte**: la lógica específica (goles, sets, puntos) se encapsula en un `SportProfile`. Actualmente hay perfiles para fútbol, volleyball y fútbol americano.

## Características Principales

### 🏆 Gestión de Torneos
- Múltiples formatos: liga (round robin), eliminación directa, grupos
- Torneos multi-fase
- Estructura descrita mediante un grafo dirigido (GeneralStageGraph)

### 📅 Sistema de Calendario
- Calendario propio (`JCalendar`) basado en eventos ordenados cronológicamente
- Automatización de sorteos, partidos y cierres de etapa
- Unidad temporal: "media semana del año" (half-week)

### 🏢 Entidades Deportivas
- Instituciones (clubes), Federaciones, Confederaciones y entidad internacional
- Entidades geográficas: continentes, países, ciudades
- Equipos por categoría de edad (S, S23, S21, S19, S17, S15, S13)

### 📊 Sistema de Rankings
- Rankings por stage, phase, tournament, federación, etc.
- Almacenamiento con historial (`RankingStore`)
- Rankings combinados y ponderados (`combine`, `historical`, `aggregate`)

### 🎯 Multi-deporte
- Arquitectura basada en `ISportProfile` y clases abstractas (`A_Match`, `A_Result`, `A_MatchPlay`, `A_Serie`)
- Perfiles implementados: `FootballProfile`, `VolleyballProfile`, `AmericanFootballProfile`

## Estructura del Proyecto

```
src/
├── index.ts               # Barrel de exports de la librería + runner de ejemplos
├── JSportModule/          # Core del sistema deportivo
│   ├── Match/             # A_Match, A_Result, A_MatchPlay, A_Serie (abstractos)
│   ├── Ranking/           # Ranking, RankingStore, interfaces
│   ├── GeneralStageGraph/ # GSG y creadores
│   ├── profiles/          # ISportProfile + perfiles por deporte
│   └── data/              # Entidades, config, tipos
├── JSportServerModule/    # API del servidor (SportServerAPI)
├── Tournament/            # Tournament, Phase, Stage
├── JCalendar/             # Sistema de calendario y fechas
└── examples/              # Ejemplos ejecutables de uso
```

## Instalación

```bash
npm install
```

## Scripts Disponibles

```bash
# Compilar el proyecto (limpia dist/ y ejecuta tsc)
npm run build

# Desarrollo con recompilación automática
npm run dev:tsc

# Ejecutar con nodemon (requiere build previo)
npm run dev:nodemon

# Ejecutar tests (vitest)
npm run test

# Limpiar archivos generados
npm run clean

# Ejecutar el runner de ejemplos (requiere build previo)
npm start
```

## Documentación Detallada

- **[Flujo General](docs/GENERAL_FLOW.md)** — Visión completa del sistema: entidades, temporadas, rankings y simulación
- **[Conceptos Fundamentales](docs/CONCEPTS.md)** — Tournament, Phase, Stage, Ranking y GeneralStageGraph
- **[Sistema de Grafos](docs/GRAPH_SYSTEM.md)** — Tipos de nodos, flujo de datos, validaciones
- **[Partidos y Equipos](docs/MATCHES_AND_TEAMS.md)** — Match, Team, tablas de posiciones y simulación
- **[API Reference](docs/API.md)** — Referencia de la API pública

## Uso Básico

### 1. Inicialización vía API

```typescript
import SportServerAPI from 'jl-sprt';
import { JCalendar, JDateTime } from 'jl-sprt';

// Crear instancia del API
const ssapi = SportServerAPI();
const entities = ssapi.getEntityController();

// Inicializar calendario
const cal = new JCalendar(
  JDateTime.createFromDayOfYearAndYear(1, 2024).getIJDateTimeCreator()
);

// Cargar datos geográficos y entidades (formato compacto IXxxData)
entities.loadGeogExampleData(continents, countries, towns);
institutionsData.forEach((inst) => entities.createInstitution(inst));
federationsData.forEach((fed) => entities.createFederation(fed));
```

### 2. Creación y ejecución de un torneo

```typescript
import { Tournament } from 'jl-sprt';
import { FootballProfile } from 'jl-sprt';

// Tournament.create requiere: info, datos GSG, calendario y un SportProfile
const tournament = Tournament.create(
  { id: 'trn_001', season: 2024 },
  tournamentFromGSGData,
  cal,
  new FootballProfile()
);
```

### 3. Rankings

```typescript
import { Ranking } from 'jl-sprt';

// El ranking final del torneo (una vez simulado)
const finalRanking = tournament.getRelativeRank();
console.table(finalRanking.getRankTable().map(r => ({ ...r, team: r.team.id })));
```

> Nota: el `import` desde `'jl-sprt'` aplica al consumir la librería publicada. Dentro del propio repositorio, los ejemplos importan mediante rutas relativas.

## Dependencias Principales

- **canvas** — renderizado de gráficos (visualización del GSG)
- **graphology** — manejo del grafo dirigido
- **jl-utlts** — utilidades auxiliares

## Patrones de Diseño

- **Factory**: `ISportProfile` como fábrica de Match, Serie, Result, MatchPlay y TableItem
- **Observer / Event queue**: `JCalendar` y sus eventos
- **Strategy / Template Method**: clases abstractas `A_Match`, `A_Result`, etc. parametrizadas por deporte

## Testing

El proyecto usa **vitest**. Los tests se ejecutan con `npm run test`. La suite cubre desde las unidades básicas (Ranking, GSG, perfiles, stages) hasta la simulación de temporadas completas (integración end-to-end), incluyendo torneos acoplados y validaciones estructurales del grafo.

## Licencia

ISC

## Autor

JELimaR
