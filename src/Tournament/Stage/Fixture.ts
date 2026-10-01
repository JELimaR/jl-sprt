import { TypeHalfWeekOfYear } from "jl-calendar";

/**
 * Fixture "estructural" de un stage: los PARTIDOS QUE VAN A OCURRIR, conocidos desde
 * la creación del torneo, ANTES de que exista el objeto Match concreto (equipos
 * asignados + fecha exacta + evento de calendario).
 *
 * Idea (ver docs/plans/API_CONTROLLERS.md): el "cuándo" (half-week) y el
 * emparejamiento estructural (qué posición vs qué posición, o ganador de qué serie)
 * son determinísticos desde el create:
 *   - Liga: `robinRoundSchedulingFunction(n, opt)` da, por jornada, los pares de
 *     POSICIONES de ranking `[posHome, posAway]`; las half-weeks viven en el config.
 *   - Playoff: la ronda 1 empareja por posición; las rondas N>1 enfrentan a los
 *     GANADORES de series previas (referencia simbólica hasta que se juega).
 *
 * El slot se "completa" (gana `matchId`, equipos y estado) cuando el Match real se
 * materializa durante la simulación. El `FixtureParticipantRef` modela esos tres
 * estados de conocimiento del participante.
 */

/** Referencia a un participante de un slot, en cualquier etapa de resolución. */
export type FixtureParticipantRef =
  /** Posición del ranking inicial del stage (1-based). Aún no se sabe el equipo. */
  | { kind: 'seed'; pos: number }
  /** Equipo ya resuelto (el draw/asignación ya ocurrió). */
  | { kind: 'team'; teamId: string }
  /** Ganador de otro slot (playoff: rondas posteriores). */
  | { kind: 'winnerOf'; slotId: string }
  /** Perdedor de otro slot (por si algún formato lo necesita). */
  | { kind: 'loserOf'; slotId: string };

/**
 * Un partido del fixture, conocido estructuralmente. Si `matchId` está definido, el
 * Match concreto ya existe (y `home`/`away` serán `kind: 'team'`).
 */
export interface IFixtureSlot {
  /** Id estable del slot dentro del torneo (p. ej. "<stageId>-T1-M1" / "<stageId>-R1-S1"). */
  slotId: string;
  /** Id del stage que contiene el slot. */
  stageId: string;
  /** Grupo (1-based) en ligas multi-grupo; `undefined` si no aplica. */
  group?: number;
  /** Jornada (liga) o ronda (playoff), 1-based. */
  turn: number;
  /** Half-week aproximada en que se jugará (del config del stage). */
  halfWeek: TypeHalfWeekOfYear;
  home: FixtureParticipantRef;
  away: FixtureParticipantRef;
  /** Presente si el Match concreto ya fue materializado. */
  matchId?: string;
}
