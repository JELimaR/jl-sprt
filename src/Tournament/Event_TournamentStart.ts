import { IJEventInfo, JEvent } from "../Calendar/Event/JEvent";
import JCalendar from "../Calendar/JCalendar";
// import Stage, { IStageConfig, IStageInfo } from "./Stage/Stage";
import StageGroup, { IStageGroupConfig, IStageGroupInfo } from "./Stage/StageGroup/StageGroup";
import StagePlayoff, { IStagePlayoffConfig, IStagePlayoffInfo } from "./Stage/StagePlayoff/StagePlayoff";
import Tournament from "./Tournament";
// import { TGS } from "./types";

export interface IEvent_TournamentStartInfo extends IJEventInfo {
	tournament: Tournament;
}

/**
 * Este evento implica la creacion de los stages
 */
export class Event_TournamentStart extends JEvent {
  private _tournament: Tournament;;
  constructor(ie_ssi: IEvent_TournamentStartInfo) {
    super(ie_ssi);
    this._tournament = ie_ssi.tournament;
  }

  execute() {
    console.log(`ejecuting starting from tournament: ${this._tournament.info.id}`);
    
    this._tournament.config.stages.forEach(config => {
      console.log(config)
    })
  }

  // create(info: TInfo, config: TConfig, cal: JCalendar): TStage {
  //   if (config.type == 'group') {
  //     const sconfig = config as IStageGroupConfig;
  //     return new StageGroup(info, sconfig, cal);
  //   } else if (config.type == 'playoff') {
  //     const sconfig = config as IStagePlayoffConfig;
  //     return new StagePlayoff(info, sconfig, cal);
  //   } else {
  //     throw new Error(`not implemented. (en StageConstructor)`)
  //   }
  // }
  // create(info: IStageInfo, config: IStageConfig, cal: JCalendar): TGS {
  //   if (config.type == 'group') {
  //     const sconfig = config as IStageGroupConfig;
  //     return new StageGroup(info, sconfig, cal);
  //   } else if (config.type == 'playoff') {
  //     const sconfig = config as IStagePlayoffConfig;
  //     return new StagePlayoff(info, sconfig, cal);
  //   } else {
  //     throw new Error(`not implemented. (en StageConstructor)`)
  //   }
  // }
}

type TInfo = IStageGroupInfo | IStagePlayoffInfo;
type TConfig = IStageGroupConfig | IStagePlayoffConfig;
type TStage = StageGroup | StagePlayoff;