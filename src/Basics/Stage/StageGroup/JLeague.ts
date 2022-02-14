// import * as utlts from 'jl-utlts';
// const CUF = utlts.CollectionsUtilsFunctions.getInstance();

import JTeam from '../../JTeam';
import JMatch, { TypeMatchState } from '../../Match/JMatch';
import { TypeHalfWeekOfYear } from '../../../Calendar/DateTime/types';
import { JFech } from './Fech/JFech';
import JCalendar from '../../../Calendar/JCalendar';
import { JRankCalculator } from '../../Rank/JRank';
import { arr2 } from '../../types';
import { IJTeamTableItem } from '../../Rank/JTeamTableItem';
import robinRoundSchedulingFunction from '../Scheduling/RoundRobin';
import JBase, { IJBaseConfig } from '../JBase';

export interface IJLeagueConfig extends IJBaseConfig {
  fechHalfWeeks: TypeHalfWeekOfYear[];
  fechHalfWeeksSchedule: TypeHalfWeekOfYear[];
}

export default class JLeague extends JBase {
  private _fechHalfWeeks: TypeHalfWeekOfYear[];
  private _fechHalfWeeksSchedule: TypeHalfWeekOfYear[];

  private _fchs: JFech[] = [];
	private _participants: Map<number, JTeam> = new Map<number, JTeam>();

  constructor(ilc: IJLeagueConfig) {
    super(ilc);
    if (
      ilc.participantsNumber < 2 ||
      ilc.participantsNumber > 20 ||
      !Number.isInteger(ilc.participantsNumber)
    ) {
      throw new Error(`no existe sch para el valor: ${ilc.participantsNumber}`);
    }
    let sch: arr2<number>[][] = JLeague.getDataScheduling(
      ilc.participantsNumber,
      ilc.isNeutral,
      ilc.isIV,
    );
    if (sch.length !== ilc.fechHalfWeeks.length) {
      throw new Error(`cantidad de wks incorrecta
      se esperaban: ${sch.length} y se presentan: ${ilc.fechHalfWeeks.length}`);
    }
    if (
      ilc.fechHalfWeeks.length !== ilc.fechHalfWeeksSchedule.length
    ) {
      throw new Error(`cantidad de wks de assignation incorrecta
      se esperaban: ${ilc.fechHalfWeeks.length} y se presentan: ${ilc.fechHalfWeeksSchedule.length}`);
    }
    this._fechHalfWeeks = ilc.fechHalfWeeks;
    this._fechHalfWeeksSchedule = ilc.fechHalfWeeksSchedule;
  }

  get cantFechs(): number {
    return JLeague.getCantFchs(this.config.participantsNumber, this.config.isNeutral, this.config.isIV);
  }
  // get partsNumber(): number {
  //   return this.config.participantsNumber;
  // }
  get fechs(): JFech[] {
    return this._fchs;
  }
  get teams(): JTeam[] {
		let out: JTeam[] = [];
		this._participants.forEach((team: JTeam) => {
			out.push(team);
		})
    return out;
  }
  get matches(): JMatch[] {
    let out: JMatch[] = [];
    this._fchs.forEach((f: JFech) => {
      f.matches.forEach((m: JMatch) => out.push(m));
    })
    return out;
  }
  get config(): IJLeagueConfig {
    return {
      ...super.config,
      fechHalfWeeks: this._fechHalfWeeks,
      fechHalfWeeksSchedule: this._fechHalfWeeksSchedule
    };
  }

	get table(): IJTeamTableItem[] {
		return JRankCalculator.getTableBase(this, m => m.state === 'finished');
	}

	get tablePartial(): IJTeamTableItem[] {
		return JRankCalculator.getTableBase(this, m => m.state === 'finished' || m.state === 'playing');
	}

  get isFinished(): boolean {
		return this.matches.every((m: JMatch) => m.state === 'finished');
	}

	// getTableFech(fid: number): IJTeamTableItem[] { // cambiar esto
	// 	const maxMatchId: number = fid * Math.floor(this.config.participantsNumber / 2);
	// 	return JRankCalculator.getTableBase(this, m => m.id <= maxMatchId);
	// }

  assign(participants: JTeam[], cal: JCalendar): void {
    if (this.config.participantsNumber !== participants.length) {
      throw new Error(`cantidad de tms incorrecta:
      presentados: ${participants.length} y se esperaban: ${this.config.participantsNumber}`);
    }
    // assign participants and table items
		participants.forEach((team: JTeam, idx: number) => {
			this._participants.set(idx+1, team);
		})
    // create matches
    let sch: arr2<number>[][] = JLeague.getDataScheduling(
      this.config.participantsNumber,
      this.config.isNeutral,
      this.config.isIV
    );
    let mid: number = 1;
    for (let f = 0; f < sch.length; f++) {
      let ms: JMatch[] = [];
      for (let m of sch[f]) {
        const ht: JTeam = participants[m[0] - 1];
        const at: JTeam = participants[m[1] - 1];

        ms.push(new JMatch({
					homeTeam: ht,
					awayTeam: at,
					hw: this.config.fechHalfWeeks[f],
					temp: this.config.season,
          id: `${this.id}-M${mid++}`,
          allowedDraw: true,
          isNeutral: this.config.isNeutral
				}));
      }
      let ff = new JFech({ // en vez de crearla se puede simplemente agregar los matchs y crearla antes en el constructor
        num: f + 1,
        halfweek: this.config.fechHalfWeeks[f],
				halfweekMatchDateAssignation: this.config.fechHalfWeeksSchedule[f],
        matches: ms
			});
      this._fchs.push(ff);
    }
    
    this._fchs.forEach((fech: JFech) => {
      fech.generateMatchOfFechScheduleEvents(cal, this)
    })
  }

  // getFech(field: 'id' | 'halfWeek', fiw: number): JFech | undefined {
  //   return this._fchs.find((f: JFech) => f[field] === fiw);
  // }

  // statics
  static getCantFchs(n: number, isN: boolean, isIV: boolean): number {
    let sch = JLeague.getDataScheduling(n, isN, isIV);
    return sch.length;
  }
  static getCantMatches(n: number, isN: boolean, isIV: boolean): number {
    let sch = JLeague.getDataScheduling(n, isN, isIV);
    return sch.length * sch[0].length;
  }
  static getDataScheduling(n: number, isN: boolean, isIV: boolean): arr2<number>[][] {
    return robinRoundSchedulingFunction(n, isN, isIV );
  }
}
