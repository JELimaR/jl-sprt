import { IJEventInfo, JEvent } from "../../JCalendar/Event/JEvent";
import { IRankItem } from "../../JSportModule/data/Ranking/interfaces";
import { globalFinishedRankingsMap } from "../Rank/globalFinishedRankingsMap";
import { TGS } from "../types";

export interface IEvent_StageStartInfo extends IJEventInfo {
	stage: TGS;
}

/**
 * Este evento implica la asignacion de los teams, lo que provocara la creación de los eventos de draw de los BaseStage
 */
export class Event_StageStart extends JEvent {
  private _stage: TGS;
  constructor(ie_ssi: IEvent_StageStartInfo) {
    super(ie_ssi);
    this._stage = ie_ssi.stage;
  }

  execute() {
    console.log(`ejecuting starting and teams draw from stage: ${this._stage.info.id}`);
    
    const rankTable = this.getParticipants();
    this._stage.start(rankTable, this.calendar);
  }

  getParticipants() {
    const rankTable: IRankItem[] = [];
    this._stage.config.qualifyConditions.forEach(qc => {
      const ranking = globalFinishedRankingsMap.get(qc.rankId);

      if (!ranking) {
        console.log(`rankings`, globalFinishedRankingsMap.keys())
        throw new Error(`No existe ranking: ${qc.rankId}`)
      }
      if (ranking.size < qc.maxRankPos) {throw new Error(`El ranking es ${ranking.size} y se nesecitan ${qc.maxRankPos}`)}

      for (let p = qc.minRankPos; p <= qc.maxRankPos; p++)
        rankTable.push(ranking.getFromPosition(p));
    })
    // verificar que no hayan teams repetidos
    const setIds = new Set(rankTable.map(ri => ri.team.id));
    if (setIds.size !== rankTable.length) {
      console.log('teams')
      console.log(rankTable.map(ri => ri.team.id))

      this._stage.config.qualifyConditions.forEach(qc => {
        console.log(qc)
        const ranking = globalFinishedRankingsMap.get(qc.rankId);
        // console.log(ranking?.getRankTable().map(e => { return {...e, team: e.team.id}}))
        console.log(ranking?.getGenericRankItems())

      })
      throw new Error(``)
    }

    rankTable.sort((a,b) => a.pos - b.pos);

    return rankTable;
  }


}