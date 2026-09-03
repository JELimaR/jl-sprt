import { IJEventInfo, JInstantEvent } from "jl-calendar";
import { IRankItem } from "../../JSportModule";
import { RankingStore } from "../../JSportModule/Ranking/RankingStore";
import { TGS } from "./Stage";

export interface IEvent_StageStartInfo extends IJEventInfo {
	stage: TGS;
	store: RankingStore;
}

/**
 * Este evento implica la asignacion de los teams, lo que provocara la creación de los eventos de draw de los BaseStage
 */
export class Event_StageStart extends JInstantEvent {
  private _stage: TGS;
  private _store: RankingStore;
  constructor(ie_ssi: IEvent_StageStartInfo) {
    super(ie_ssi);
    this._stage = ie_ssi.stage;
    this._store = ie_ssi.store;
  }

  get kind(): string { return 'stage-start'; }
  get label(): string { return `Inicio de stage ${this._stage.info.id}`; }

  execute() {
    console.log(`ejecuting starting and teams draw from stage: ${this._stage.info.id}  (${this._stage.info.season})`);
    
    const rankTable = this.getParticipants();
    rankTable.forEach((iri: IRankItem) => {
      iri.team.addStage(this._stage)
    })
    this._stage.start(rankTable, this.calendar);
  }

  getParticipants() {
    const rankTable: IRankItem[] = [];
    this._stage.config.qualifyConditions.forEach(qc => {
      const ranking = this._store.get(qc.rankId);

      if (!ranking) {
        console.log(`rankings`, this._store.keys())
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
        const ranking = this._store.get(qc.rankId);
        // console.log(ranking?.getRankTable().map(e => { return {...e, team: e.team.id}}))
        console.log(ranking?.getGenericRankItems())

      })
      throw new Error(`
      en Event_StageStart.getParticipants`)
    }

    rankTable.sort((a,b) => a.pos - b.pos);

    return rankTable;
  }


}