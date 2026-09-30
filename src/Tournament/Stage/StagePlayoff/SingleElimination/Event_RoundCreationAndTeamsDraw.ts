import { IJEventInfo, JInstantEvent } from "jl-calendar";
import { AnyTeam } from "jl-sprt-core";
import { SingleElimination } from "./SingleElimination"
import { mostrarFecha } from "../../../../mostrarFechaBorrar";

export interface IEvent_RoundCreationAndTeamsDrawInfo extends IJEventInfo {
  playoff: SingleElimination;
}

/* Evento en el cual se generan las rounds y se definen los teams de la siguiente ronda */
export class Event_RoundCreationAndTeamsDraw extends JInstantEvent {
  private _playoff: SingleElimination;

  constructor(erctdi: IEvent_RoundCreationAndTeamsDrawInfo) {
    try {
      super(erctdi);
      this._playoff = erctdi.playoff;
    } catch (error) {
      console.log(erctdi)
      throw error
    }
  }

  get kind(): string { return 'draw'; }
  get label(): string { return `Sorteo/creación de ronda ${this._playoff.rounds.length + 1} (${this._playoff.info.id})`; }

  execute(): void {
    const thisRoundNumber = this._playoff.rounds.length + 1;
    console.log(`ejecuting creation of Round number: ${thisRoundNumber}, from: ${this._playoff.info.id}`);
    mostrarFecha(this.dateTime)

    // ---------------------------------------------------------------------------
    // PROPUESTA (NO IMPLEMENTADA): guarda de reprogramación del sorteo.
    //
    // ESTADO: el refactor de jl-sprt-match/core (fase de desempate acotada:
    // penales, golden set y overtime terminan en pocos intervalos) eliminó la
    // CAUSA PRÁCTICA de este problema; el crash ya no se reproduce (verificado con
    // 500 copas h&a de fútbol multi-ronda). La guarda de abajo queda como mejora
    // ESTRUCTURAL opcional, no urgente.
    //
    // Problema estructural (latente): los eventos de creación de todas las rondas
    // se encolan de golpe en SingleElimination.createChildren() con fechas FIJAS
    // (roundHalfWeeksSchedule). Los partidos, en cambio, son JDurativeEvent cuya
    // duración EMERGE de la simulación. Si una duración se disparara (p. ej. por un
    // deporte mal acotado en el futuro), este evento de sorteo podría ejecutarse
    // ANTES de que la última serie de la ronda previa haya terminado, y
    // getLastRoundWinners() -> round.winners -> serie.winner lanzaría
    // "La serie todavía no terminó".
    //
    // Guarda propuesta:
    //   const len = this._playoff.rounds.length;
    //   if (len > 0 && !this._playoff.rounds[len - 1].isFinished) {
    //     // reprogramar este mismo evento unos intervalos más adelante
    //     const retryAt = this.calendar.now; retryAt.addInterv(N);
    //     this.calendar.moveEvent(this, retryAt); // o reencolar una copia
    //     return;
    //   }
    //
    // Por qué NO se implementa aquí y queda como propuesta (riesgos con otros eventos):
    //   1. Orden relativo entre sorteos: los sorteos de las rondas N+1, N+2, ...
    //      ya están encolados con sus fechas fijas. Reprogramar solo el de la ronda
    //      actual puede hacer que se cruce o adelante respecto a los siguientes,
    //      rompiendo el invariante "una ronda se sortea después de la anterior".
    //   2. Desfase con eventos que asumen el calendario fijo: Event_StageEnd y la
    //      condición isFinished del stage/playoff, así como el scheduling de partidos
    //      (Event_ScheduleOfRoundMatches usa roundHalfWeeks), asumen que las rondas
    //      caen en las fechas planificadas. Correr el sorteo desincroniza ese supuesto.
    //   3. Riesgo de bucle: si la ronda previa nunca termina (partido "colgado"),
    //      la reprogramación se repetiría indefinidamente. Necesitaría un tope de
    //      reintentos + escalado del error.
    //
    // Solución de fondo (Entrega 2): encadenar la creación de rondas por un evento
    // "fin de ronda" (crear la ronda N+1 recién cuando round N está isFinished), en
    // lugar de fechas fijas calculadas a ciegas. Así la dependencia temporal deja de
    // existir y esta guarda no es necesaria.
    // ---------------------------------------------------------------------------

    const winners = this.getLastRoundWinners();
    const teams: AnyTeam[] = SingleElimination.teamsSortForDraw(winners);

    this._playoff.createNewRound(teams, this.calendar/*, this.dateTime*/)
  }

  // si no hay ronda previa, se deben emparejar los teams participantes
  private getLastRoundWinners(): AnyTeam[] {
    const len = this._playoff.rounds.length;
    if (len == 0) {
      return this._playoff.teamsArr
    }
    return this._playoff.rounds[len - 1].winners;
  }
}