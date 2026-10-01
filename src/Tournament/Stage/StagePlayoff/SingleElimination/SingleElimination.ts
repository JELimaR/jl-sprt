import { BaseStage } from '../../BaseStage';
import { JCalendar, JDateTime } from "jl-calendar";
import { Round } from './Round';
import { Event_RoundCreationAndTeamsDraw } from './Event_RoundCreationAndTeamsDraw';
import { IElementInfo, ISingleEliminationConfig } from '../../../../JSportModule';
import { AnyTeam } from 'jl-sprt-core';
import { AnyTeamTableItem } from 'jl-sprt-core';
import { AnySportProfile } from 'jl-sprt-core';
import { A_Serie } from 'jl-sprt-core';
import { TypeTableMatchState } from '../../../../JSportModule/';
import { AnyMatch } from 'jl-sprt-core';
import { FixtureParticipantRef, IFixtureSlot } from '../../Fixture';

export class SingleElimination extends BaseStage<IElementInfo, ISingleEliminationConfig> { // Single elimination

  private _rounds: Round[] = [];

  constructor(info: IElementInfo, config: ISingleEliminationConfig, sportProfile: AnySportProfile) { // FALTA VERIFICAR QUE CADA fechHalfWeeks sea mayor al fechHalfWeeksSchedule
    super(info, config, sportProfile);
  }

  constructorVerification(config: ISingleEliminationConfig): void {
    if (SingleElimination.maxNumberRound(config.participantsNumber) < config.roundsNumber) {
      throw new Error(`la cantidad de rounds: ${config.roundsNumber} es
      mayor a la cantidad posible de rounds: ${SingleElimination.maxNumberRound(config.participantsNumber)} para la cantidad de
      participants: ${config.participantsNumber}`)
    }

  }

  get isFinished(): boolean {
    return super.isFinished && this._rounds.length == this.config.roundsNumber
  }

  get rounds(): Round[] { return this._rounds }
  get matches(): AnyMatch[] {
    let out: AnyMatch[] = [];
    this._rounds.forEach((r: Round) => {
      r.matches.forEach((m) => out.push(m));
    })
    return out;
  }

  /**
   * Para crear los rounds.
   * Se agregan al calendario eventos para la creacion y "asignacion" de teams de todas las rounds.
   * @param cal JCalendar
   */
  createChildren(cal: JCalendar): void {

    for (let i = 0; i < this.config.roundsNumber; i++) {
      let dt = JDateTime.createFromHalfWeekOfYearAndYear(
        this.config.roundHalfWeeksSchedule[i],
        this.info.season, 'start')
      if (cal.now.absolute >= dt.absolute) {
        dt = cal.now;
        dt.addInterv(1);
        if (cal.now.absolute - dt.absolute > 50) {
          throw new Error(`stop
          En Round.generateMatchOfRoundScheduleEvents`)
        }
      }
      cal.addEvent(new Event_RoundCreationAndTeamsDraw({ // crear los eventos de draw y round creation
        dateTime: dt.getCreator(),
        calendar: cal,
        playoff: this,
      }))
    }
  }

  createNewRound(teamsDrawSorted: AnyTeam[], calendar: JCalendar) {
    const roundNumber: number = this._rounds.length + 1;
    const roundIndex: number = this._rounds.length;
    const round: Round = new Round({
      num: roundNumber,
      series: this.createRoundSeries(teamsDrawSorted!),
      halfweeks: this.config.roundHalfWeeks[roundIndex],
      halfweekSchedule: this.config.roundHalfWeeksSchedule[roundIndex],
    })

    round.generateMatchOfRoundScheduleEvents(calendar, this);
    this._rounds.push(round);
  }

  createRoundSeries(teams: AnyTeam[]): A_Serie<any, any>[] {
    let out: A_Serie<any, any>[] = [];

    const total: number = this.matches.length / ((this.config.opt == 'h&a') ? 2 : 1);
    for (let i = 0; i < teams.length; i += 2) {
      out.push(
        this._sportProfile.createSerie({
          teamOne: teams[i + 0],
          teamTwo: teams[i + 1],
          id: `${this.info.id}-S${total + i / 2 + 1}`,
          season: this.info.season,
          hws: this.config.roundHalfWeeks[this._rounds.length],
          opt: this.config.opt,
        })
      )
    }

    return out;
  }

  getTable(ttms: TypeTableMatchState): AnyTeamTableItem[] {
    let out = this.calcTableValues(ttms);

    this.rounds.forEach((r: Round, idx: number) => {
      r.losers.forEach((loser: AnyTeam) => {
        let item = out.find((value) => value.team.id === loser.id)
        if (item) item.pos = this.rounds.length + 1 - idx;
      })
    });

    if (out.length > 0) {
      const sortFunc = out[0].getSortFunc();
      out.sort((a, b) => sortFunc(a, b, true));
    }

    return out;
  }

  /**
   * Fixture estructural del bracket de eliminación simple.
   *
   * El bracket es determinístico en estructura desde el create:
   *  - Ronda 1: `participantsNumber/2` series; serie `s` empareja seed `s` vs seed
   *    `participantsNumber+1-s` (los equipos reales dependen del draw, por eso van
   *    como `seed` hasta materializarse).
   *  - Rondas N>1: cada serie enfrenta a los GANADORES de dos series de la ronda
   *    previa (referencia simbólica `winnerOf`), hasta que esa ronda se juega.
   *
   * Cada serie produce 1 slot (opt 'home'/'neutral') o 2 slots (opt 'h&a', ida y
   * vuelta). Si la ronda ya está materializada, cada slot toma el Match real
   * (equipos + id); si no, queda como `seed`/`winnerOf`.
   *
   * El `slotId` sigue el esquema `<stageId>-R<ronda>-S<serieGlobal>-M<idx>`.
   */
  getFixture(): IFixtureSlot[] {
    const out: IFixtureSlot[] = [];
    const matchesPerSerie = this.config.opt === 'h&a' ? 2 : 1;

    let seriesInRound = this.config.participantsNumber / 2;
    let globalSerieCount = 0;

    for (let roundIndex = 0; roundIndex < this.config.roundsNumber; roundIndex++) {
      const roundNumber = roundIndex + 1;
      const halfWeek = this.config.roundHalfWeeks[roundIndex]?.[0];
      const existingRound = this._rounds[roundIndex];

      for (let s = 0; s < seriesInRound; s++) {
        globalSerieCount++;
        const serieNumber = s + 1;

        // Participantes estructurales de la serie.
        let home: FixtureParticipantRef;
        let away: FixtureParticipantRef;
        if (roundIndex === 0) {
          // Ronda 1: emparejamiento por seed (posición de ranking).
          home = { kind: 'seed', pos: serieNumber };
          away = { kind: 'seed', pos: this.config.participantsNumber + 1 - serieNumber };
        } else {
          // Ronda N>1: ganadores de dos series de la ronda previa.
          home = { kind: 'winnerOf', slotId: this.serieSlotId(roundNumber - 1, 2 * serieNumber - 1) };
          away = { kind: 'winnerOf', slotId: this.serieSlotId(roundNumber - 1, 2 * serieNumber) };
        }

        // Serie materializada: usar equipos reales.
        const serie = existingRound?.series[s];
        if (serie) {
          home = { kind: 'team', teamId: serie.teamOne.id };
          away = { kind: 'team', teamId: serie.teamTwo.id };
        }

        for (let k = 0; k < matchesPerSerie; k++) {
          const slotId = `${this.serieSlotId(roundNumber, serieNumber)}-M${k + 1}`;
          const matchId = serie?.matches[k]?.id;
          out.push({
            slotId,
            stageId: this.info.id,
            turn: roundNumber,
            halfWeek,
            // En la vuelta de un h&a se invierte la localía.
            home: k === 1 ? away : home,
            away: k === 1 ? home : away,
            matchId,
          });
        }
      }

      seriesInRound = Math.floor(seriesInRound / 2);
    }

    return out;
  }

  /** Id estable de una serie dentro del bracket (ronda + serie, 1-based). */
  private serieSlotId(roundNumber: number, serieNumber: number): string {
    return `${this.info.id}-R${roundNumber}-S${serieNumber}`;
  }

  /************************************************************************************************************************************************************* */
  // statics 
  static maxNumberRound(partsNumber: number): number {
    let out: number = 0;
    while ((partsNumber % 2) === 0) {
      out++;
      partsNumber /= 2;
    }
    return out;
  }

  static winnersInMaxNumberRound(partsNumber: number): number {
    while ((partsNumber % 2) === 0) {
      partsNumber /= 2;
    }
    return partsNumber;
  }

  //
  static teamsSortForDraw(teamRankArr: AnyTeam[]): AnyTeam[] {
    let out: AnyTeam[] = [];
    const total = teamRankArr.length;
    if (total % 2 !== 0)
      throw new Error(`En un playoff (single elimination), debe ser par la cantidad de teams. (En SingleElimination.teamsSortForDraw)`)
    for (let i = 0; i < total / 2; i++) {
      out.push(
        teamRankArr[total - i - 1], teamRankArr[i]
      )

    }
    return out;
  }
}