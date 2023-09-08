import { ITCCConfig, ITCCInfo, TCC } from "../../patterns/templateConfigCreator";

export interface IStageConfig extends ITCCConfig {
  
}

export interface IStageInfo extends ITCCInfo {

}

export default class Stage extends TCC<IStageInfo, IStageConfig> {
  constructor(info: IStageInfo, config: IStageConfig) {
    super(info, config)
  }
}