import * as utlts from 'jl-utlts';
const CUF = utlts.CollectionsUtilsFunctions.getInstance();

import scheduling from './scheduling';
import JTeam from './JTeam';
import JMatch, { TypeMatchState } from './Match/JMatch';
import { TypeHalfWeekOfYear } from '../Calendar/DateTime/types';
import { JFech } from './Fech/JFech';
import JCalendar from '../Calendar/JCalendar';
import { JRankCalculator } from './Rank/JRank';
import { arr2 } from './types';
import { ITeamTableItem } from './Rank/JTeamTableItem';

export interface IJLeagueConfig {
  partsNumber: number;
  isIV: boolean;
  fechHalfWeeks: TypeHalfWeekOfYear[];
  fechHalfWeeksSchedule: TypeHalfWeekOfYear[];
  temp: number;
}

export default class JLeague {
  private _config: IJLeagueConfig;

  private _fchs: JFech[] = [];
	private _participants: Map<number, JTeam> = new Map<number, JTeam>();

  constructor(ilc: IJLeagueConfig) {
    if (
      ilc.partsNumber < 2 ||
      ilc.partsNumber > 20 ||
      !Number.isInteger(ilc.partsNumber)
    ) {
      throw new Error(`no existe sch para el valor: ${ilc.partsNumber}`);
    }
    let sch: arr2<number>[][] = JLeague.getDataScheduling(
      ilc.partsNumber,
      ilc.isIV
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
    this._config = ilc;
  }

  get cantFechs(): number {
    return JLeague.getCantFchs(this._config.partsNumber, this._config.isIV);
  }
  get partsNumber(): number {
    return this._config.partsNumber;
  }
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
    return this._config;
  }

	get table(): ITeamTableItem[] {
		return JRankCalculator.getTableBase(this, m => m.state === 'finished');
	}

	get tablePartial(): ITeamTableItem[] {
		return JRankCalculator.getTableBase(this, m => m.state === 'finished' || m.state === 'playing');
	}

  get isFinished(): boolean {
		return this.matches.every((m: JMatch) => m.state === 'finished');
	}

	getTableFech(fid: number): ITeamTableItem[] {
		const maxMatchId: number = fid * Math.floor(this.partsNumber / 2);
		return JRankCalculator.getTableBase(this, m => m.id <= maxMatchId);
	}

  assign(participants: JTeam[], cal: JCalendar): void {
    if (this._config.partsNumber !== participants.length) {
      throw new Error(`cantidad de tms incorrecta:
      presentados: ${participants.length} y se esperaban: ${this._config.partsNumber}`);
    }
    // assign participants and table items
		participants.forEach((team: JTeam, idx: number) => {
			this._participants.set(idx+1, team);
		})
    // create matches
    let sch: arr2<number>[][] = JLeague.getDataScheduling(
      this._config.partsNumber,
      this._config.isIV
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
					hw: this._config.fechHalfWeeks[f],
					//config: this._config
					temp: this._config.temp,
          id: mid++,
          allowedDraw: true,
				}));
      }
      let ff = new JFech({ // en vez de crearla se puede simplemente agregar los matchs y crearla antes en el constructor
        num: f + 1,
        halfweek: this._config.fechHalfWeeks[f],
				halfweekMatchDateAssignation: this._config.fechHalfWeeksSchedule[f],
        matches: CUF.shuffled(ms)
			});
      this._fchs.push(ff);
    }
    
    this._fchs.forEach((fech: JFech) => {
      fech.generateMatchesSchedules(cal, this)
    })
  }

  // getFech(field: 'id' | 'halfWeek', fiw: number): JFech | undefined {
  //   return this._fchs.find((f: JFech) => f[field] === fiw);
  // }

  // statics
  static getCantFchs(n: number, isIV: boolean): number {
    let sch = JLeague.getDataScheduling(n, isIV);
    return sch.length;
  }
  static getCantMatches(n: number, isIV: boolean): number {
    let sch = JLeague.getDataScheduling(n, isIV);
    return sch.length * sch[0].length;
  }
  static getDataScheduling(n: number, isIV: boolean): arr2<number>[][] {
    return scheduling(n, isIV);
  }
}
