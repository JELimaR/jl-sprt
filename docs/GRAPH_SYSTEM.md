# Sistema de Grafos - JSport

## 🎯 Visión General

El sistema de grafos de JSport utiliza **GeneralStageGraph (GSG)** para modelar, validar y visualizar la estructura completa de torneos deportivos. Este sistema permite crear torneos de cualquier complejidad mediante la combinación de diferentes tipos de nodos.

## 🏗️ Arquitectura del Grafo

### Componentes Principales

```typescript
GeneralStageGraph
├── Nodos (Nodes)
│   ├── Control Nodes (ini, fin)
│   ├── Real Stage Nodes (GRP, PLY)
│   ├── Processing Nodes (TRF, TBL, ROR)
│   └── Rank Group Nodes (RG)
├── Aristas (Edges)
│   └── Flujo dirigido de equipos
└── Fases (Phases)
    └── Agrupación lógica de etapas
```

## 📊 Tipos de Nodos Detallados

### 1. Nodos de Control

#### InitialNode (`INI`)
- **Color**: Verde oscuro (`#29524A`)
- **Función**: Punto de entrada del torneo
- **Datos**: Lista de equipos clasificados y distribución inicial
- **Salidas**: Genera RankGroupNodes con equipos distribuidos

```typescript
const initialNode = {
  tournamentId: 'champions_2024',
  qualyRankList: [
    { pos: 1, origin: 'league_champion' },
    { pos: 2, origin: 'league_champion' },
    // ... más equipos
  ],
  rankGroups: [16, 8, 8] // 32 equipos en 3 grupos
};
```

#### FinalNode (`FIN`)
- **Color**: Rojo oscuro (`#4E0110`)
- **Función**: Punto final del torneo
- **Datos**: Recibe todos los rankings finales
- **Entradas**: Todos los RankGroupNodes finales del torneo

### 2. Nodos de Etapa Real (RealStageNode)

#### StageGroupNode (`GRP`)
- **Color**: Azul oscuro (`#03254E`)
- **Función**: Etapas de grupos (formato liga)
- **Duración**: Calculada automáticamente según participantes
- **Formato**: Round Robin o Ida/Vuelta

```typescript
const groupStage = {
  participants: 32,
  groupsNumber: 8,        // 8 grupos de 4 equipos
  opt: 'rr',             // Round Robin
  bombos: [8, 8, 8, 8],  // Distribución por bombos
  drawRules: [           // Reglas de sorteo
    { origin: 'all', minCount: 2 }
  ]
};
```

**Cálculos Automáticos**:
- **Participantes por grupo**: Distribución equilibrada (3-20 por grupo)
- **Fechas necesarias**: `(participantes_por_grupo - 1) * (ida_vuelta ? 2 : 1)`
- **Rankings generados**: Por posición en cada grupo

#### StagePlayoffNode (`PLY`)
- **Color**: Azul claro (`#6184D8`)
- **Función**: Eliminación directa
- **Restricción**: Participantes debe ser potencia de 2
- **Formatos**: Partido único, ida/vuelta, campo neutral

```typescript
const playoffStage = {
  participants: 16,       // Debe ser 2^n
  roundsNumber: 4,        // Octavos → Cuartos → Semis → Final
  opt: 'h&a',            // Ida y vuelta
  bombos: [8, 8],        // Cabezas de serie
  drawRules: [
    { origin: 'same_group', minCount: 1 }
  ]
};
```

**Cálculos Automáticos**:
- **Rondas válidas**: `log2(participantes)`
- **Fechas necesarias**: `roundsNumber * (ida_vuelta ? 2 : 1)`
- **Rankings generados**: Por ronda de eliminación

### 3. Nodos de Procesamiento (NoneStageNode)

#### TransferStageNode (`TRF`)
- **Color**: Beige (`#C5AFA0`)
- **Función**: Transferencia directa sin modificaciones
- **Duración**: 0 semanas (instantáneo)
- **Uso**: Reorganización de flujos, combinación de rankings

```typescript
const transferStage = {
  participants: 16,
  // No requiere configuración adicional
  // Pasa todos los equipos sin cambios
};
```

#### TableStageNode (`TBL`)
- **Color**: Rosa (`#E9BCB7`)
- **Función**: División de ranking en clasificados/eliminados
- **Entrada**: Exactamente 1 ranking
- **Salida**: 2 rankings (clasificados + eliminados)

```typescript
const tableStage = {
  participants: 20,
  qNumber: 8,           // Los primeros 8 clasifican
  // Genera:
  // - Ranking 1: Posiciones 1-8 (clasificados)
  // - Ranking 2: Posiciones 9-20 (eliminados)
};
```

#### ReOrderStageNode (`ROR`)
- **Color**: Personalizable
- **Función**: Reordenamiento de rankings
- **Entrada**: Exactamente 2 rankings
- **Salida**: Los mismos 2 rankings en orden inverso

```typescript
const reorderStage = {
  participants: 16,
  // Entrada: [RankingA, RankingB]
  // Salida:  [RankingB, RankingA]
};
```

### 4. Nodos de Ranking (RankGroupNode)

#### RankGroupNode (`RG`)
- **Color**: Negro (`#06070E`)
- **Tamaño**: Más pequeño (10px vs 20px)
- **Función**: Representa grupos específicos de equipos
- **Datos**: Ranking con posiciones y origen

```typescript
const rankGroupNode = {
  sourceData: {
    context: 'group_stage_winners',
    items: [
      { pos: 1, origin: 'group_A' },
      { pos: 1, origin: 'group_B' },
      // ... ganadores de cada grupo
    ]
  }
};
```

## 🔄 Flujo de Datos

### Ejemplo Completo: Champions League

```
                    INI (32 equipos)
                     ↓
                RG (32 equipos)
                     ↓
              GRP (8 grupos de 4)
                ↓         ↓
        RG (8 primeros) RG (8 segundos)
                ↓         ↓
            TBL (16 → 16 clasificados)
                     ↓
                RG (16 equipos)
                     ↓
              PLY (Octavos → Final)
                ↓    ↓    ↓
           RG(8) RG(4) RG(2) RG(1)
                     ↓
                    FIN
```

### Validaciones Automáticas

1. **Consistencia de Flujo**:
   ```typescript
   // Verifica que entrada = salida en cada nodo
   inputTeams === outputTeams
   ```

2. **Potencias de 2 en Playoffs**:
   ```typescript
   // Para StagePlayoffNode
   participants === 2 ** roundsNumber
   ```

3. **Grupos Equilibrados**:
   ```typescript
   // Para StageGroupNode
   3 <= participantsPerGroup <= 20
   ```

4. **Conectividad del Grafo**:
   ```typescript
   // Todos los nodos deben ser alcanzables desde INI
   // Todos los nodos deben poder llegar a FIN
   ```

## 🎨 Visualización

### Renderizado Automático

El sistema genera automáticamente imágenes PNG del grafo:

```typescript
renderGSGtoPNG(gsg); // Genera ./graph.png
```

### Características Visuales

- **Layout Automático**: Distribución horizontal por fases
- **Colores Distintivos**: Cada tipo de nodo tiene su color
- **Etiquetas Descriptivas**: Texto identificativo en cada nodo
- **Dimensiones Dinámicas**: Tamaño según complejidad
- **Espaciado Fijo**: 50px entre nodos para claridad

### Configuración Visual

```typescript
const visualConfig = {
  STEP_SIZE: 50,           // Espaciado entre nodos
  STAGE_NODE_SIZE: 20,     // Tamaño nodos de etapa
  RANK_NODE_SIZE: 10,      // Tamaño nodos de ranking
  MARGIN: 30,              // Margen del canvas
  backgroundColor: '#FFFFFF' // Fondo blanco
};
```

## 🛠️ Creación de Grafos

### Configuración Básica

```typescript
const initialCreator = {
  tournamentId: 'my_tournament',
  qualyrankList: getQualifiedTeams(),
  rankGroupNumbers: [32] // 32 equipos iniciales
};

const phaseCreators = [
  {
    id: 1,
    stages: [
      {
        count: 1, // Una etapa de grupos
        stage: {
          type: 'group',
          value: 8,      // 8 grupos
          opt: 'rr'      // Round robin
        }
      }
    ]
  }
];

const gsg = createGSG(initialCreator, phaseCreators);
```

### Validación y Análisis

```typescript
// Obtener caminos posibles
const paths = gsg.getAllSimplePath('ini', 'fin');

// Calcular duración mínima
const minWeeks = gsg.getHwsNumberMinimum();

// Verificar estructura
const isValid = paths.length > 0;

// Obtener rankings necesarios
const initialRankings = gsg.getInitialRankings();
const finalRankings = gsg.getFinalRankings();
```

## 📈 Casos de Uso Avanzados

### Torneo con Múltiples Caminos

```typescript
// Equipos pueden seguir diferentes rutas
const complexTournament = {
  phases: [
    {
      stages: [
        { count: 2, stage: { type: 'group', value: 4 } },
        { count: 1, stage: { type: 'playoff', value: 2 } }
      ]
    },
    {
      stages: [
        { count: 1, stage: { type: 'transfer' } },
        { count: 2, stage: { type: 'table', value: 8 } }
      ]
    }
  ]
};
```

### Integración con Torneos Reales

```typescript
// El GSG se convierte en configuración de torneo real
const tournamentConfig = tournamentFromGSG(gsgData);
const tournament = Tournament.create(info, tournamentConfig, calendar);

// El torneo ejecuta la estructura definida en el GSG
tournament.phases.forEach(phase => {
  phase.stages.forEach(stage => {
    // Cada stage corresponde a un nodo del GSG
    stage.start(teams, calendar);
  });
});
```

Este sistema de grafos proporciona una base sólida para modelar cualquier tipo de competición deportiva, desde torneos simples hasta estructuras complejas con múltiples caminos y formatos mixtos.