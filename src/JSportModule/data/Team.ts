import { TGS } from "../../Tournament/Stage/Stage";
import Match from "../Match/Match";
import { Federation, Institution } from "./Entities";
import { TypeCategory } from "./types";

export interface ITeamData {

}

export interface ITeamCreator {
  entity: Institution | Federation;
  category: TypeCategory;
  matches: Math[];
}

export default class Team {
  // private _id: string;
	private _matches: Match[] = [];
  private _entity: Institution | Federation
  private _category: TypeCategory

  // stages donde participa
  private _stages: Map<string, TGS> = new Map<string, TGS>();
	constructor(itc: ITeamCreator) {
    this._entity = itc.entity
    this._category = itc.category
	}
  
	get id(): string {return `${this._category}_${this._entity.id}`}
  get entity(): Institution | Federation { return this._entity }
	get matches(): Match[] { return this._matches }

  addStage(stage: TGS) {
    this._stages.set(stage.config.idConfig, stage);
  }

	addNewMatch(match: Match) { 
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