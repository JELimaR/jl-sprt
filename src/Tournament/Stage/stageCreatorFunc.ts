import JCalendar from "../../Calendar/JCalendar";
import { TGS } from "../types";
import { IStageInfo, IStageConfig } from "./Stage";
import StageGroup, { IStageGroupConfig } from "./StageGroup/StageGroup";
import StagePlayoff, { IStagePlayoffConfig } from "./StagePlayoff/StagePlayoff";


export default function stageCreatorFunc(info: IStageInfo, config: IStageConfig, cal: JCalendar): TGS {
  // throw new Error(`sdfg  dsfg dfsg dsfg`)
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