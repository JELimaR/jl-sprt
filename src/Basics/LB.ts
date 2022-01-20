import * as utlts from 'jl-utlts';
const CUF = utlts.CollectionsUtilsFunctions.getInstance();

import scheduling, { arr2 } from './scheduling';
import JTeam from './JTeam';
import JMatch, {TypeMatchState} from './Match/JMatch';
import { TypeHalfWeekOfYear } from '../Logica/DateTimeClasses/types';
import { JFech } from './Fech/JFech';
import { IJHalfWeekOfYear, JDateTime } from '../Logica/DateTimeClasses/JDateTime';
import JCalendar from '../Logica/JCalendar';

interface ITeamTableItem {
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  ge: number;
  sg: number;
  ps: number;
  team: JTeam;
}

class TeamTableItem {
  private _team: JTeam;
  private _pg: number = 0;
  private _pe: number = 0;
  private _pp: number = 0;

  private _gf: number = 0;
  private _ge: number = 0;

  constructor(t: JTeam) {
    this._team = t;
  }

  get pj(): number {
    return this._pg + this._pe + this._pp;
  }
  get pg(): number {
    return this._pg;
  }
  get pe(): number {
    return this._pe;
  }
  get pp(): number {
    return this._pp;
  }
  get gf(): number {
    return this._gf;
  }
  get ge(): number {
    return this._ge;
  }
  get sg(): number {
    return this._gf - this._ge;
  }
  get ps(): number {
    return 3 * this._pg + this._pe;
  }
	addPg() { this._pg++ }
	addPe() { this._pe++ }
	addPp() { this._pp++ }

	addGf(g: number) { this._gf += g }
	addGe(g: number) { this._ge += g }

  get team(): JTeam {
    return this._team;
  }

  getInterface(): ITeamTableItem {
    return {
      pj: this.pj,
      pg: this.pg,
      pe: this.pe,
      pp: this.pp,
      gf: this.gf,
      ge: this.ge,
      sg: this.sg,
      ps: this.ps,
      team: this.team,
    };
  }
}

export interface ILBConfig {
  partsNumber: number;
  isIV: boolean;
  fechHalfWeeks: TypeHalfWeekOfYear[];
  fechHalfWeeksAssignation: TypeHalfWeekOfYear[];
  temp: number;
}

export default class LB {
  private _config: ILBConfig;

  private _fchs: JFech[] = [];
	private _participants: Map<number, JTeam> = new Map<number, JTeam>();

  constructor(config: ILBConfig) {
    if (
      config.partsNumber < 2 ||
      config.partsNumber > 20 ||
      config.partsNumber % 1 !== 0
    ) {
      throw new Error(`no existe sch para el valor: ${config.partsNumber}`);
    }
    let sch: arr2<number>[][] = LB.getDataScheduling(
      config.partsNumber,
      config.isIV
    );
    if (sch.length !== config.fechHalfWeeks.length) {
      throw new Error(`cantidad de wks incorrecta`);
    }
    if (
      config.fechHalfWeeks.length !== config.fechHalfWeeksAssignation.length
    ) {
      throw new Error(`cantidad de wks de assignation incorrecta`);
    }
    this._config = config;
  }

  get cantFechs(): number {
    return LB.getCantFchs(this._config.partsNumber, this._config.isIV);
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
  get config(): ILBConfig {
    return this._config;
  }

	get table(): ITeamTableItem[] {
		return this.getCalculatedTable(m => m.state === 'finished');
	}

	get tablePartial(): ITeamTableItem[] {
		return this.getCalculatedTable(m => m.state === 'finished' || m.state === 'playing');
	}

	getTableFech(fid: number): ITeamTableItem[] {
		const maxMatchId: number = fid * Math.floor(this.partsNumber / 2);
		return this.getCalculatedTable(m => m.id <= maxMatchId);
	}

  assign(participants: JTeam[], cal: JCalendar): void {
    if (this._config.partsNumber !== participants.length) {
      throw new Error(`cantidad de tms incorrecta`);
    }
    // assign parts and table items
		participants.forEach((team: JTeam, idx: number) => {
			this._participants.set(idx+1, team);
		})
    // create matches
    let sch: arr2<number>[][] = LB.getDataScheduling(
      this._config.partsNumber,
      this._config.isIV
    );
    for (let f = 0; f < sch.length; f++) {
      let ms: JMatch[] = [];
      for (let m of sch[f]) {
        const l: JTeam = participants[m[0] - 1];
        const v: JTeam = participants[m[1] - 1];

        ms.push(new JMatch(l, v, /*this._config.fechHalfWeeks[f]*/));
      }
      let ff = new JFech( // en vez de crearla se puede simplemente agregar los matchs
        f + 1,
        this._config.fechHalfWeeks[f],
        CUF.shuffled(ms)
      );
      this._fchs.push(ff);
    }
    
    this._fchs.forEach((fech: JFech) => {
      fech.generateMatchesAssignations(cal, this)
    })
  }

  // getFech(field: 'id' | 'halfWeek', fiw: number): JFech | undefined {
  //   return this._fchs.find((f: JFech) => f[field] === fiw);
  // }

	getCalculatedTable(condition: (m: JMatch) => boolean): ITeamTableItem[] {
		let teamsTTI: TeamTableItem[] = []; // pasar a map
		this._participants.forEach((team: JTeam) => {
			teamsTTI.push(new TeamTableItem(team));
		})
		this._fchs.forEach((f: JFech) => {
			f.matches.forEach((m: JMatch) => {
				if (condition(m)) {
					let ltti: TeamTableItem | undefined = teamsTTI.find(t => t.team.id === m.lcl.id);
					let vtti: TeamTableItem | undefined = teamsTTI.find(t => t.team.id === m.vst.id);
					if (!ltti || !vtti) throw new Error(`non finded`);

					// gls L
					ltti.addGf(m.result.lclGls);
					ltti.addGe(m.result.vstGls);

					// gls V
					vtti.addGf(m.result.vstGls);
					vtti.addGe(m.result.lclGls);

					// add pj
					if (m.result.winner === 'L') {
						ltti.addPg();
						vtti.addPp();
					} else if (m.result.winner === 'V') {
						ltti.addPp();
						vtti.addPg();
					} else {
						ltti.addPe();
						vtti.addPe();
					}
				}
			})
		})
		teamsTTI.sort((a: TeamTableItem, b: TeamTableItem) => {
			if (a.ps - b.ps !== 0) {
				return b.ps - a.ps
			}
			if (a.sg - b.sg !== 0) {
				return b.sg - a.sg
			}
			return b.gf - a.gf
			
		})
		return teamsTTI.map((tti: TeamTableItem) => tti.getInterface());
	}

  // statics
  static getCantFchs(n: number, isIV: boolean): number {
    let sch = LB.getDataScheduling(n, isIV);
    return sch.length;
  }
  static getCantMatches(n: number, isIV: boolean): number {
    let sch = LB.getDataScheduling(n, isIV);
    return sch.length * sch[0].length;
  }
  static getDataScheduling(n: number, isIV: boolean): arr2<number>[][] {
    return scheduling(n, isIV);
  }
}
