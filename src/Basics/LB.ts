import * as utlts from 'jl-utlts';
const CUF = utlts.CollectionsUtilsFunctions.getInstance();

import * as data from '../data';
import Team from './Team';
import JMatch from './JMatch';
import { TypeHalfWeekOfYear } from '../Logica/Calendar/types';


export class JFech {
	private _id: number;
	private _matches: JMatch[] = [];
	private _hw: TypeHalfWeekOfYear;

	constructor(id: number, hw: TypeHalfWeekOfYear, ms: JMatch[]) {
		this._id = id;
		this._hw = hw;
		this._matches = ms; 
	}

	get id(): number { return this._id }
	get halfWeek(): TypeHalfWeekOfYear { return this._hw }
	get matches(): JMatch[] { return this._matches }
}

interface ITeamTableItem {
	pj: number;
	pg: number;
	pe: number;
	pp: number;
	gf: number;
	ge: number;
	sg: number;
	ps: number;
	team: Team;
}

class TeamTableItem implements ITeamTableItem {
	private _team: Team;
	private _pg: number = 0;
	private _pe: number = 0;
	private _pp: number = 0;

	private _gf: number = 0;
	private _ge: number = 0;

	constructor(t: Team) {
		this._team = t;
	}

	get pj(): number {return this._pg+this._pe+this._pp} 
	get pg(): number {return this._pg}
	get pe(): number {return this._pe}
	get pp(): number {return this._pp}
	get gf(): number {return this._gf}
	get ge(): number {return this._ge}
	get sg(): number {return this._gf - this._ge}
	get ps(): number {return 3*this._pg+this._pe}

	get team(): Team {return this._team}

	get ITeamTableItem(): ITeamTableItem {
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
		}
	}
	
}

export interface ILBConfig {
	partsNumber: number;
	isIV: boolean;
	hws: TypeHalfWeekOfYear[];
}

export default class LB {

	private _config: ILBConfig;
	
	private _tms: ITeamTableItem[] = [];
	private _fchs: JFech[] = [];

	constructor({partsNumber, isIV, hws}: ILBConfig) {
		if (partsNumber < 2 || partsNumber > 20 || partsNumber % 1 !== 0) {
			throw new Error(`no existe sch para el valor: ${partsNumber}`)
		}
		let sch = LB.getDataScheduling(partsNumber, isIV);
		if (sch.length !== hws.length) {
			throw new Error(`cantidad de wks incorrecta`);
		}
		this._config = {
			partsNumber,
			isIV,
			hws,
		}
	}

	static getCantFchs(n: number, isIV: boolean): number {
		let sch = LB.getDataScheduling(n, isIV);
		return sch.length;
	}
	static getCantMatches(n: number, isIV: boolean): number {
		let sch = LB.getDataScheduling(n, isIV);
		return sch.length*sch[0].length;
	}
	static getDataScheduling(n: number, isIV: boolean): data.arr2<number>[][] {
		return data.scheduling(n, isIV);
	}

	get cantFechs(): number {
		return LB.getCantFchs(this._config.partsNumber, this._config.isIV);
	}
	get partsNumber(): number { return this._config.partsNumber }
	get fechs(): JFech[] { return this._fchs}

	assign(parts: Team[]): void {
		if (this._config.partsNumber !== parts.length) {
			throw new Error(`cantidad de tms incorrecta`);
		}
		// assign parts and table items
		for (let i=0;i<this._config.partsNumber;i++) {
			this._tms.push( new TeamTableItem( parts[i] ) );
		}
		// create matches
		let sch: data.arr2<number>[][] = LB.getDataScheduling(this._config.partsNumber, this._config.isIV);
		for (let f=0; f<sch.length; f++) {
			
			let ms: JMatch[] = [];
			for (let m of sch[f]) {
				const l: Team = parts[m[0]-1];
				const v: Team = parts[m[1]-1];

				ms.push( new JMatch(l,v, this._config.hws[f]) );
			}
			let ff = new JFech(f+1, this._config.hws[f], CUF.shuffled(ms));
			this._fchs.push(ff);
		}
	}

	getFech(field: 'id' | 'halfWeek', fiw: number): JFech | undefined {
		return this._fchs.find( (f: JFech) => f[field] === fiw );
	}
	
}