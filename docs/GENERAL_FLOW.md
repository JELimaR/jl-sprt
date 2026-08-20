# Flujo General del Sistema - JSport

## Visión General

JSport simula el mundo del deporte organizado: instituciones (clubes), federaciones nacionales, confederaciones continentales y una entidad internacional. Cada temporada se crean torneos, se simulan partidos y se actualizan rankings que determinan ascensos, descensos y clasificaciones para la temporada siguiente.

El sistema es agnóstico del deporte — la lógica específica (goles, sets, puntos) se encapsula en un `SportProfile`.

---

## Estructura Organizativa

```
International Entity (entidad suprema mundial)
│
├── Confederation (confederación continental)
│   ├── Organiza torneos confederativos de instituciones (ej: Champions League)
│   ├── Organiza torneos confederativos de federaciones (ej: Copa América)
│   ├── Mantiene ranking confederativo de instituciones (coeficiente)
│   └── Mantiene ranking confederativo de federaciones
│
└── Federation (federación nacional)
    ├── Agrupa Institutions (clubes) como miembros
    ├── Define LeagueSystem por categoría (divisiones, ascensos/descensos)
    ├── Define CupSystem por categoría (copas nacionales)
    ├── Mantiene ranking interno de instituciones por categoría
    └── Organiza torneos nacionales (ligas, copas)
```

### Institutions (Clubes)

Cada `Institution` puede tener múltiples `Teams`, uno por categoría de edad. Las categorías son: S (senior), S23, S21, S19, S17, S15, S13.

```
Institution (Club)
├── Team categoría S (senior)
├── Team categoría S21
├── Team categoría S17
└── ...
```

### Tipos de participantes en torneos

- **Teams de instituciones**: representan a un club. Participan en ligas/copas nacionales y torneos confederativos de clubes.
- **Teams de federaciones**: representan a un país (selecciones nacionales). Participan en torneos confederativos y mundiales de selecciones.

El sistema de Tournament/Stage/Match trata a ambos como `Team` de forma uniforme. La distinción se refleja en los metadatos del ranking (`rankedEntity`).

---

## Sistemas de Competición por Federación

Cada federación define, por categoría:

### LeagueSystem (Sistema de Ligas)

Estructura de divisiones con ascensos y descensos:

```
LeagueSystem (categoría S)
├── División 1: N=20 equipos, p=0 ascienden, r=3 descienden
├── División 2: N=22 equipos, p=3 ascienden, r=4 descienden
└── División 3: N=24 equipos, p=4 ascienden, r=0 descienden
```

- `N`: cantidad de equipos en la división
- `p`: cuántos ascienden al final de temporada
- `r`: cuántos descienden al final de temporada

El LeagueSystem puede evolucionar entre temporadas (agregar divisiones, cambiar tamaños). El sistema calcula automáticamente las condiciones de transición.

### CupSystem (Sistema de Copas)

Torneos de eliminación directa organizados por la federación.

---

## Simulación de una Temporada

Cada temporada sigue este flujo:

```
┌─────────────────────────────────────────────────────────────────┐
│                      INICIO DE TEMPORADA (año Y)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Registrar nuevos miembros en federaciones (si los hay)      │
│     └─ Crear institution, agregarla a la federación             │
│     └─ Crear team por categoría                                 │
│     └─ Agregar al ranking de la categoría                       │
│                                                                 │
│  2. Publicar ranking actual de cada federación                  │
│     └─ federation.getRanking(category)                          │
│     └─ Guardar en RankingStore                                  │
│                                                                 │
│  3. Actualizar LeagueSystem (si la estructura cambia este año)  │
│     └─ Validar compatibilidad con cantidad de equipos           │
│     └─ Calcular condiciones de transición si aplica             │
│                                                                 │
│  4. Crear torneos de la temporada                               │
│     └─ federation.createTournamentList() → uno por división     │
│     └─ Tournament.create(info, gsgData, cal, sportProfile)      │
│     └─ Asignar equipos: leer del RankingStore según qualyRank   │
│                                                                 │
│  5. Ejecutar simulación (avanzar calendario)                    │
│     └─ El calendario procesa eventos en orden cronológico:      │
│         • Event_StageStart → sorteo y asignación de equipos     │
│         • EventMatch → simulación de partidos                   │
│         • Event_StageEnd → tabla final → ranking del stage      │
│                                                                 │
│  6. Almacenar resultados finales                                │
│     └─ Ranking de cada tournament → RankingStore                │
│                                                                 │
│  7. Actualizar rankings de federación (fin de temporada)        │
│     └─ Leer resultados de cada división del RankingStore        │
│     └─ Aplicar ascensos y descensos                             │
│     └─ Reordenar ranking interno de la federación               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Repetir para año Y+1
```

---

## Sistema de Rankings

### RankingStore

Almacén centralizado de rankings (`RankingStore`). Guarda el ranking actual y el historial completo por context. Cada ranking tiene metadatos opcionales: season, quién lo generó, tipo de entidad rankeada.

### Convención de context (keys)

| Patrón | Significado |
|--------|-------------|
| `fr_<cat>_<fedId>` | Ranking de federación |
| `rs_<stageId>` | Ranking final de un Stage |
| `tr_<tournamentId>` | Ranking final de un Tournament |
| `cr_<cat>_<confId>` | Ranking confederativo de instituciones |
| `ir_<cat>_<intId>` | Ranking internacional de federaciones |

### Flujo de rankings en una temporada

```
Federation.getRanking()           → RankingStore (inicio de temporada)
                                         ↓
Tournament.asignarTeams()         ← lee del RankingStore (resolver equipos)
                                         ↓
Stage finaliza                    → RankingStore (ranking del stage)
                                         ↓
Tournament.getRelativeRank()      → RankingStore (ranking del torneo)
                                         ↓
Federation.updateRankings()       ← lee del RankingStore (ascensos/descensos)
```

### Rankings combinados y ponderados

Para torneos confederativos se pueden generar rankings combinados:

- `Ranking.combine()` — pondera múltiples rankings por peso (ej: coeficiente de 5 años)
- `Ranking.historical()` — promedia rankings históricos de un mismo context por temporada
- `Ranking.aggregate()` — agrega rankings con función de score personalizada

Estos rankings se guardan en el RankingStore y se usan como fuente para los `qualyRankList` de torneos confederativos/internacionales.

---

## Ejecución basada en Calendario (JCalendar)

El calendario es un sistema de eventos ordenados cronológicamente. Al crear un Tournament, se programan automáticamente todos los eventos necesarios:

1. **Event_StageStart** — inicio de etapa: sorteo de bombos y asignación de equipos a grupos/llaves
2. **EventMatch** — simulación de cada partido individual
3. **Event_StageEnd** — fin de etapa: genera tabla final y ranking del stage

El loop de simulación simplemente avanza el calendario ejecutando eventos:

```typescript
while (hay eventos futuros) {
  obtener siguiente evento
  avanzar fecha actual
  ejecutar evento
}
```

---

## GeneralStageGraph (GSG)

Cada torneo se define por un grafo dirigido (GSG) que describe su estructura:

- **InitialNode** — punto de entrada con la lista de participantes requeridos (`qualyRankList`)
- **StageGroupNode** — etapa de grupos (round robin)
- **StagePlayoffNode** — etapa eliminatoria (eliminación directa)
- **TransferStageNode / TableStageNode** — nodos de procesamiento (redistribuyen equipos)
- **RankGroupNode** — conectores de flujo entre etapas
- **FinalNode** — punto final

El GSG define la estructura genérica del torneo. Al momento de crear el `Tournament`, el GSG se convierte en configuración concreta (`ITournamentConfig` con Phases y Stages).

---

## SportProfile

Cada torneo se crea con un `ISportProfile` que encapsula la lógica específica del deporte:

- Cómo se crea un partido (`createMatch`)
- Cómo se simula (`createMatchPlay`)
- Cómo se genera el resultado (`createResult`)
- Cómo se construye la tabla de posiciones (`createTableItem`, `updateTableFromResult`)
- Cómo se resuelven series ida/vuelta (`createSerie`)

Perfiles implementados:
- `FootballProfile` — fútbol (goles, 3pts victoria, 1pt empate)
- `VolleyballProfile` — volleyball (sets, puntos por set)
- `AmericanFootballProfile` — fútbol americano

Agregar un nuevo deporte = crear un nuevo profile con sus clases concretas.

---

## Resumen del flujo de datos completo

```
Datos Geográficos (Continents / Countries / Towns)
     ↓
Institutions (clubes con Teams por categoría)
     ↓
Federation (agrupa institutions, define LeagueSystem + CupSystem)
     ↓
Confederation (agrupa federations, organiza torneos continentales)
     ↓
┌─────────── LOOP POR TEMPORADA ───────────┐
│                                           │
│  Federation.getRanking() → RankingStore   │
│              ↓                            │
│  createTournamentList() → GSG → Tournament│
│              ↓                            │
│  asignarTeams() ← lee RankingStore        │
│              ↓                            │
│  JCalendar avanza → eventos → partidos   │
│              ↓                            │
│  Rankings finales → RankingStore          │
│              ↓                            │
│  Federation.updateRankings() ← ascensos/descensos │
│                                           │
└───────────────────────────────────────────┘
```
