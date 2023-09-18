// import * as utlts from 'jl-utlts';
// const CUF = utlts.CollectionsUtilsFunctions.getInstance();

import { TypeHalfWeekOfYear } from "../../../Calendar/DateTime/types";
import JCalendar from "../../../Calendar/JCalendar";
import JMatch from "../../Match/JMatch";
import Team from "../../Team";
import { arr2 } from "../../types";
import BaseStage, { IBaseStageConfig, IBaseStageInfo, TypeBaseStageOption } from "../BaseStage";
import robinRoundSchedulingFunction from "../Scheduling/RoundRobin";
import { Turn } from "./Turn/Turn";

export interface ILeagueConfig extends IBaseStageConfig {
  turnHalfWeeks: TypeHalfWeekOfYear[];
  turnHalfWeeksSchedule: TypeHalfWeekOfYear[];
}

export interface ILeagueInfo extends IBaseStageInfo { }

export default class League extends BaseStage<ILeagueInfo, ILeagueConfig> {

  private _turns: Turn[] = [];

  /**
   * Creacion de una League. Se asigna la config y la info
   * Quedan desconocidos los participants y por tanto no se crean los turns
   *        -> ESTOS SE CREAN EN LA ASIGNACION -> función assign()
   */
  constructor(info: ILeagueInfo, config: ILeagueConfig) { // FALTA VERIFICAR QUE CADA fechHalfWeeks sea mayor al fechHalfWeeksSchedule
    super(info, config);
    this.config.turnHalfWeeks = config.turnHalfWeeks;
    this.config.turnHalfWeeksSchedule = config.turnHalfWeeksSchedule;
  }

  /**
   * Se realizan las siguientes verificaciones
   * * existe sch para la cantidad de participants
   * * la cantidad de halfweeks asignada para cada turn coincide con la cantidad de turns que corresponde
   * * la cantidad de halfweeks asignada para la programacion de cada turn coincide con la cantidad de turns que corresponde
   */
  constructorVerification(config: ILeagueConfig): void {
    if (
      config.participantsNumber < 2 ||
      config.participantsNumber > 20 ||
      !Number.isInteger(config.participantsNumber)
    ) {
      throw new Error(`no existe sch para el valor: ${config.participantsNumber}`);
    }
    let sch: arr2<number>[][] = League.getDataScheduling(
      config.participantsNumber,
      config.opt,
    );
    if (sch.length !== config.turnHalfWeeks.length) {
      throw new Error(`cantidad de wks incorrecta
      se esperaban: ${sch.length} y se presentan: ${config.turnHalfWeeks.length}`);
    }
    if (
      config.turnHalfWeeks.length !== config.turnHalfWeeksSchedule.length
    ) {
      throw new Error(`cantidad de wks de assignation incorrecta
      se esperaban: ${config.turnHalfWeeks.length} y se presentan: ${config.turnHalfWeeksSchedule.length}`);
    }

  }

  get turnsNumber(): number {
    return League.getTurnsNumber(this.config.participantsNumber, this.config.opt);
  }

  get turns(): Turn[] {
    return this._turns;
  }

  get matches(): JMatch[] {
    let out: JMatch[] = [];
    this._turns.forEach((f: Turn) => {
      f.matches.forEach((m: JMatch) => out.push(m));
    })
    return out;
  }

  // assign(participants: Team[], cal: JCalendar): void {
  //   super.assign(participants, cal);
  //   // create matches
  //   let sch: arr2<number>[][] = League.getDataScheduling(
  //     this.config.participantsNumber,
  //     this.config.isNeutral,
  //     this.config.isIV
  //   );
  //   let mid: number = 1;
  //   for (let f = 0; f < sch.length; f++) {
  //     let ms: JMatch[] = [];
  //     for (let m of sch[f]) {
  //       const ht: Team = participants[m[0] - 1];
  //       const at: Team = participants[m[1] - 1];

  //       ms.push(new JMatch({
  // 				homeTeam: ht,
  // 				awayTeam: at,
  // 				hw: this.config.turnHalfWeeks[f],
  // 				temp: this.info.season,
  //         id: `${this.info.id}-M${mid++}`,
  //         allowedDraw: true,
  //         isNeutral: this.config.isNeutral
  // 			}));
  //     }
  //     let ff = new Turn({ // en vez de crearla se puede simplemente agregar los matchs y crearla antes en el constructor
  //       num: f + 1,
  //       halfweek: this.config.turnHalfWeeks[f],
  // 			halfweekMatchDateAssignation: this.config.turnHalfWeeksSchedule[f],
  //       matches: ms
  // 		});
  //     this._turn.push(ff);
  //   }

  //   this._turn.forEach((turn: Turn) => {
  //     turn.generateMatchOfTurnScheduleEvents(cal, this)
  //   })
  // }

  /**
   * Para crear los turns
   * @param cal 
   */
  createChildren(cal: JCalendar): void {
    // create matches
    const participants = this.teamsArr;
    let sch: arr2<number>[][] = League.getDataScheduling(
      this.config.participantsNumber,
      this.config.opt
    );
    // let mid: number = 1;

    for (let t = 0; t < sch.length; t++) {
      let teams: Team[] = [];
      for (let m of sch[t]) {
        // const ht: Team = participants[m[0] - 1];
        // const at: Team = participants[m[1] - 1];
        const ht: Team = this.participants.get(m[0])!;
        const at: Team = this.participants.get(m[1])!;
        teams.push(ht);
        teams.push(at);
      }

      this.createNewTurn(teams, cal);

      //   let matches: JMatch[] = [];
      //   for (let m of sch[t]) {
      //     const ht: Team = participants[m[0] - 1];
      //     const at: Team = participants[m[1] - 1];

      //     matches.push(new JMatch({
      //       homeTeam: ht,
      //       awayTeam: at,
      //       hw: this.config.turnHalfWeeks[t],
      //       temp: this.info.season,
      //       id: `${this.info.id}-T${t + 1}-M${mid++}`,
      //       allowedDraw: true,
      //       isNeutral: this.config.isNeutral
      //     }));
      //   }
      //   let turn = new Turn({ // en vez de crearla se puede simplemente agregar los matchs y crearla antes en el constructor
      //     num: t + 1,
      //     halfweek: this.config.turnHalfWeeks[t],
      //     halfweekSchedule: this.config.turnHalfWeeksSchedule[t],
      //     matches: matches
      //   });
      //   this._turns.push(turn);

    }

    // this._turns.forEach((turn: Turn) => {
    //   turn.generateMatchOfTurnScheduleEvents(cal, this)
    // })
  }

  createNewTurn(teamsDrawSorted: Team[], calendar: JCalendar/*, dt: JDateTime*/) {
    const turnNumber: number = this._turns.length + 1;
    const turnIndex: number = this._turns.length;
    const turn: Turn = new Turn({
      num: this._turns.length + 1,
      matches: this.createTurnMatches(teamsDrawSorted, turnNumber),
      halfweek: this.config.turnHalfWeeks[turnIndex],
      halfweekSchedule: this.config.turnHalfWeeksSchedule[turnIndex],
    })

    turn.generateMatchOfTurnScheduleEvents(calendar, this);
    this._turns.push(turn);
  }

  createTurnMatches(teams: Team[], turnNumber: number): JMatch[] {
    let out: JMatch[] = [];

    const total: number = this.matches.length;
    for (let i = 0; i < teams.length; i += 2) {

      const match = new JMatch({
        awayTeam: teams[i],
        homeTeam: teams[i + 1],
        hw: this.config.turnHalfWeeks[turnNumber - 1],
        temp: this.info.season,
        id: `${this.info.id}-T${turnNumber}-M${total + i / 2 + 1}`,
        allowedDraw: true,
        isNeutral: this.config.opt == 'neutral'
      })

      out.push(match);
    }

    return out;
  }

  /************************************************************************************************************************************************************* */
  // statics
  static getTurnsNumber(n: number, opt: TypeBaseStageOption): number {
    let sch = League.getDataScheduling(n, opt);
    return sch.length;
  }
  static getCantMatches(n: number, opt: TypeBaseStageOption): number {
    let sch = League.getDataScheduling(n, opt);
    return sch.length * sch[0].length;
  }
  static getDataScheduling(n: number, opt: TypeBaseStageOption): arr2<number>[][] {
    return robinRoundSchedulingFunction(n, opt);
  }
}
