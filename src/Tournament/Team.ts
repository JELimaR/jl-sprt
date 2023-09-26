import Match from "./Match/JMatch";

export default class Team {
	private _id: string;
	private _matches: Match[] = [];
	constructor(id: string) {
		this._id = id;
	}

	get id(): string {return this._id}
	get matches(): Match[] { return this._matches }
	addNewMatch(match: Match) { 
		this._matches.push(match);
	}
	getTeamMatch(): TeamMatch {
		return new TeamMatch(this._id);
	}
}

export class TeamMatch {
	private _id: string;
	private _starters: Player[] = [];
	private _subs: Player[] = [];
	constructor(id: string) {
		this._id = id;
	}

	get id(): string {return this._id}
}

export class Player {

}