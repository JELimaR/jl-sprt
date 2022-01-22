import * as utlts from 'jl-utlts';
const CUF = utlts.CollectionsUtilsFunctions.getInstance();

import scheduling, { arr2 } from './scheduling';
import JTeam from './JTeam';
import JMatch, { TypeMatchState } from './Match/JMatch';
import { TypeHalfWeekOfYear } from '../Calendar/DateTime/types';
import { JFech } from './Fech/JFech';
import { IJHalfWeekOfYear, JDateTime } from '../Calendar/DateTime/JDateTime';
import JCalendar from '../Calendar/JCalendar';

interface ITeamTableItem {
	pos: number;
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
			pos: 1,
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

  constructor(config: IJLeagueConfig) {
    if (
      config.partsNumber < 2 ||
      config.partsNumber > 20 ||
      !Number.isInteger(config.partsNumber)
    ) {
      throw new Error(`no existe sch para el valor: ${config.partsNumber}`);
    }
    let sch: arr2<number>[][] = JLeague.getDataScheduling(
      config.partsNumber,
      config.isIV
    );
    if (sch.length !== config.fechHalfWeeks.length) {
      throw new Error(`cantidad de wks incorrecta`);
    }
    if (
      config.fechHalfWeeks.length !== config.fechHalfWeeksSchedule.length
    ) {
      throw new Error(`cantidad de wks de assignation incorrecta`);
    }
    this._config = config;
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
  get config(): IJLeagueConfig {
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
    // assign participants and table items
		participants.forEach((team: JTeam, idx: number) => {
			this._participants.set(idx+1, team);
		})
    // create matches
    let sch: arr2<number>[][] = JLeague.getDataScheduling(
      this._config.partsNumber,
      this._config.isIV
    );
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
					temp: this._config.temp
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
					let htti: TeamTableItem | undefined = teamsTTI.find(t => t.team.id === m.homeTeam.id);
					let atti: TeamTableItem | undefined = teamsTTI.find(t => t.team.id === m.awayTeam.id);
					if (!htti || !atti) throw new Error(`non finded`);

					// gls HT
					htti.addGf(m.result.homeScore);
					htti.addGe(m.result.awayScore);

					// gls AT
					atti.addGf(m.result.awayScore);
					atti.addGe(m.result.homeScore);

					// add pj
					if (m.result.winner === 'L') {
						htti.addPg();
						atti.addPp();
					} else if (m.result.winner === 'V') {
						htti.addPp();
						atti.addPg();
					} else {
						htti.addPe();
						atti.addPe();
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
		return teamsTTI.map((tti: TeamTableItem, idx: number) => {
			return {...tti.getInterface(), pos: idx+1}
		});
	}

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
