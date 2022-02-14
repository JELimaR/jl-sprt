import JCalendar from "../../Calendar/JCalendar";
import JTeam from "../JTeam";
import JMatch from "../Match/JMatch";
import { IJTeamTableItem } from "../Rank/JTeamTableItem";
import { arr2 } from "../types";

export interface IJBaseConfig {
  id: string;
  season: number;
  participantsNumber: number;
  isIV: boolean;
  isNeutral: boolean;
}

export default abstract class JBase {
  private _baseConfig: IJBaseConfig;

  constructor(config: IJBaseConfig) {
    this._baseConfig = config;
  }

  // private _fchs: JFech[] = [];
	// private _participants: Map<number, JTeam> = new Map<number, JTeam>();

  // abstract get cantFechs(): number;

  // get fechs(): JFech[] {
  //   return this._fchs;
  // }
  // get teams(): JTeam[] {
	// 	let out: JTeam[] = [];
	// 	this._participants.forEach((team: JTeam) => {
	// 		out.push(team);
	// 	})
  //   return out;
  // }

  abstract get matches(): JMatch[];
  abstract get teams(): JTeam[];

  get config(): IJBaseConfig { return this._baseConfig }
  get id(): string {return this._baseConfig.id}

	abstract get table(): IJTeamTableItem[];

  abstract assign(participants: JTeam[] | arr2<JTeam>[], cal: JCalendar): void;
}