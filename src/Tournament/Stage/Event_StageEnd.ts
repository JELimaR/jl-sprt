import { IJEventInfo, JEvent } from "../../JCalendar/Event/JEvent";
import { Ranking } from "../../JSportModule";
import { globalFinishedRankingsMap } from "../Rank/globalFinishedRankingsMap";
import { TGS } from "./Stage";

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
    console.log(`ejecuting finishing stage: ${this._stage.info.id} (${this._stage.info.season})`);

    if (!this._stage.isFinished)
      throw new Error(`la stage ${this._stage.info.id} no esta terminada (${this._stage.info.season})`)
 
    let ranking: Ranking = this._stage.getRelativeRank();
    globalFinishedRankingsMap.set(ranking.context, ranking);
  }
}