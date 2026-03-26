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
- **Formato**: Round Robin con o sin Ida/Vuelta


**Cálculos Automáticos**:
- **Participantes por grupo**: Distribución equilibrada (3-20 por grupo)
- **Fechas necesarias**: `(participantes_por_grupo - 1) * (ida_vuelta ? 2 : 1)`
- **Rankings generados**: Por posición en cada grupo

#### StagePlayoffNode (`PLY`)
- **Color**: Azul claro (`#6184D8`)
- **Función**: Eliminación directa
- **Restricción**: Participantes debe ser potencia de 2
- **Formatos**: Partido único, ida/vuelta, campo neutral

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

#### TableStageNode (`TBL`)
- **Color**: Rosa (`#E9BCB7`)
- **Función**: División de ranking en clasificados/eliminados
- **Entrada**: Exactamente 1 ranking
- **Salida**: 2 rankings (clasificados + eliminados)

#### ReOrderStageNode (`ROR`)
- **Color**: Personalizable
- **Función**: Reordenamiento de rankings
- **Entrada**: Exactamente 2 rankings
- **Salida**: Los mismos 2 rankings en orden inverso

### 4. Nodos de Ranking (RankGroupNode)

#### RankGroupNode (`RG`)
- **Color**: Negro (`#06070E`)
- **Tamaño**: Más pequeño (10px vs 20px)
- **Función**: Representa grupos específicos de equipos
- **Datos**: Ranking con posiciones y origen

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

## 🛠️ Creación de Grafos

### Configuración Básica

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

### Integración con Torneos Reales

Este sistema de grafos proporciona una base sólida para modelar cualquier tipo de competición deportiva, desde torneos simples hasta estructuras complejas con múltiples caminos y formatos mixtos.