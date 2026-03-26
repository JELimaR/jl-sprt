import { TGS } from "../../Tournament/Stage/Stage";
import { A_Match } from "../Match/A_Match";
import { Federation, Institution } from "./Entities";
import { TypeCategory } from "./types";

export interface ITeamData {

}

export interface ITeamCreator {
  entity: Institution | Federation;
  category: TypeCategory;
  matches: A_Match<any>[];
}

export default class Team {
  // private _id: string;
	private _matches: A_Match<any>[] = [];
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
	get matches(): A_Match<any>[] { return this._matches }

  addStage(stage: TGS) {
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