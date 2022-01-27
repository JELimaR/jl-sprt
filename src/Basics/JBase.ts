import JCalendar from "../Calendar/JCalendar";
import JTeam from "./JTeam";
import JMatch from "./Match/JMatch";
import { ITeamTableItem } from "./Rank/JTeamTableItem";


export default abstract class JBase {
  private _config: any;

  // private _fchs: JFech[] = [];
	// private _participants: Map<number, JTeam> = new Map<number, JTeam>();

  abstract get cantFechs(): number;

  abstract get partsNumber(): number;
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

  abstract get config(): any;

	abstract get table(): ITeamTableItem[];

  abstract assign(participants: JTeam[], cal: JCalendar): void;
}