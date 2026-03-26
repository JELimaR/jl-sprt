import JCalendar from "../JCalendar/JCalendar";
import { IGenericRankItem, Ranking, TCC } from "../JSportModule";
import { IElementInfo, IPhaseConfig, ITournamentConfig } from "../JSportModule/data";
import { createGSG } from "../JSportModule/GeneralStageGraph/GSGCreators";
import { ITournamentFromGSGData, tournamentFromGSG } from "../JSportModule/GeneralStageGraph/tournamentFromGSG";
import { AnySportProfile } from "../JSportModule/profiles/ISportProfile";
import Phase from "./Phase";
import { TGS } from "./Stage/Stage";

export default class Tournament extends TCC<IElementInfo, ITournamentConfig> {

  private _phases: Phase[] = [];
  private _fromGSGData: ITournamentFromGSGData | undefined;
  // private _qualyGenericRankItemList: IGenericRankItem[]

  private _sportProfile: AnySportProfile;

  private constructor(info: IElementInfo, config: ITournamentConfig, cal: JCalendar, sportProfile: AnySportProfile) {
    super(info, config);
    this._sportProfile = sportProfile;
    // this._qualyGenericRankItemList = qualyGenericRankItemList;
    /**
    * creacion de las phases
    */
    // let previusPhasesAgregate: IPhaseConfig[] = []
    config.phases.forEach((ipc: IPhaseConfig, i: number) => {
      ipc.n = i + 1;
      const ipi: IElementInfo = {
        id: `${info.id}_p${ipc.n}`,
        season: info.season,
      }
      // let previusPhasesConfigArr = [...previusPhasesAgregate];
      // const previusPhaseConfig = i >= 1 ? config.phases[i - 1] : undefined;
      const phase = new Phase(ipi, ipc, cal, sportProfile);
      this._phases.push(phase);

      // previusPhasesAgregate.push(config.phases[i]);
      // if (i !== 0) {
      //   phase.previusPhase = this._phases[i - 1];
      // }
    })

  }

  get stagesMap() {
    let out: Map<string, TGS> = new Map<string, TGS>()
    this._phases.forEach((phase: Phase) => {
      phase.stages.forEach((stage: TGS) => {
        out.set(stage.config.idConfig, stage)
      })
    })
    return out;
  }
  get phases() { return this._phases }
  get graph() {
    const fromGSGData = this._fromGSGData;
    if (!fromGSGData) {
      throw new Error(`No existe GSG en tournament: ${this.config.idConfig}
      En tournament.getgraph`)
    } else {
      return createGSG(fromGSGData.gsgData.initialCreator, fromGSGData.gsgData.phaseArr)
    }
  }
  get qualyGenericRankItemList(): IGenericRankItem[] {
    return this.graph.getQualyRankList()
  }
  // getInitialRankings(): Ranking[] {
  //   return this.graph.getInitialRankings()
  // }

  getRelativeRank(): Ranking {    
    let phaseRank: Ranking = Ranking.fromTypeRanking({context: 'none', items: [], teams: []});

    let pi = this._phases.length;
    while (pi > 0 && phaseRank.context == 'none') {
      pi--;
      if (this._phases[pi].isFinished) {
        phaseRank = this._phases[pi].getRelativeRank();
      }
    }

    return Ranking.fromTypeRanking({
      ...phaseRank.getInterface(),
      context: 'tr_' + this.config.idConfig,
    });
  }

  //
  static create(info: IElementInfo, creator: ITournamentFromGSGData, cal: JCalendar, sportProfile: AnySportProfile): Tournament {
    const config = tournamentFromGSG(creator)
    const t = new Tournament(info, config, cal, sportProfile)
    t._fromGSGData = creator;
    return t;
  }

}

