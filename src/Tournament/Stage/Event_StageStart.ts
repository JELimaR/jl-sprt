import { IJEventInfo, JEvent } from "../../Calendar/Event/JEvent";
import { globalFinishedRankingsMap } from "../../examples/stageExample01";
import { TYPEGENERICSTAGE } from "./Stage";

export interface IEvent_StageStartInfo extends IJEventInfo {
	stage: TYPEGENERICSTAGE;
}

/**
 * Este evento implica la asignacion de los teams, lo que provocara la creación de los eventos de draw de los BaseStage
 */
export class Event_StageStart extends JEvent {
  private _stage: TYPEGENERICSTAGE;
  constructor(ie_ssi: IEvent_StageStartInfo) {
    super(ie_ssi);
    this._stage = ie_ssi.stage;
  }

  execute() {
    console.log(`ejecuting starting and teams draw from stage: ${this._stage.info.id}`);
    
    const teams = this._stage.getParticipants(globalFinishedRankingsMap); // se debe arreglar esto!
    this._stage.start(teams, this.calendar);
  }


}