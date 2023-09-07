// import * as utlts from 'jl-utlts';
// const CUF = utlts.CollectionsUtilsFunctions.getInstance();

import { TypeHalfWeekOfYear } from "../../../Calendar/DateTime/types";
import JCalendar from "../../../Calendar/JCalendar";
import JMatch from "../../Match/JMatch";
import { JRankCalculator } from "../../Rank/JRank";
import { ITeamTableItem } from "../../Rank/TeamTableItem";
import Team from "../../Team";
import { arr2 } from "../../types";
import StageBase, { IStageBaseConfig, IStageBaseInfo } from "../StageBase";
import robinRoundSchedulingFunction from "../Scheduling/RoundRobin";
import { Turn } from "./Turn/Turn";

export interface ILeagueConfig extends IStageBaseConfig {
  turnHalfWeeks: TypeHalfWeekOfYear[];
  turnHalfWeeksSchedule: TypeHalfWeekOfYear[];
}

export interface ILeagueInfo extends IStageBaseInfo {  }

export default class League extends StageBase<ILeagueInfo, ILeagueConfig> {

  private _turn: Turn[] = [];
	private _participants: Map<number, Team> = new Map<number, Team>();

  /**
   * Creacion de una League. Se asigna la config y la info
   * Quedan desconocidos los participants y por tanto no se crean los turns
   *        -> ESTOS SE CREAN EN LA ASIGNACION -> función assign()
   * 
   * Se realizan las siguientes verificaciones
   * * existe sch para la cantidad de participants
   * * la cantidad de halfweeks asignada para cada turn coincide con la cantidad de turns que corresponde
   * * la cantidad de halfweeks asignada para la programacion de cada turn coincide con la cantidad de turns que corresponde
   */
  constructor(info: ILeagueInfo, config: ILeagueConfig) { // FALTA VERIFICAR QUE CADA fechHalfWeeks sea mayor al fechHalfWeeksSchedule
    super(info, config);
    if (
      config.participantsNumber < 2 ||
      config.participantsNumber > 20 ||
      !Number.isInteger(config.participantsNumber)
    ) {
      throw new Error(`no existe sch para el valor: ${config.participantsNumber}`);
    }
    let sch: arr2<number>[][] = League.getDataScheduling(
      config.participantsNumber,
      config.isNeutral,
      config.isIV,
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
    this.config.turnHalfWeeks = config.turnHalfWeeks;
    this.config.turnHalfWeeksSchedule = config.turnHalfWeeksSchedule;
  }

  get turnsNumber(): number {
    return League.getTurnsNumber(this.config.participantsNumber, this.config.isNeutral, this.config.isIV);
  }

  get turns(): Turn[] {
    return this._turn;
  }
  
  get teams(): Team[] {
		let out: Team[] = [];
		this._participants.forEach((team: Team) => {
			out.push(team);
		})
    return out;
  }
  get matches(): JMatch[] {
    let out: JMatch[] = [];
    this._turn.forEach((f: Turn) => {
      f.matches.forEach((m: JMatch) => out.push(m));
    })
    return out;
  }

	get table(): ITeamTableItem[] {
		return JRankCalculator.getTableBase(this, m => m.state === 'finished');
	}

	get tablePartial(): ITeamTableItem[] {
		return JRankCalculator.getTableBase(this, m => m.state === 'finished' || m.state === 'playing');
	}

	// getTableFech(fid: number): IJTeamTableItem[] { // cambiar esto
	// 	const maxMatchId: number = fid * Math.floor(this.config.participantsNumber / 2);
	// 	return JRankCalculator.getTableBase(this, m => m.id <= maxMatchId);
	// }

  assign(participants: Team[], cal: JCalendar): void {
    if (this.config.participantsNumber !== participants.length) {
      throw new Error(`cantidad de tms incorrecta:
      presentados: ${participants.length} y se esperaban: ${this.config.participantsNumber}`);
    }
    // assign participants and table items
		participants.forEach((team: Team, idx: number) => {
			this._participants.set(idx+1, team);
		})
    // create matches
    let sch: arr2<number>[][] = League.getDataScheduling(
      this.config.participantsNumber,
      this.config.isNeutral,
      this.config.isIV
    );
    let mid: number = 1;
    for (let f = 0; f < sch.length; f++) {
      let ms: JMatch[] = [];
      for (let m of sch[f]) {
        const ht: Team = participants[m[0] - 1];
        const at: Team = participants[m[1] - 1];

        ms.push(new JMatch({
					homeTeam: ht,
					awayTeam: at,
					hw: this.config.turnHalfWeeks[f],
					temp: this.info.season,
          id: `${this.info.id}-M${mid++}`,
          allowedDraw: true,
          isNeutral: this.config.isNeutral
				}));
      }
      let ff = new Turn({ // en vez de crearla se puede simplemente agregar los matchs y crearla antes en el constructor
        num: f + 1,
        halfweek: this.config.turnHalfWeeks[f],
				halfweekMatchDateAssignation: this.config.turnHalfWeeksSchedule[f],
        matches: ms
			});
      this._turn.push(ff);
    }
    
    this._turn.forEach((turn: Turn) => {
      turn.generateMatchOfTurnScheduleEvents(cal, this)
    })
  }

  // statics
  static getTurnsNumber(n: number, isN: boolean, isIV: boolean): number {
    let sch = League.getDataScheduling(n, isN, isIV);
    return sch.length;
  }
  static getCantMatches(n: number, isN: boolean, isIV: boolean): number {
    let sch = League.getDataScheduling(n, isN, isIV);
    return sch.length * sch[0].length;
  }
  static getDataScheduling(n: number, isN: boolean, isIV: boolean): arr2<number>[][] {
    return robinRoundSchedulingFunction(n, isN, isIV );
  }
}
