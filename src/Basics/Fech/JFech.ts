import { JDateTime } from "../../Logica/DateTimeClasses/JDateTime";
import { TypeHalfWeekOfYear } from "../../Logica/DateTimeClasses/types";
import JCalendar from "../../Logica/JCalendar";
import LB from "../LB";
import JMatch, { IJMatch } from "../Match/JMatch";
import { JEventMatchAssignationOfFech } from "./JEventMatchAssignationOfFech";

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
	private _halfWeek: TypeHalfWeekOfYear;

	constructor(id: number, hw: TypeHalfWeekOfYear, ms: JMatch[]) {
		this._id = id;
		this._halfWeek = hw;
		this._matches = ms;
	}

	get id(): number { return this._id }
	get halfWeek(): TypeHalfWeekOfYear { return this._halfWeek }
	get matches(): JMatch[] { return this._matches }

	generateMatchesAssignations(cal: JCalendar, lb: LB): void {
		const dt = JDateTime.halfWeekOfYearToDateTime(
			this._halfWeek,
			lb.config.temp,
			'middle'
		);
		cal.addEvent(
			new JEventMatchAssignationOfFech({
				dateTime: dt.getIJDateTimeCreator(),
				calendar: cal,
				fech: this
			})
		);
	}
}