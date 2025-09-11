# Arquitectura del Sistema JSport

## Visión General

JSport está diseñado como un sistema modular para la gestión completa de torneos deportivos. La arquitectura sigue principios de separación de responsabilidades y está organizada en módulos independientes pero interconectados.

## Módulos Principales

### 1. JSportModule (Core)
**Ubicación**: `src/JSportModule/`

El módulo central que contiene toda la lógica deportiva:

- **SportAPI**: Interfaz principal del sistema
- **Ranking**: Sistema de clasificaciones y rankings
- **Match**: Gestión de partidos individuales
- **GeneralStageGraph**: Grafos para visualizar estructura de torneos
- **patterns**: Patrones de configuración reutilizables

**Responsabilidades**:
- Definir interfaces y tipos principales
- Gestionar lógica de partidos y resultados
- Calcular rankings y clasificaciones
- Proporcionar patrones de configuración

### 2. JSportServerModule (API Layer)
**Ubicación**: `src/JSportServerModule/`

Capa de API que expone la funcionalidad del core:

- **JSportFactoryServer**: Factory principal del sistema
- **Element**: Controladores para elementos deportivos
- **Entity**: Controladores para entidades

**Responsabilidades**:
- Exponer API unificada
- Gestionar creación de objetos
- Controlar acceso a funcionalidades

### 3. Tournament (Gestión de Torneos)
**Ubicación**: `src/Tournament/`

Módulo especializado en la gestión de torneos:

- **Tournament**: Clase principal de torneo
- **Phase**: Gestión de fases
- **Stage**: Diferentes tipos de etapas (Playoff, League, etc.)

**Responsabilidades**:
- Crear y gestionar torneos completos
- Manejar múltiples fases
- Coordinar diferentes tipos de etapas

### 4. JCalendar (Sistema Temporal)
**Ubicación**: `src/JCalendar/`

Sistema de gestión temporal y eventos:

- **JCalendar**: Calendario principal
- **JDateTime**: Manejo de fechas y tiempos
- **Event**: Gestión de eventos programados

**Responsabilidades**:
- Gestionar fechas y horarios
- Programar eventos automáticos
- Controlar flujo temporal del torneo

### 5. Entities (Entidades Deportivas)
**Ubicación**: `src/JSportModule/data/Entities/`

Gestión de entidades del mundo deportivo:

- **Institution**: Instituciones deportivas (clubes)
- **Federation**: Federaciones nacionales
- **Confederation**: Confederaciones continentales
- **SportOrganization**: Clase base para organizaciones
- **GeogEntity**: Entidades geográficas (continentes, países, ciudades)
- **LeagueSystem**: Sistemas de ligas y divisiones

**Responsabilidades**:
- Gestionar organizaciones deportivas
- Manejar jerarquías institucionales
- Controlar datos geográficos
- Administrar sistemas de ligas y copas

## Flujo de Datos

```
Usuario → SportServerAPI → JSportModule → Tournament/Calendar/Entities
                ↓
            Resultados ← Rankings ← Matches ← Stages ← Phases
```

## Patrones de Diseño Implementados

### 1. Factory Pattern
- **JSportFactoryServer**: Creación centralizada de objetos
- **Tournament.create()**: Factory method para torneos

### 2. Observer Pattern
- **Calendar Events**: Notificaciones de eventos temporales
- **Match Results**: Actualización automática de rankings

### 3. Strategy Pattern
- **Stage Types**: Diferentes estrategias para tipos de etapa
- **Ranking Systems**: Múltiples sistemas de clasificación

### 4. Template Method Pattern
- **TCC (Tournament Component Class)**: Clase base para componentes
- **Stage Base Classes**: Plantillas para diferentes tipos de etapa

## Interfaces Principales

### IElementInfo
```typescript
interface IElementInfo {
  id: string;
  season: string;
}
```

### ITournamentConfig
```typescript
interface ITournamentConfig {
  idConfig: string;
  phases: IPhaseConfig[];
}
```

### IPhaseConfig
```typescript
interface IPhaseConfig {
  n?: number;
  stages: IStageConfig[];
}
```

## Gestión de Estado

### Rankings Globales
- **globalFinishedRankingsMap**: Mapa global de rankings finalizados
- Actualización automática al finalizar etapas
- Persistencia durante la ejecución del torneo

### Estado de Torneo
- Cada torneo mantiene su estado interno
- Fases y etapas con estados independientes
- Sincronización automática entre componentes

## Extensibilidad

### Nuevos Tipos de Etapa
1. Extender clase base `Stage`
2. Implementar métodos requeridos
3. Registrar en factory

### Nuevos Sistemas de Ranking
1. Implementar interfaz `IRankingSystem`
2. Integrar en `Ranking` class
3. Configurar en tournament config

### Nuevas Entidades
1. Extender `JInternationalEntity`
2. Implementar en `EntitiesController`
3. Agregar a API endpoints

## Consideraciones de Rendimiento

### Grafos de Torneo
- Uso de `graphology` para operaciones eficientes
- Lazy loading de estructuras complejas
- Caching de cálculos pesados

### Memoria
- Monitoreo incluido en `index.ts`
- Gestión cuidadosa de referencias
- Limpieza automática de objetos temporales

## Testing

### Estructura de Tests
- Tests unitarios por módulo
- Tests de integración para flujos completos
- Ejemplos como tests funcionales

### Configuración Jest
- TypeScript support
- Coverage reporting
- Mocking de dependencias externas

## Deployment

### Build Process
1. TypeScript compilation (`tsc`)
2. Generación de tipos (`.d.ts`)
3. Optimización de assets

### Distribución
- **main**: `dist/index.js`
- **types**: `dist/index.d.ts`
- Soporte para CommonJS y ES modules