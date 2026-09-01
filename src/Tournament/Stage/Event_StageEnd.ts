import { IJEventInfo, JEvent } from "jl-calendar";
import { Ranking } from "../../JSportModule";
import { RankingStore } from "../../JSportModule/Ranking/RankingStore";
import { TGS } from "./Stage";

export interface IEvent_StageEndInfo extends IJEventInfo {
	stage: TGS;
	store: RankingStore;
}

/**
 * Este evento implica la finalización de un stage, lo cual genera que se agregue al store de rankings.
 */
export class Event_StageEnd extends JEvent {
  private _stage: TGS;
  private _store: RankingStore;
  constructor(ie_sei: IEvent_StageEndInfo) {
    super(ie_sei);
    this._stage = ie_sei.stage;
    this._store = ie_sei.store;
  }

  execute() {
    console.log(`ejecuting finishing stage: ${this._stage.info.id} (${this._stage.info.season})`);

    if (!this._stage.isFinished)
      throw new Error(`la stage ${this._stage.info.id} no esta terminada (${this._stage.info.season})`)
 
    let ranking: Ranking = this._stage.getRelativeRank();
    this._store.set(ranking.context, ranking);
  }
}