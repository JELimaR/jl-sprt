# Documentación JSport

Bienvenido a la documentación completa del sistema JSport para gestión de torneos deportivos.

## 📖 Índice de Documentación

### 🧠 Conceptos Fundamentales
- **[Conceptos Fundamentales](CONCEPTS.md)** - Explicación detallada de los elementos principales:
  - Tournament (Torneo)
  - Phase (Fase) 
  - Stage (Etapa)
  - Ranking System
  - GeneralStageGraph (GSG)
- **[Sistema de Grafos](GRAPH_SYSTEM.md)** - Documentación completa del sistema de grafos:
  - Tipos de nodos y sus funciones
  - Flujo de datos en el grafo
  - Visualización y renderizado
  - Validaciones automáticas

### ⚽ Sistema de Competición
- **[Partidos y Equipos](MATCHES_AND_TEAMS.md)** - Sistema de partidos y equipos:
  - Match (Partido)
  - Team (Equipo)
  - TeamTableItem (Estadísticas)
  - Sistema de Simulación

### 📚 Referencia de API
- **[API Reference](API.md)** - Documentación completa de la API:
  - SportServerAPI
  - EntitiesController
  - ElementController
  - Interfaces principales

## 🎯 Rutas de Aprendizaje

### Para Desarrolladores Nuevos
1. Lee el [README Principal](../README.md) para entender qué hace JSport
2. Sigue la [Guía de Inicio Rápido](QUICK_START.md) para configurar tu primer ejemplo
3. Estudia los [Conceptos Fundamentales](CONCEPTS.md) para entender la arquitectura
4. Explora [Partidos y Equipos](MATCHES_AND_TEAMS.md) para entender la simulación

### Para Desarrolladores Avanzados
1. Revisa la [Arquitectura](ARCHITECTURE.md) para entender los patrones implementados
2. Consulta la [API Reference](API.md) para integración avanzada
3. Examina los ejemplos en `src/examples/` para casos de uso específicos

### Para Integradores
1. Comienza con la [API Reference](API.md) para entender los endpoints
2. Revisa [Conceptos Fundamentales](CONCEPTS.md) para entender el modelo de datos
3. Usa la [Guía de Inicio Rápido](QUICK_START.md) para pruebas de concepto

## 🔍 Búsqueda Rápida

### Conceptos Clave
- **Tournament**: Contenedor principal de un torneo completo → [Ver detalles](CONCEPTS.md#-tournament-torneo)
- **Phase**: Fase específica dentro de un torneo → [Ver detalles](CONCEPTS.md#-phase-fase)
- **Stage**: Etapa de competición (grupos/eliminatorias) → [Ver detalles](CONCEPTS.md#-stage-etapa)
- **Ranking**: Sistema de clasificaciones → [Ver detalles](CONCEPTS.md#-ranking-system)
- **GSG**: Grafo de estructura del torneo → [Ver detalles](CONCEPTS.md#️-generalstategraph-gsg)

### Tipos de Nodos del Grafo
- **InitialNode (INI)**: Punto de entrada del torneo → [Ver detalles](GRAPH_SYSTEM.md#initialnode-ini)
- **FinalNode (FIN)**: Punto final del torneo → [Ver detalles](GRAPH_SYSTEM.md#finalnode-fin)
- **StageGroupNode (GRP)**: Etapas de grupos → [Ver detalles](GRAPH_SYSTEM.md#stagegroupnode-grp)
- **StagePlayoffNode (PLY)**: Eliminación directa → [Ver detalles](GRAPH_SYSTEM.md#stageplayoffnode-ply)
- **TransferStageNode (TRF)**: Transferencia directa → [Ver detalles](GRAPH_SYSTEM.md#transferstagenode-trf)
- **TableStageNode (TBL)**: División de rankings → [Ver detalles](GRAPH_SYSTEM.md#tablestagenode-tbl)
- **RankGroupNode (RG)**: Grupos de ranking → [Ver detalles](GRAPH_SYSTEM.md#rankgroupnode-rg)

### Elementos de Competición
- **Match**: Partido individual → [Ver detalles](MATCHES_AND_TEAMS.md#️-match-partido)
- **Team**: Equipo deportivo → [Ver detalles](MATCHES_AND_TEAMS.md#-team-equipo)
- **League**: Liga/Grupo → [Ver ejemplos](QUICK_START.md#segundo-ejemplo---torneo-simple)
- **Playoff**: Eliminación directa → [Ver ejemplos](QUICK_START.md#segundo-ejemplo---torneo-simple)

### API Principal
- **SportServerAPI**: Punto de entrada principal → [Ver API](API.md#sportserverapicontroller)
- **EntitiesController**: Gestión de entidades → [Ver API](API.md#entitiescontroller)
- **Calendar**: Sistema temporal → [Ver API](API.md#jcalendar)

## 🛠️ Casos de Uso Comunes

### Crear un Torneo Simple
```typescript
// Ver guía completa en QUICK_START.md
const tournament = Tournament.create(info, config, calendar);
```

### Gestionar Entidades Deportivas
```typescript
// Ver ejemplos en API.md
entities.createInstitution(institutionData);
entities.createFederation(federationData);
```

### Obtener Rankings
```typescript
// Ver detalles en CONCEPTS.md
const ranking = tournament.getRelativeRank();
```

### Simular Partidos
```typescript
// Ver sistema completo en MATCHES_AND_TEAMS.md
match.start();
match.advance();
const result = match.result;
```

## 🤝 Contribución

Para contribuir al proyecto:
1. Lee la [Arquitectura](ARCHITECTURE.md) para entender la estructura
2. Revisa los patrones existentes en el código
3. Sigue las convenciones de TypeScript del proyecto
4. Agrega tests para nuevas funcionalidades

## 📞 Soporte

Si necesitas ayuda:
1. Revisa esta documentación primero
2. Examina los ejemplos en `src/examples/`
3. Consulta los tests para casos de uso específicos
4. Crea un issue en el repositorio con detalles específicos

---

**JSport** - Sistema completo para gestión de torneos deportivos
Autor: JELimaR