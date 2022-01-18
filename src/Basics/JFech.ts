import { TypeHalfWeekOfYear } from "../Logica/Calendar/types";
import JMatch, {IJMatch} from "./JMatch";

type TypeFechState = 
	| 'init'


interface IJFech {
	id: number;
	state: TypeFechState;
	matchs: IJMatch[];
}

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