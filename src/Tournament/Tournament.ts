import { JDateTime } from "../Calendar/DateTime/JDateTime";
import JCalendar from "../Calendar/JCalendar";
import { ITCCConfig, ITCCInfo, TCC } from "../patterns/templateConfigCreator";
import { IStageConfig, IStageInfo } from "./Stage/Stage";
import StageGroup, { IStageGroupConfig } from "./Stage/StageGroup/StageGroup";
import StagePlayoff, { IStagePlayoffConfig } from "./Stage/StagePlayoff/StagePlayoff";
import { TGS } from "./types";

export interface ITournamentConfig extends ITCCConfig {
  stages: (IStageConfig)[];
}
export interface ITournamentInfo extends ITCCInfo {
  season: number;
}

export default class Tournament extends TCC<ITournamentInfo, ITournamentConfig> {

  private _stages: TGS[] = [];

  constructor(info: ITournamentInfo, config: ITournamentConfig, cal: JCalendar) {
    super(info, config);
    config.stages.forEach((sconfig, i: number) => { 
      const stage: TGS = Tournament.create({id: `${info.id}_s${i+1}`, season: info.season}, sconfig, cal);
      this._stages.push(stage);
    })
  }

  get stages() { return this._stages }

  static create(info: IStageInfo, config: IStageConfig, cal: JCalendar): TGS {
    if (config.type == 'group') {
      const sconfig = config as IStageGroupConfig;
      return new StageGroup(info, sconfig, cal);
    } else if (config.type == 'playoff') {
      const sconfig = config as IStagePlayoffConfig;
      return new StagePlayoff(info, sconfig, cal);
    } else {
      throw new Error(`not implemented. (en StageConstructor)`)
    }
  }
	
}