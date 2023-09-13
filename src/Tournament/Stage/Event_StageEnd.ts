import { IJEventInfo, JEvent } from "../../Calendar/Event/JEvent";
import { globalFinishedRankingsMap } from "../../examples/stageExample01";
import { JRankCalculator, RankItem, TypeRanking } from "../Rank/JRank";
import TeamTableItem, {  } from "../Rank/TeamTableItem";
import { TYPEGENERICSTAGE } from "./Stage";
import StagePlayoff from "./StagePlayoff/StagePlayoff";

export interface IEvent_StageEndInfo extends IJEventInfo {
	stage: TYPEGENERICSTAGE;
}

/**
 * Este evento implica la finalización de un stage, lo cual genera que se agregue al global rank
 */
export class Event_StageEnd extends JEvent {
  private _stage: TYPEGENERICSTAGE;
  constructor(ie_sei: IEvent_StageEndInfo) {
    super(ie_sei);
    this._stage = ie_sei.stage;
  }

  execute() {
    console.log(`ejecuting finishing stage: ${this._stage.info.id}`);

    if (!this._stage.isFinished) throw new Error(`la stage ${this._stage.info.id} no esta terminada`)
    // borrar
    let ranking: TypeRanking = JRankCalculator.getStageRelativeRank(this._stage);
    // if (this._stage instanceof StagePlayoff) {
    //   ranking = JRankCalculator.getTableStagePlayoff(this._stage, 'finished').map((t: TeamTableItem, i: number) => { return {rank: i+1, team: t.team} });
    // } else {
    //   throw new Error(`No implementado aún para StageGroup`)
    // }

    globalFinishedRankingsMap.set(ranking.rankId, ranking);
  }
}