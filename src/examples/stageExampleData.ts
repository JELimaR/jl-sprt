import { IStageGroupConfig } from "../Tournament/Stage/StageGroup/StageGroup";
import { IStagePlayoffConfig } from "../Tournament/Stage/StagePlayoff/StagePlayoff";
import { IElementInfo } from "../Tournament/types";

const stageConfig1: IStagePlayoffConfig = {
  type: 'playoff',
  idConfig: 'sc1',
  name: 'Stage sc1',
  hwStart: 20,
  hwEnd: 30,

  bombos: [10, 10, 10, 10],

  qualifyConditions: [{ minRankPos: 1, maxRankPos: 40, rankId: 'rankingInicial', season: 'previus' }],

  bsConfig: {
    idConfig: 'sc1-P',
    opt: 'neutral',
    name: 'Single Elimination',
    participantsNumber: 40,
    roundHalfWeeks: [[20, 21], [24, 25], [28, 30]],
    roundHalfWeeksSchedule: [20, 24, 28],
    roundsNumber: 3,
  },
  drawRulesValidate: []
}

const stageInfo1: IElementInfo = {
  id: 'sp11986',
  season: 1986,
}
/*************************************************************************************************************** */
const stageConfig2: IStagePlayoffConfig = {
  type: 'playoff',
  idConfig: 'sc2',
  name: 'Stage sc2',
  intervalOfDrawDate: 80,
  hwStart: 48,
  hwEnd: 65,

  qualifyConditions: [{ rankId: 'sr_sc1', season: 'current', minRankPos: 1, maxRankPos: 10 }],

  bombos: [10],

  bsConfig: {
    idConfig: 'sc2-P',
    opt: 'h&a',
    name: 'Single Elimination',
    participantsNumber: 10,
    roundHalfWeeks: [[55, 57]],
    roundHalfWeeksSchedule: [50],
    roundsNumber: 1,
  },
  drawRulesValidate: []
}

const stageInfo2: IElementInfo = {
  id: 'sp21986',
  season: 1986,
}

/****************************************************************************************************************** */
const stageConfig3: IStageGroupConfig = {
  type: 'group',
  idConfig: 'sc3',
  name: 'Stage sc3',
  intervalOfDrawDate: 80,
  hwStart: 30,
  hwEnd: 48,

  qualifyConditions: [{ rankId: 'rankingInicial', season: 'current', minRankPos: 1, maxRankPos: 40 }],

  bombos: [8, 20, 12],

  participantsPerGroup: [10, 10, 10, 10],

  bsConfig: {
    idConfig: 'sc3-G',
    opt: 'neutral',
    name: 'Group',
    participantsNumber: 10,
    turnHalfWeeks: [32, 33, 36, 38, 40, 42, 44, 46, 48],
    turnHalfWeeksSchedule: [30, 30, 30, 30, 30, 30, 30, 30, 30],
  },
  drawRulesValidate: []
}

const stageInfo3: IElementInfo = {
  id: 'sg31986',
  season: 1986,
}
/****************************************************************************************************************** */
const stageConfig4: IStageGroupConfig = {
  type: 'group',
  idConfig: 'sc4',
  name: 'Stage sc4',
  intervalOfDrawDate: 188,
  hwStart: 50,
  hwEnd: 64,

  qualifyConditions: [{ rankId: 'sr_sc3', season: 'current', minRankPos: 1, maxRankPos: 15 }],

  bombos: [4,4,4,3],

  participantsPerGroup: [4, 4, 4, 3],

  bsConfig: {
    idConfig: 'sc4-G',
    opt: 'h&a',
    name: 'Group',
    participantsNumber: 4,
    turnHalfWeeks: [52, 54, 56, 60, 62, 64],
    turnHalfWeeksSchedule: [50, 50, 50, 50, 50, 50],
  },
  drawRulesValidate: []
}

const stageInfo4: IElementInfo = {
  id: 'sg41986',
  season: 1986,
}

export default {
  s1: { info: stageInfo1, config: stageConfig1 },
  s2: { info: stageInfo2, config: stageConfig2 },
  s3: { info: stageInfo3, config: stageConfig3 },
  s4: { info: stageInfo4, config: stageConfig4 },
}