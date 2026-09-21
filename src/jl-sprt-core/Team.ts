import type { A_Match } from './Match/A_Match';
import { TypeCategory } from './types';

export interface ITeamOwner { // ESTO REPRESENTA UNA ENTITY (INSTITUTION O FEDERATION) QUE PUEDE SER DUEÑO DE UN TEAM
	readonly id: string;
	readonly name: string;
}

export interface ITeamCreator {
	id: string;
	name: string;
  category: TypeCategory;
	owner: ITeamOwner;
	matches?: A_Match<any>[]; // Va con "?"" ?
}

export class Team {
	private _id: string;
	private _name: string;
	private _owner: ITeamOwner;
	private _matches: A_Match<any>[] = [];
	private _category: TypeCategory;
	private _stages: Map<string, unknown> = new Map<string, unknown>();
	constructor(itc: ITeamCreator) {
		this._id = itc.id;
		this._name = itc.name;
		this._owner = itc.owner;
		this._category = itc.category;
		this._matches = itc.matches ?? [];
	}
  
	get id(): string { return this._id }
  /** Nombre legible del team (nombre de su entidad). Para mostrar en UI/labels. */
	get name(): string { return this._name }
	get entity(): ITeamOwner { return this._owner }
	get category(): TypeCategory { return this._category }
	get matches(): A_Match<any>[] { return this._matches }

	addStage(stage: { config: { idConfig: string } }) {
		this._stages.set(stage.config.idConfig, stage);
  }

	addNewMatch(match: A_Match<any>) { 
		this._matches.push(match);
	}
	getTeamMatch(): TeamMatch {
		return new TeamMatch(this.id);
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