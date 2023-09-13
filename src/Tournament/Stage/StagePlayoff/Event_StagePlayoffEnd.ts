import { IJEventInfo, JEvent } from "../../../Calendar/Event/JEvent";
import { globalRanksMap } from "../../../examples/stageExample";
import { JRankCalculator } from "../../Rank/JRank";
import TeamTableItem, { ITeamTableItem } from "../../Rank/TeamTableItem";
import StagePlayoff from "./StagePlayoff";

export interface IEvent_StagePlayoffEndInfo extends IJEventInfo {
	stagePlayoff: StagePlayoff;
}

/**
 * Este evento implica la asignacion de los teams, lo que provocara la creación de los eventos de draw de los BaseStage
 */
export class Event_StagePlayoffEnd extends JEvent {
  private _stagePlayoff: StagePlayoff;
  constructor(iespsi: IEvent_StagePlayoffEndInfo) {
    super(iespsi);
    this._stagePlayoff = iespsi.stagePlayoff;
  }

  execute() {
    console.log(`ejecuting finishing stage: ${this._stagePlayoff.info.id}`);
    // borrar
    const ranking = JRankCalculator.getTableStagePlayoff(this._stagePlayoff).map((t: ITeamTableItem, i: number) => { return {rank: i+1, team: t.team} });
    globalRanksMap.set(this._stagePlayoff.config.idConfig, ranking)
    // console.log(globalRanksMap)
  }
}