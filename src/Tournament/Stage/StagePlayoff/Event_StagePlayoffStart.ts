import { IJEventInfo, JEvent } from "../../../Calendar/Event/JEvent";
import { globalRanksMap } from "../../../examples/stageExample";
import Team from "../../Team";
import { TYPEGENERICSTAGE } from "../Stage";
import StagePlayoff from "./StagePlayoff";

export interface IEvent_StagePlayoffStartInfo extends IJEventInfo {
	stage: TYPEGENERICSTAGE;
}

/**
 * Este evento implica la asignacion de los teams, lo que provocara la creación de los eventos de draw de los BaseStage
 */
export class Event_StagePlayoffStart extends JEvent {
  private _stage: TYPEGENERICSTAGE;
  constructor(iespsi: IEvent_StagePlayoffStartInfo) {
    super(iespsi);
    this._stage = iespsi.stage;
  }

  execute() {
    console.log(`ejecuting starting and teams draw from stage: ${this._stage.info.id}`);
    
    const teams = this._stage.getParticipants(globalRanksMap);
    this._stage.start(teams, this.calendar);
  }


}