##

las tablas de una league parciales (antes del final de la misma) pueden mostrar errores al usar el promedio de puntos cuando la cantidad de participantes es impar.
Esto ocurre porque los equipos han jugado distinta cantidad de partidos dentro del torneo.
Se usa el PM cuando se comparan distintos grupos por ejemplo, es decir, tiene más sentido para ordenar el final de una Stage, pero no en un BaseStage

---

## Los eventos del calendario no exponen tipo ni descripción pública

Para poder mostrar en el frontend **todos** los eventos del calendario (no solo
los partidos, sino también los de organización: programación de partidos, sorteo
e inicio de stage, cierre de stage, etc.), se necesita poder leer `cal.events` y
saber, de cada `JEvent`, qué tipo es y una descripción legible.

Hoy eso no es posible de forma limpia: los campos de cada subclase de evento son
privados (`_stage`, `_turn`, `_league`, `_match`) y desde `cal.events` solo se
accede a `dateTime` y `execute()`. No hay forma pública de discriminar el tipo de
evento ni obtener un texto para mostrar.

### Solución propuesta (definitiva)

Es un cambio que involucra a las dos librerías:

1. **jl-calendar** — agregar al `JEvent` base un contrato público, por ejemplo:
   ```ts
   abstract get kind(): string;   // 'match' | 'stage-start' | 'stage-end' | 'schedule' | ...
   abstract get label(): string;  // texto legible del evento
   ```
   (o un único `getInfo(): { kind: string; label: string }`).
   Luego publicar nueva versión de jl-calendar.

2. **jl-sprt** — implementar `kind`/`label` en cada subclase de evento:
   - `JEventMatch` → kind `'match'`, label `"Home vs Away"`.
   - `Event_ScheduleOfTurnMatches` → kind `'schedule'`, label `"Programación jornada N"`.
   - `Event_StageStart` → kind `'stage-start'`, label `"Inicio de stage X (sorteo)"`.
   - `Event_StageEnd` → kind `'stage-end'`, label `"Cierre de stage X"`.
   Luego publicar nueva versión de jl-sprt (y actualizar la app).

3. **app (jl-sprt-app)** — exponer en `SimpleLeague` un método `getAllEvents()`
   que lea `cal.events` y devuelva datos planos `{ date, kind, label }`, y adaptar
   el calendario para mostrar los eventos de organización además de los partidos
   (con colores distintos por tipo).

### Workaround temporal (en uso)

Mientras no estén publicados los cambios anteriores, la app discrimina el tipo de
evento con `instanceof` sobre las clases concretas exportadas por jl-sprt. Es
frágil (se rompe con minificación y acopla la app a clases internas), por lo que
está marcado con comentarios `// WARNING` en el código y debe reemplazarse por el
contrato `kind`/`label` cuando esté disponible.
