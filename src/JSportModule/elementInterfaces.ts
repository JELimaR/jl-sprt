// ============================================================================
// Contrato del ElementController (API server) — Fase A: liga simple end-to-end.
//
// Define las operaciones de SIMULACIÓN de torneos y los DTOs PLANOS que la API
// expone. Principios (ver docs/plans/API_CONTROLLERS.md):
//   - La API nunca devuelve/recibe instancias del dominio (Tournament, A_Result,
//     Ranking, JDateTime...). Solo DTOs serializables.
//   - DTOs de SALIDA con nombres LEGIBLES (id/name/...). El volumen se controla
//     con paginación y DTOs resumen/detalle, no con nombres cortos.
//   - Sesiones por `simulationId`: cada simulación es estado aislado; el front
//     maneja solo el id + DTOs. Esto habilita migrar a DB a futuro sin romper el
//     contrato.
//   - Errores: los COMANDOS lanzan ante entrada inválida o simulación inexistente;
//     las QUERIES devuelven null/[] para "no encontrado" esperable.
//
// Este archivo es SOLO TIPOS (Paso 1 del plan). La implementación vive en
// JSportServerModule/Element.
// ============================================================================

import type { IJDateTime } from 'jl-calendar';
import type { TSport } from 'jl-sprt-match';
import type { TypeBaseStageOption, TypeCategory } from 'jl-sprt-core';

// ----------------------------------------------------------------------------
// DTOs comunes
// ----------------------------------------------------------------------------

/**
 * Instante del calendario como dato plano. Reutiliza `IJDateTime` (date/time) de
 * jl-calendar y agrega el entero monótono `absolute` (para ordenar/comparar y
 * resaltar en la UI) y una etiqueta ya formateada.
 */
export interface IDateTimeDTO {
  absolute: number;
  dateTime: IJDateTime;
  /** Etiqueta legible lista para mostrar (p. ej. "lun 03 feb 1986 00:00 - HW 10"). */
  label: string;
}

/** Estado de un partido (espeja TypeMatchState del dominio como string plano). */
export type MatchStateDTO =
  | 'created'
  | 'scheduled'
  | 'reschuduled'
  | 'postponed'
  | 'playing'
  | 'finished';

/** Puntaje de un set (deportes por sets, ej. vóley). */
export interface SetScoreDTO {
  home: number;
  away: number;
}

/** Vista plana de un partido. */
export interface IMatchDTO {
  id: string;
  /** Jornada/turno al que pertenece (si aplica). */
  turn: number;
  homeTeamId: string;
  homeName: string;
  awayTeamId: string;
  awayName: string;
  state: MatchStateDTO;
  /** Marcador numérico comparable (incluye parcial si está en juego). */
  homeScore: number;
  awayScore: number;
  /** Marcador ya formateado por el deporte (p. ej. "2 - 1"). null si aún no inició. */
  scoreText: string | null;
  /** Desglose por set (vacío en deportes sin sets). */
  sets: SetScoreDTO[];
  /** true si el partido se está jugando ahora mismo. */
  live: boolean;
  date: IDateTimeDTO;
  halfWeek: number;
}

/**
 * Fila de la tabla de posiciones. `values` son las columnas propias del deporte
 * (football: P/W/D/L/gf/ga/sg/ps/pm; vóley: sw/sl/pf/pa/...), ya con el valor
 * numérico; el front decide qué columnas mostrar y con qué etiqueta.
 */
export interface IStandingRowDTO {
  pos: number;
  teamId: string;
  teamName: string;
  values: Record<string, number>;
}

/** Tipo de evento del calendario (espeja JEvent.kind). */
export type EventKindDTO = string;

/** Evento del calendario como dato plano. */
export interface ICalendarEventDTO {
  id: string;
  kind: EventKindDTO;
  /** Etiqueta neutral del evento (el front puede re-etiquetar/traducir). */
  label: string;
  date: IDateTimeDTO;
  /** Si el evento es un partido, el id del match (para abrir el detalle). */
  matchId?: string;
}

/**
 * Referencia a un participante de un slot del fixture, en cualquier etapa de
 * resolución (espeja FixtureParticipantRef del dominio como dato plano).
 *  - `seed`: posición del ranking inicial del stage (aún sin equipo).
 *  - `team`: equipo ya resuelto (el draw ocurrió) — incluye el nombre legible.
 *  - `winnerOf`/`loserOf`: ganador/perdedor de otro slot (playoff).
 */
export type FixtureParticipantRefDTO =
  | { kind: 'seed'; pos: number }
  | { kind: 'team'; teamId: string; teamName: string }
  | { kind: 'winnerOf'; slotId: string }
  | { kind: 'loserOf'; slotId: string };

/**
 * Un partido del fixture conocido estructuralmente desde la creación del torneo,
 * exista o no todavía el partido concreto. Permite mostrar "cuándo va a haber un
 * partido" antes de que se materialice (draw/schedule).
 */
export interface IFixtureSlotDTO {
  slotId: string;
  stageId: string;
  /** Grupo (1-based) en ligas multi-grupo; ausente si no aplica. */
  group?: number;
  /** Jornada (liga) o ronda (playoff), 1-based. */
  turn: number;
  /** Half-week aproximada en que se jugará. */
  halfWeek: number;
  home: FixtureParticipantRefDTO;
  away: FixtureParticipantRefDTO;
  /** Si el partido concreto ya existe, su id (para abrir el detalle vía getMatch). */
  matchId?: string;
}

/** Estado completo de una simulación en un instante dado. */
export interface ISimulationStateDTO {
  standings: IStandingRowDTO[];
  matches: IMatchDTO[];
  events: ICalendarEventDTO[];
  currentDate: IDateTimeDTO;
  /** Hay un próximo evento futuro por procesar. */
  hasNextEvent: boolean;
  /** Hay partidos durativos en curso ahora mismo. */
  hasActiveMatches: boolean;
  /** Se puede seguir avanzando (eventos futuros o partidos en curso). */
  canAdvance: boolean;
  /** El torneo/stage terminó. */
  finished: boolean;
}

// ----------------------------------------------------------------------------
// Inputs — API real
// ----------------------------------------------------------------------------

/** Identificador de una simulación creada. */
export interface ISimulationRef {
  simulationId: string;
}

/** Resultado de avanzar: el estado ya actualizado + si hubo eventos pendientes. */
export interface IAdvanceResultDTO {
  state: ISimulationStateDTO;
  /** Eventos que frenaron el avance (interactivos). Vacío si avanzó limpio. */
  pendingEvents: ICalendarEventDTO[];
}

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ CASOS DE USO / ESCENARIOS DE PRUEBA — NO es la API real                    ║
// ║                                                                            ║
// ║ Lo que sigue (inputs + el método `createSimpleLeague` del controller) NO   ║
// ║ forma parte del contrato "real" de la API de elements. Son HELPERS para    ║
// ║ montar un escenario de simulación concreto (una liga simple) y así poder   ║
// ║ construir/probar los componentes de la app (p. ej. /tests/simple-league).  ║
// ║ La construcción real de torneos del mundo vivirá en otro flujo (SportWorld ║
// ║ / creadores de torneos), no acá. Mantener este bloque claramente separado. ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/** [CASO DE USO] Equipo de entrada para crear una liga simple (datos mínimos legibles). */
export interface ISimpleLeagueTeamInput {
  /** Opcional: si no se provee, la API genera uno. */
  id?: string;
  name: string;
}

/** [CASO DE USO] Input para crear una liga simple (1 fase, 1 grupo). */
export interface ICreateSimpleLeagueInput {
  sport: TSport;
  teams: ISimpleLeagueTeamInput[];
  /** Formato: 'home' (solo ida), 'h&a' (ida y vuelta), 'neutral'. */
  opt: TypeBaseStageOption;
  /** Temporada (año del modelo). Si se omite, la API usa una por defecto. */
  season?: number;
  /** Categoría de los equipos. Si se omite, 'S'. */
  category?: TypeCategory;
}

// ----------------------------------------------------------------------------
// Controller
// ----------------------------------------------------------------------------

/**
 * ElementController — ciclo de vida y lectura de simulaciones de torneo.
 *
 * Fase A: solo liga simple. Las operaciones de torneo referencian la simulación
 * por `simulationId`. Comandos lanzan ante id inexistente; queries devuelven
 * null/[] cuando corresponde a "no encontrado" esperable.
 */
export interface IElementController {
  // ===========================================================================
  // API REAL — operaciones genéricas de simulación (independientes del escenario)
  // ===========================================================================

  // --- comandos ---

  /**
   * Avanza EXACTAMENTE un intervalo (un `tick` del calendario). Es el avance fino:
   * procesa lo que haya en el instante actual (ejecuta instantáneos, arranca/avanza
   * durativos) y mueve el reloj un intervalo, salvo que un evento interactivo frene.
   * No salta tiempo muerto: para llegar a la zona de eventos usar `advanceToNextEvent`.
   */
  advance(simulationId: string): IAdvanceResultDTO;

  /**
   * Salta el TIEMPO MUERTO hasta dejar el reloj en el intervalo INMEDIATAMENTE ANTERIOR
   * al próximo evento, sin ejecutarlo. El siguiente `advance` (un tick) es el que
   * ejecuta ese evento y arranca sus durativos; así, dentro de la zona de eventos cada
   * `advance` es un único tick (p. ej. ver un partido minuto a minuto).
   *
   * Si ya hay durativos en curso (hay actividad en el instante actual), no hay tiempo
   * muerto que saltar y no avanza. Si no quedan eventos futuros, tampoco avanza.
   */
  advanceToNextEvent(simulationId: string): IAdvanceResultDTO;

  /**
   * Avanza hasta `n` intervalos (n `tick`s), deteniéndose antes si aparece un evento
   * interactivo pendiente. Es el control "avanzar N intervalos" de la UI.
   */
  advanceIntervals(simulationId: string, n: number): IAdvanceResultDTO;

  /**
   * Un "paso" de conveniencia para un botón único de avance (combina las primitivas):
   *  - si hay actividad en el instante actual (durativos en curso, o el próximo evento
   *    está en el intervalo inmediatamente siguiente, o hay un evento en el instante
   *    actual) → hace un `tick` (ejecuta ese instante / avanza el durativo);
   *  - si no → salta el tiempo muerto dejando el reloj en el intervalo anterior al
   *    próximo evento (como `advanceToNextEvent`).
   *
   * Apretarlo repetidamente: salta al borde del próximo evento → tick que lo ejecuta y
   * arranca sus durativos → ticks mientras haya actividad → al quedar el instante
   * limpio y el próximo evento lejos, vuelve a saltar. No ejecuta el evento "de más":
   * el salto deja el reloj a las puertas, y es el tick siguiente el que lo ejecuta.
   */
  step(simulationId: string): IAdvanceResultDTO;

  /** Corre la simulación hasta el final (o hasta que un evento interactivo frene). */
  runAll(simulationId: string): IAdvanceResultDTO;

  /** Elimina la simulación y libera su estado. Devuelve true si existía. */
  dispose(simulationId: string): boolean;

  // --- queries ---

  /** Estado completo de la simulación. Lanza si el id no existe. */
  getState(simulationId: string): ISimulationStateDTO;

  /**
   * Fixture estructural: los partidos que van a ocurrir (half-week + emparejamiento),
   * conocidos desde la creación del torneo, con o sin el partido concreto ya
   * materializado. Útil para mostrar el calendario completo desde el inicio.
   */
  getFixture(simulationId: string): IFixtureSlotDTO[];

  /** Partidos de la simulación (los partidos concretos ya materializados). */
  getMatches(simulationId: string): IMatchDTO[];

  /** Un partido por id, o null si no existe. */
  getMatch(simulationId: string, matchId: string): IMatchDTO | null;

  /** Tabla de posiciones (parcial si la simulación está en curso). */
  getStandings(simulationId: string): IStandingRowDTO[];

  /** Eventos del calendario (partidos + organización) ordenados por instante. */
  getCalendarEvents(simulationId: string): ICalendarEventDTO[];

  /** Fecha/instante actual de la simulación. */
  getCurrentDate(simulationId: string): IDateTimeDTO;

  // ===========================================================================
  // CASOS DE USO / ESCENARIOS DE PRUEBA — NO es la API real (ver bloque arriba)
  //
  // Helper para montar un escenario concreto (liga simple) y construir/probar los
  // componentes de la app. La creación "real" de torneos del mundo irá por otro
  // flujo (SportWorld / creadores de torneos). No mezclar con los comandos de arriba.
  // ===========================================================================

  /** [CASO DE USO] Crea una simulación de liga simple y la deja lista para avanzar. */
  createSimpleLeague(input: ICreateSimpleLeagueInput): ISimulationRef;
}
