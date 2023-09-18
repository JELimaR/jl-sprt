import { IJEventInfo, JEvent } from "../../Calendar/Event/JEvent";
import { globalFinishedRankingsMap } from "../Rank/globalFinishedRankingsMap";
import Team from "../Team";
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
    
    const teams = this.getParticipants();
    this._stage.start(teams, this.calendar); // debe ser un ranking en lugar de un teams
  }

  getParticipants() { // cambiar Map por TypeRanking
    const teams: Team[] = [];
    this._stage.config.qualifyConditions.forEach(qc => {
      const ranking = globalFinishedRankingsMap.get(qc.rankId)!; // verificar correctamente

      if (ranking.table.length < qc.maxRankPos) throw new Error(``)

      for (let p = qc.minRankPos - 1; p < qc.maxRankPos; p++)
        teams.push(ranking.table[p].team);
    })

    return teams;
  }


}