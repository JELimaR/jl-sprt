import { IJEventInfo, JEvent } from "../../../Calendar/Event/JEvent";
import { globalRanksMap } from "../../../examples/stageExample";
import Team from "../../Team";
import StagePlayoff from "./StagePlayoff";

export interface IEvent_StagePlayoffStartInfo extends IJEventInfo {
	stagePlayoff: StagePlayoff;
}

/**
 * Este evento implica la asignacion de los teams, lo que provocara la creación de los eventos de draw de los BaseStage
 */
export class Event_StagePlayoffStart extends JEvent {
  private _stagePlayoff: StagePlayoff;
  constructor(iespsi: IEvent_StagePlayoffStartInfo) {
    super(iespsi);
    this._stagePlayoff = iespsi.stagePlayoff;
  }

  execute() {
    console.log(`ejecuting starting and teams draw from stage: ${this._stagePlayoff.info.id}`);
    
    const teams = this._stagePlayoff.getParticipants(globalRanksMap);
    this._stagePlayoff.start(teams, this.calendar);
  }


}