import { IJEventInfo, JEvent } from "../../../Calendar/Event/JEvent";
import { globalRanksMap } from "../../../examples/stageExample";
import { JRankCalculator, JRankItem } from "../../Rank/JRank";
import TeamTableItem, { ITeamTableItem } from "../../Rank/TeamTableItem";
import { TYPEGENERICSTAGE } from "../Stage";
import StagePlayoff from "./StagePlayoff";

export interface IEvent_StagePlayoffEndInfo extends IJEventInfo {
	stage: TYPEGENERICSTAGE;
}

/**
 * Este evento implica la finalización de un stage, lo cual genera que se agregue al global rank
 */
export class Event_StagePlayoffEnd extends JEvent {
  private _stage: TYPEGENERICSTAGE;
  constructor(iespsi: IEvent_StagePlayoffEndInfo) {
    super(iespsi);
    this._stage = iespsi.stage;
  }

  execute() {
    console.log(`ejecuting finishing stage: ${this._stage.info.id}`);
    // borrar
    let ranking: JRankItem[];
    if (this._stage instanceof StagePlayoff) {
      ranking = JRankCalculator.getTableStagePlayoff(this._stage).map((t: ITeamTableItem, i: number) => { return {rank: i+1, team: t.team} });
    } else {
      throw new Error(`No implementado aún para StageGroup`)
    }

    globalRanksMap.set(this._stage.config.idConfig, ranking)
  }
}