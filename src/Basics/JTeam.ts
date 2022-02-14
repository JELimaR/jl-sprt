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
	getTeamMatch(): JTeamMatch {
		return new JTeamMatch(this._id);
	}
}

export class JTeamMatch {
	private _id: string;
	private _starters: JPlayer[] = [];
	private _subs: JPlayer[] = [];
	constructor(id: string) {
		this._id = id;
	}

	get id(): string {return this._id}
}

export class JPlayer {

}