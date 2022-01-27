import { IJDateTimeCreator } from "../../Calendar/DateTime/JDateTime";
import { IJTournamentConfig } from "../../JTournament";
import { JRankCalculator, TypeTanking } from "../Rank/JRank";
import { ITeamTableItem } from "../Rank/JTeamTableItem";
import { IJStageGroupInfo } from "./JStageGroup";
import { IJStagePlayoffInfo } from "./JStagePlayoff";
import JSubStage, { IJSubStageInfo } from "./JSubStage";

export type TypeSubStageInfo =
	| {
		type: 'group',
		info: IJStageGroupInfo
	}
	| {
		type: 'playoff',
		info: IJStagePlayoffInfo
	}

export type TypeStageParallelInfo = {
	stageId: number,
	one: TypeSubStageInfo,
	two?: TypeSubStageInfo,
	three?: TypeSubStageInfo
}

export default class JStageParallels {

	_tournamentConfig: IJTournamentConfig;
	_prevStage: JStageParallels | undefined;
	_parallelInfo: TypeStageParallelInfo;

  _stages: Map<string, JSubStage> = new Map<string, JSubStage>();

	constructor(tournamentConfig: IJTournamentConfig, info: TypeStageParallelInfo) {
		this._tournamentConfig = tournamentConfig;

		this._parallelInfo = info;

	}

	get prevStage(): JStageParallels | undefined { return this._prevStage }
	set prevStage(prev: JStageParallels | undefined) { this._prevStage = prev }
	
  addStage(s: JSubStage) {
    if (this._stages.size === 0) {
      this._stages.set('one', s)
    } else if (this._stages.size === 1) {
      this._stages.set('two', s)
    } else if (this._stages.size === 2) {
      this._stages.set('three', s)
    } else {
      throw new Error(`this parallel is complete`);
    }
  }

  forEachSubStageInfo(func: (value: TypeSubStageInfo, idx?: number) => void): void {
    if (!this._parallelInfo.one) throw new Error(`no existen datos`)
    func(this._parallelInfo.one, 0);
    if (!this._parallelInfo.two) return;
    func(this._parallelInfo.two, 2);
    if (!this._parallelInfo.three) return;
    func(this._parallelInfo.three, 3);
  }

  forEachSubStage( func: (value: JSubStage, key?: string) => void): void {
    this._stages.forEach((s: JSubStage, k: string) => func(s, k))
  }

  get oneSS(): JSubStage | undefined {return this._stages.get('one')}
  get twoSS(): JSubStage | undefined {return this._stages.get('two')}
  get threeSS(): JSubStage | undefined {return this._stages.get('three')}
	get tournamentConfig(): IJTournamentConfig { return this._tournamentConfig }
	get info(): TypeStageParallelInfo { return this._parallelInfo }

  get isFinished(): boolean {
    let out: boolean = true;
    this.forEachSubStage((ss: JSubStage) => out = out && ss.isFinished)
    return out;
  }

  get rank(): TypeTanking {
    return JRankCalculator.getRankStageParallel(this)
  }

	// abstract get relativeTable(): ITeamTableItem[];

	// abstract get rank(): any;

	// abstract drawRulesValidate(teams: JTeam[] | arr2<JTeam>): boolean;

	// qualified(): JTeam[] {
	// 	if (!this._prevStage) { return [] }
	// 	if (!this._prevQualies) throw new Error(`no existe criterio de clasificacion `)
	// 	let out: JTeam[] = [];
	// 	const rank: JRankItem[] = JRankCalculator.getRankStageParallel(this._prevStage); // calcular el verdadero rank
	// 	rank.forEach((ri: JRankItem) => {
	// 		if (ri.rank >= this._prevQualies!.rankPosMin && ri.rank <= this._prevQualies!.rankPosMax) {
	// 			out.push(ri.team);
	// 		}
	// 	})
	// 	return out;
	// }

}