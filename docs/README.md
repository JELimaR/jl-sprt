# Documentación jl-sprt

Documentación del sistema `jl-sprt` para modelado y simulación de torneos deportivos.

## 📖 Índice de Documentación

### 🌍 Visión General
- **[Flujo General](GENERAL_FLOW.md)** — El mejor punto de partida. Describe:
  - La jerarquía organizativa (International → Confederation → Federation → Institution)
  - Teams de instituciones vs teams de federaciones
  - LeagueSystem y CupSystem por categoría
  - El loop de simulación por temporada
  - El sistema de rankings (RankingStore, rankings combinados)

### 🧠 Conceptos Fundamentales
- **[Conceptos Fundamentales](CONCEPTS.md)** — Elementos principales:
  - Tournament (Torneo)
  - Phase (Fase)
  - Stage (Etapa)
  - Ranking System
  - GeneralStageGraph (GSG)
- **[Sistema de Grafos](GRAPH_SYSTEM.md)** — Sistema de grafos en detalle:
  - Tipos de nodos y sus funciones
  - Flujo de datos en el grafo
  - Validaciones automáticas

### ⚽ Sistema de Competición
- **[Partidos y Equipos](MATCHES_AND_TEAMS.md)** — Sistema de partidos y equipos:
  - A_Match (Partido abstracto) y perfiles por deporte
  - Team (Equipo)
  - A_TeamTableItem (tabla de posiciones)
  - Sistema de simulación

### 📚 Referencia de API
- **[API Reference](API.md)** — Referencia de la API pública:
  - SportServerAPI y EntityController
  - JCalendar / JDateTime
  - Tournament
  - Ranking / RankingStore

## 🎯 Rutas de Aprendizaje

### Para Desarrolladores Nuevos
1. Lee el [README Principal](../README.md) para entender qué hace jl-sprt
2. Lee el [Flujo General](GENERAL_FLOW.md) para entender el sistema completo
3. Estudia los [Conceptos Fundamentales](CONCEPTS.md) para la arquitectura
4. Explora [Partidos y Equipos](MATCHES_AND_TEAMS.md) para la simulación

### Para Integradores
1. Comienza con la [API Reference](API.md)
2. Revisa [Conceptos Fundamentales](CONCEPTS.md) para el modelo de datos
3. Examina los ejemplos en `src/examples/`

## 🔍 Búsqueda Rápida

### Conceptos Clave
- **Tournament**: contenedor de un torneo completo → [CONCEPTS.md](CONCEPTS.md#-tournament-torneo)
- **Phase**: fase dentro de un torneo → [CONCEPTS.md](CONCEPTS.md#-phase-fase)
- **Stage**: etapa de competición (grupos/eliminatorias) → [CONCEPTS.md](CONCEPTS.md#-stage-etapa)
- **Ranking**: sistema de clasificaciones → [CONCEPTS.md](CONCEPTS.md#-ranking-system)
- **GSG**: grafo de estructura del torneo → [GRAPH_SYSTEM.md](GRAPH_SYSTEM.md)

### Tipos de Nodos del Grafo
- **InitialNode (INI)**: punto de entrada → [GRAPH_SYSTEM.md](GRAPH_SYSTEM.md)
- **FinalNode (FIN)**: punto final → [GRAPH_SYSTEM.md](GRAPH_SYSTEM.md)
- **StageGroupNode (GRP)**: etapas de grupos → [GRAPH_SYSTEM.md](GRAPH_SYSTEM.md)
- **StagePlayoffNode (PLY)**: eliminación directa → [GRAPH_SYSTEM.md](GRAPH_SYSTEM.md)
- **TransferStageNode (TRF)**: transferencia directa → [GRAPH_SYSTEM.md](GRAPH_SYSTEM.md)
- **TableStageNode (TBL)**: división de rankings → [GRAPH_SYSTEM.md](GRAPH_SYSTEM.md)
- **RankGroupNode (RG)**: grupos de ranking → [GRAPH_SYSTEM.md](GRAPH_SYSTEM.md)

### Elementos de Competición
- **A_Match**: partido individual → [MATCHES_AND_TEAMS.md](MATCHES_AND_TEAMS.md)
- **Team**: equipo deportivo → [MATCHES_AND_TEAMS.md](MATCHES_AND_TEAMS.md)

## 🤝 Contribución

Para contribuir al proyecto:
1. Lee el [Flujo General](GENERAL_FLOW.md) y los [Conceptos Fundamentales](CONCEPTS.md)
2. Revisa los patrones existentes en el código
3. Sigue las convenciones de TypeScript del proyecto
4. Agrega tests (vitest) para nuevas funcionalidades

---

**jl-sprt** — Sistema para modelado y simulación de torneos deportivos
Autor: JELimaR
