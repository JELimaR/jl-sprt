import { IElementInfo, IPhaseConfig, IStageConfig, IStageGroupConfig, IStagePlayoffConfig, ITournamentConfig } from "./elementsConfig";

/****************************************************************************************************************************
 * BaseStage
 */
// export interface IBaseStageData {}


// League
// export interface ILeagueData {}
// SingleElimination
// export interface ISingleElminationData {}

/****************************************************************************************************************************
 * Stage
 */
export interface IStageData<C extends IStageConfig> {
  info: IElementInfo;
  config: C;
}
// StageGroup
export interface IStageGroupData extends IStageData<IStageGroupConfig> { }
// StagePlayoff
export interface IStagePlayoffData extends IStageData<IStagePlayoffConfig> { }

/****************************************************************************************************************************
 * Phase
 */
export interface IPhaseData {
  info: IElementInfo;
  config: IPhaseConfig;
}
/****************************************************************************************************************************
 * Tournament
 */
export interface ITournamentData {
  info: IElementInfo;
  config: ITournamentConfig;
}
