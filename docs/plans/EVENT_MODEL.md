# Modelo de eventos del calendario — problemas abiertos y propuestas

> Estado: **documento de diseño / decisiones**. No describe código a escribir ya.
> Documenta tres problemas del modelo de eventos (`JEvent`/`JCalendar` de
> jl-calendar y sus subclases en jl-sprt) y propone cómo abordarlos. Surgen de
> necesidades del frontend (`jl-sprt-app`): calendario, programación flexible de
> partidos y eventos con duración.

Contexto verificado del flujo actual:

- Un `Tournament` se crea con sus fases/stages y, dentro de cada `League` (BaseStage),
  se crean los `Turn` con sus `A_Match`. Cada match tiene una **fecha media posible**
  derivada de su `hw` (media semana) al construirse (`A_Match` hace
  `JDateTime.createFromHalfWeekOfYearAndYear(hw, season, 'middle')`).
- Pero al crear el torneo, el calendario **solo** contiene: `Event_StageStart`,
  `Event_StageEnd` y un `Event_ScheduleOfTurnMatches` por jornada.
- El `Event_ScheduleOfTurnMatches` de una jornada se ejecuta en su
  `turnHalfWeeksSchedule` y **recién ahí** llama `match.schedule(dt)` y **crea** el
  `JEventMatch` de cada partido. Es decir: los partidos NO están en el calendario
  hasta que se ejecuta su evento de programación.
- `JEventMatch.execute()` hace `match.start()` y un loop `while (state !== 'finished')
  match.advance()` — o sea simula el partido entero en un solo instante.
- `A_MatchPlay` ya tiene `_time` y `advance()`: la base para una simulación por pasos
  existe, pero hoy se agota dentro de un único `execute()`.

---

## Reparto por paquete (jerarquía de dependencias)

Son **tres paquetes independientes** con una dependencia unidireccional estricta:

```
jl-calendar   (modelo de tiempo y eventos: JDateTime, JEvent, JCalendar)
     ▲
     │  depende de
jl-sprt       (dominio deportivo: eventos concretos, torneos, matches, profiles)
     ▲
     │  depende de
jl-sprt-gui / jl-sprt-app   (frontend Next.js: UI, motor de avance de la app)
```

Regla: **cada cambio va en la capa más baja que lo permite, sin invertir la
dependencia.** `jl-calendar` no sabe nada de fútbol ni de torneos; `jl-sprt` no sabe
nada de React ni de UI; la app no reimplementa lógica de dominio.

Qué tipo de cambio corresponde a cada paquete en estos problemas:

- **jl-calendar** — el **mecanismo genérico** del calendario y los eventos, agnóstico
  del deporte:
  - Reubicar un evento en el tiempo (P1).
  - Contrato de evento interactivo: estado `pending`, `requiresInput`, `resolve()`;
    y que el avance del calendario frene ante un evento pendiente (P2).
  - Eventos con **duración**: que un `JEvent` ocupe un rango y el calendario avance
    intervalo a intervalo llamando `advance()` a los eventos activos (P3).
  - Nada de esto menciona partidos ni torneos: son capacidades del calendario.

- **jl-sprt** — las **subclases concretas** de evento y la lógica de dominio que usa
  las capacidades de jl-calendar:
  - Crear los `JEventMatch` desde el inicio y hacer que `Event_ScheduleOfTurnMatches`
    los **reubique** (P1).
  - Marcar qué eventos concretos son interactivos y qué decisión piden; la
    `SchedulingPolicy` (auto/fija) como lógica de dominio pura (P2).
  - Que `JEventMatch` sea un evento con duración conectado a `A_MatchPlay` (P3).
  - Es dominio puro y determinista: NO pide input por sí mismo, solo **declara** que
    un evento requiere input y sabe cómo **aplicar** la decisión recibida.

- **jl-sprt-gui / jl-sprt-app** — la **interacción con el usuario** y la orquestación
  del avance en la UI:
  - Motor de avance de la app (`advance`/`advanceIntervals`) que frena ante un evento
    interactivo (P2) y que puede avanzar de a intervalos para ver partidos en curso (P3).
  - La UI que **pide la decisión** al usuario cuando hay un evento pendiente y llama a
    `resolve(decision)` (P2).
  - La vista "en vivo" del partido y el calendario que lee `cal.events` (P1, P3).
  - NO decide reglas de dominio: solo recolecta el input y lo pasa a jl-sprt.

> Los problemas son **intra-paquete en su núcleo** (cada capacidad nueva vive en un
> paquete), pero se **manifiestan cruzando capas**: una necesidad de la app (P.ej.
> "pausar y pedir programación") requiere una capacidad en jl-calendar (evento
> pendiente que bloquea), su uso concreto en jl-sprt (qué evento y qué decisión), y su
> orquestación + UI en la app. Por eso cada problema abajo indica explícitamente qué
> parte toca cada paquete.

---

## Problema 1 — Los partidos aparecen en el calendario tarde (recién al programarlos)

### Situación

Cuando se crea el torneo ya se conoce **qué partidos se van a jugar** y su **fecha
media aproximada** (viene de los `hw` de la config). Pero en el calendario no
aparecen hasta que corre el `Event_ScheduleOfTurnMatches` de su jornada, que es el
que crea los `JEventMatch`. Para el frontend (mostrar el fixture completo desde el
inicio) esto es limitante: hay que leer los matches desde `stage.groups[].turns[]`
en vez de desde los eventos del calendario, y los partidos futuros "no existen" como
eventos hasta ser programados.

### Idea propuesta (del usuario, correcta)

Invertir el flujo: **crear los `JEventMatch` desde el principio**, ubicados en su
fecha media posible, y que el `Event_ScheduleOfTurnMatches` (programación de una
ronda/turno), en lugar de **crear** los eventos, solo **los modifique** (reubique su
fecha/hora a la definitiva).

### Cómo modelarlo

1. Al construir el `Turn`/`League`, además de crear los `A_Match`, crear ya sus
   `JEventMatch` en el calendario con la fecha media (`hw`, `'middle'`). Así el
   fixture completo está en `cal.events` desde el arranque del torneo.
2. `Event_ScheduleOfTurnMatches.execute()` deja de hacer `new JEventMatch(...)` y pasa
   a **reprogramar** los eventos ya existentes de esa jornada: fija su fecha/hora
   definitiva y actualiza `match.schedule(dt)`.
   - Esto requiere que el `JCalendar` soporte **mover un evento** de una fecha a otra
     (hoy `addEvent` solo inserta; falta un `rescheduleEvent`/`moveEvent`, o que el
     evento tenga su fecha mutable y el calendario se reindexe). El `_eventsMap` está
     indexado por `absolute`, así que mover implica sacar de una key y poner en otra.
3. Estado del match/evento: un `JEventMatch` "todavía no programado en firme" vs "ya
   programado" se distingue por el estado del `A_Match` (`created`/`scheduled`), que
   ya existe. La fecha media es tentativa; la definitiva la fija la programación.

### Implicancias

- El frontend puede construir el calendario **solo** desde `cal.events` (partidos +
  organización), sin bajar a las clases internas del stage. Encaja con lo que hoy la
  app resuelve leyendo `stage.groups[].turns[]`.
- Contrato nuevo en jl-calendar: capacidad de **reubicar** un evento en el tiempo.
- Cuidado con el orden: reprogramar un evento debe seguir respetando "es futuro
  respecto a `now`" (la validación del constructor de `JEvent`).

### Reparto por paquete

- **jl-calendar**: agregar la capacidad genérica de **mover/reubicar** un evento
  (reindexar `_eventsMap` de una key a otra), respetando la validación de futuro.
- **jl-sprt**: crear los `JEventMatch` al construir el `Turn`/`League`; que
  `Event_ScheduleOfTurnMatches.execute()` **reubique** en vez de crear.
- **app**: consumir `cal.events` para pintar el fixture completo desde el inicio
  (deja de depender de leer `stage.groups[].turns[]`).

---

## Problema 2 — Eventos automáticos vs eventos interactivos (que piden decisión al usuario)

> Esto es **general** para cualquier evento, no solo la programación de partidos.
> La programación de una ronda/turno es el **ejemplo** motivante, pero el mismo
> mecanismo aplica a sorteos, decisiones de formato, etc.

### Situación

Hoy todo `JEvent` es **autónomo**: cuando el reloj (`now`) llega a su fecha, su
`execute()` se ejecuta solo y resuelve el evento por completo, sin intervención
externa. El avance del calendario es un *push*: "llegó la fecha → se ejecuta".

Se quiere distinguir dos clases de evento:

- **Automático**: se resuelve solo al llegar su fecha (como hoy). Ej.: cierre de
  stage, o programación cuando la política es automática.
- **Interactivo**: al llegar su fecha, **NO se resuelve solo**. El avance de la
  simulación **se detiene en ese evento**, queda **pendiente**, y la interfaz le pide
  al usuario que tome la decisión (ej.: "programá los partidos de esta ronda ahora").
  Recién cuando el usuario decide, el evento se completa y la simulación puede seguir
  avanzando.

Caso concreto: al avanzar el calendario hasta un `Event_ScheduleOfTurnMatches`
interactivo, la app pausa ahí y muestra al usuario la ronda para que fije fecha/hora
de cada partido en ese momento. No se autoprograma con una regla fija.

### El cambio de fondo

Pasar de "el evento se ejecuta solo cuando llega su fecha" a "el evento puede
**requerir una decisión externa** y **bloquear el avance** hasta que esa decisión
llegue". Es un modelo *pull*/interactivo para ciertos eventos, en vez de *push* puro.

### Cómo modelarlo

1. **Marcar el evento como interactivo o automático.** Un `JEvent` (o una subclase)
   declara si necesita input externo. Propuesta de contrato:
   ```
   // en JEvent (jl-calendar)
   get requiresInput(): boolean;   // false por defecto (automático)
   ```
   o un tipo de evento aparte (`InteractiveEvent`) con estado
   `pending → resolved`.

2. **El avance del calendario respeta los eventos interactivos.** Cuando el loop de
   avance (hoy `advance()`/`advanceIntervals()` en la app) llega a un evento con
   `requiresInput`, **se detiene sin ejecutarlo** (lo deja `pending`) y devuelve el
   control. La app detecta que hay un evento pendiente y muestra la UI de decisión.
   - El calendario necesita exponer "hay un evento pendiente que requiere input"
     (algo como `getPendingInteractiveEvent()`), y el avance debe frenar ahí en vez
     de ejecutar.

3. **La decisión del usuario resuelve el evento.** La app, con el input del usuario,
   llama a algo como `event.resolve(decision)` que aplica la decisión (ej.: programa
   los partidos con las fechas elegidas) y marca el evento como resuelto. Entonces el
   avance puede continuar.

4. **La política de "cómo" sigue siendo intercambiable.** Ortogonal a lo anterior:
   *quién/cómo* decide. La misma acción (programar una ronda) puede resolverse:
   - **auto por el sistema** (evento automático + política que distribuye fechas,
     evitando choques, sin fijar siempre el mismo día/hora), o
   - **manual por el usuario** (evento interactivo que pausa y pide las fechas).
   Esto se puede modelar con una estrategia inyectable por competición/torneo:
   ```
   interface SchedulingPolicy {
     scheduleTurn(turn, window, calendar): void; // auto
     // o marcar el evento como interactivo para pedir input
   }
   ```
   pero la decisión clave de este problema es el **mecanismo de pausa/resolución**
   (puntos 1–3), no solo la estrategia.

### Implicancias

- Es un cambio en el **contrato de `JEvent`/`JCalendar`** (jl-calendar): eventos que
  pueden estar `pending` y bloquear el avance; API para consultarlos y resolverlos.
- El motor de avance (hoy en la app: `advance`/`advanceIntervals`) debe frenar al
  toparse con un evento interactivo, no ejecutarlo.
- Encaja con la filosofía de ARCHITECTURE.md §5: el usuario decide desde la app,
  el sistema aplica de forma coherente. Acá el usuario decide **en el momento** en
  que el evento ocurre (no pre-agendado), y el sistema espera esa decisión.
- Determinismo/reproducibilidad: un evento interactivo introduce una decisión externa;
  para reproducir/persistir, la decisión tomada debe guardarse (igual que un
  resultado de partido) para poder re-simular sin volver a pedir input.

### Reparto por paquete

- **jl-calendar**: el **mecanismo genérico** de evento interactivo — estado `pending`,
  `requiresInput`, `resolve(decision)`, y que el avance del calendario **frene** ante
  un evento pendiente + API para consultarlo (`getPendingInteractiveEvent()`). Todo
  agnóstico del deporte.
- **jl-sprt**: marcar qué eventos concretos son interactivos (p. ej.
  `Event_ScheduleOfTurnMatches`), definir el **tipo de decisión** que piden y cómo
  **aplicarla**; la `SchedulingPolicy` auto/fija como lógica de dominio pura. NO pide
  input: solo declara y aplica.
- **app**: el motor de avance que respeta el freno; **detectar** el evento pendiente,
  mostrar la **UI de decisión** al usuario y llamar a `resolve(decision)`; persistir
  la decisión tomada (para reproducibilidad).

---

## Problema 3 — Eventos con duración (ver un partido "en juego")

### Situación

Hay eventos que duran **un instante** (inicio de stage, cierre de stage, programación)
y otros que duran **varios intervalos** (un partido). Hoy un `JEventMatch.execute()`
simula el partido completo en un único instante, así que nunca existe un estado
intermedio observable: si el usuario avanza 15 minutos (3 intervalos), no puede ver
"este partido se está jugando" con un resultado parcial.

Se quiere que, al avanzar N intervalos, un partido en curso se muestre **en juego**,
con su progreso parcial.

### Base existente

- `A_Match` ya tiene el estado `'playing'` y el método abstracto `advance()`.
- `A_MatchPlay` ya tiene `_time` y `advance()` (avance por pasos).
- `jl-calendar` ya tiene `JEventOthers` (máquina de estados `created → process →
  finished`) y el hook `JEvent.advance()` para "eventos que duran varios intervalos".

O sea: las piezas para eventos multi-intervalo **existen** pero no se usan; el partido
se resuelve de una en `execute()`.

### Cómo modelarlo

1. El `JEventMatch` debe representar un evento **con duración**: ocupa el rango
   `[inicio, inicio + duración)` en el calendario, no un único instante.
   - Al llegar `now` al inicio: `match.start()` → estado `'playing'`.
   - Por cada intervalo que avanza `now` dentro del rango: `match.advance()` (un paso
     de `A_MatchPlay`), actualizando el resultado parcial.
   - Al llegar al fin (o cuando `A_MatchPlay` termina): `match.finish()` → `'finished'`.
2. El `JCalendar` debe soportar **avanzar el reloj intervalo a intervalo** ejecutando
   el `advance()` de los eventos en curso (no solo el `execute()` puntual en su fecha).
   Hoy `advanceIntervals` en la app salta de grupo de eventos en grupo de eventos; el
   modelo con duración requiere que el calendario "tique" y notifique a los eventos
   activos en cada intervalo (o al menos al consultar el estado en un `now` dado,
   poder reconstruir el progreso parcial).
3. Duración de un partido: definida por el deporte (`A_MatchPlay` sabe cuántos pasos/
   intervalos dura). Fútbol vs vóley tienen duraciones distintas.

### Implicancias

- Es el problema más profundo: toca el contrato de `JEvent`/`JCalendar` (pasar de
  "eventos puntuales que se ejecutan en su fecha" a "eventos que pueden tener
  duración y avanzar por intervalos") y la relación con `A_MatchPlay`.
- Para el frontend: permite una vista "en vivo" (partido jugándose, marcador parcial)
  al avanzar de a pocos intervalos, y coherencia con el modelo temporal de 5 min/interv
  de jl-calendar.
- Relación con Problema 1: si los `JEventMatch` ya existen desde el inicio (P1) y
  tienen duración (P3), el calendario tiene el fixture completo con ventanas de tiempo
  reales desde el arranque.

### Reparto por paquete

- **jl-calendar**: que un `JEvent` pueda tener **duración** (ocupar un rango) y que el
  calendario avance **intervalo a intervalo** invocando `advance()` de los eventos
  activos (no solo `execute()` puntual). Aprovechar/rehacer `JEventOthers`.
- **jl-sprt**: `JEventMatch` como evento con duración conectado a `A_MatchPlay`
  (start → advance por paso → finish); la **duración por deporte** la define el
  `A_MatchPlay` concreto (fútbol vs vóley).
- **app**: avanzar de a pocos intervalos y **renderizar** el partido "en juego" con su
  marcador parcial (vista en vivo); leer el estado en un `now` dado.

---

## Resumen

| # | Problema | Núcleo del cambio | Toca |
|---|----------|-------------------|------|
| 1 | Partidos aparecen tarde en el calendario | Crear `JEventMatch` desde el inicio; programar = **mover** el evento, no crearlo | jl-calendar (reubicar evento), jl-sprt (Event_ScheduleOfTurnMatches) |
| 2 | Eventos automáticos vs interactivos (piden decisión al usuario) | `JEvent` que puede quedar `pending` y **bloquear el avance** hasta que el usuario lo resuelva; API para consultarlo/resolverlo. General a cualquier evento | jl-calendar (JEvent/JCalendar), jl-sprt (eventos concretos), app (motor de avance + UI de decisión) |
| 3 | Eventos sin duración (no se ve "en juego") | `JEventMatch` con duración; calendario que avanza por intervalos usando `advance()` | jl-calendar (JEvent/JCalendar), jl-sprt (JEventMatch + A_MatchPlay) |

Los tres están relacionados. P1 pone los partidos en el calendario desde el inicio;
P2 permite que ciertos eventos **pausen la simulación y pidan una decisión al
usuario** (la programación de una ronda es el ejemplo, pero aplica a cualquier
evento); P3 les da duración real para la vista en vivo. La decisión de scheduling
(fija/auto/manual) es una faceta de P2, pero el corazón de P2 es el **mecanismo de
pausa/resolución** de eventos interactivos.
