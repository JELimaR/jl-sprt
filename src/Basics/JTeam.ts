import JMatch from "./Match/JMatch";

export default class JTeam {
	private _id: string;
	private _matches: JMatch[] = [];
	constructor(id: string) {
		this._id = id;
	}

	get id(): string {return this._id}
	get matches(): JMatch[] { return this._matches }
	addNewMatch(match: JMatch) { 
		this._matches.push(match);
	}
}

export class JTeamMatch {
	private _id: string;
	constructor(id: string) {
		this._id = id;
	}

	get id(): string {return this._id}
}