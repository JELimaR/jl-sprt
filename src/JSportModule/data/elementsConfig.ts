import { TypeHalfWeekOfYear, TypeIntervalOfDay } from "../../JCalendar/JDateTimeModule";
import { ITCCConfig, ITCCInfo } from "../patterns/templateConfigCreator";
import { IGenericRankItem, IRankItem } from "../Ranking";
import { arr2 } from "./types";

export interface IElementInfo extends ITCCInfo {
  season: number;
}

/****************************************************************************************************************************
 * BaseStage
 */
export type TypeBaseStageOption = 'home' | 'h&a' | 'neutral'
export interface IBaseStageConfig extends ITCCConfig {
  participantsNumber: number;
  opt: TypeBaseStageOption;
}

// League
export interface ILeagueConfig extends IBaseStageConfig {
  turnHalfWeeks: TypeHalfWeekOfYear[];
  turnHalfWeeksSchedule: TypeHalfWeekOfYear[];
}
// SingleElimination
export interface ISingleElminationConfig extends IBaseStageConfig {
  roundsNumber: number;
  roundHalfWeeks: arr2<TypeHalfWeekOfYear>[];
  roundHalfWeeksSchedule: TypeHalfWeekOfYear[];
}

/****************************************************************************************************************************
 * Stage
 */
export type TQualyCondition = {
  rankId: string;
  season: 'current' | 'previus'; // innecesario?
  minRankPos: number;
  maxRankPos: number;
}

export type TypeDrawRulePlayoff = { origin: 'all' | string, minCount: number }

export interface IStageConfig extends ITCCConfig {
  type: 'group' | 'playoff';
  bsConfig: IBaseStageConfig;

  hwStart: TypeHalfWeekOfYear;
  intervalOfDrawDate?: TypeIntervalOfDay; // indica a que hora se visualiza el sorteo y si corresponde realizar el mismo
  hwEnd: TypeHalfWeekOfYear;

  drawRulesValidate: TypeDrawRulePlayoff[]; // reglas que validan un sorteo

  qualifyConditions: TQualyCondition[]; // solo puede ser ranking de: stage, federacion, o confederacion 

  bombos: number[];
}
// StageGroup
export interface IStageGroupConfig extends IStageConfig {
  type: 'group',
  participantsPerGroup: number[];
  bsConfig: ILeagueConfig;
}
// StagePlayoff
export interface IStagePlayoffConfig extends IStageConfig {
  type: 'playoff',
  bsConfig: ISingleElminationConfig;
}

/****************************************************************************************************************************
 * Phase
 */
export interface IPhaseConfig extends ITCCConfig {
  n: number;
  hwStart: TypeHalfWeekOfYear;
  hwEnd: TypeHalfWeekOfYear;
  stages: IStageConfig[];

  rankItemList: IGenericRankItem[];
}
/****************************************************************************************************************************
 * Tournament
 */
export interface ITournamentConfig extends ITCCConfig {
  hwStart: TypeHalfWeekOfYear;
  hwEnd: TypeHalfWeekOfYear;
  phases: IPhaseConfig[];
}