import { IJEventInfo, JEvent } from "../../Calendar/Event/JEvent";
import { globalFinishedRankingsMap } from "../Rank/globalFinishedRankingsMap";
import { JRankCalculator } from "../Rank/RankCalculator";
import { TypeRanking } from "../Rank/ranking";
import { TGS } from "../types";

export interface IEvent_StageEndInfo extends IJEventInfo {
	stage: TGS;
}

/**
 * Este evento implica la finalización de un stage, lo cual genera que se agregue al global rank
 */
export class Event_StageEnd extends JEvent {
  private _stage: TGS;
  constructor(ie_sei: IEvent_StageEndInfo) {
    super(ie_sei);
    this._stage = ie_sei.stage;
  }

  execute() {
    console.log(`ejecuting finishing stage: ${this._stage.info.id}`);

    if (!this._stage.isFinished) throw new Error(`la stage ${this._stage.info.id} no esta terminada`)
 
    let ranking: TypeRanking = this._stage.getRelativeRank();
    globalFinishedRankingsMap.set(ranking.rankId, ranking);
  }
}