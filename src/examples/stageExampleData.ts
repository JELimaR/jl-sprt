import { IStagePlayoffConfig, IStagePlayoffInfo } from "../Tournament/Stage/StagePlayoff/StagePlayoff";

const stageConfig1: IStagePlayoffConfig = {
  type: 'playoff',
  idConfig: 'sc1',
  name: 'Stage sc1',
  halfWeekOfStartDate: 20,
  halfWeekOfEndDate: 30,

  bombos: [{elemsNumber: 10, selectionPerTime: 1}, {elemsNumber: 10, selectionPerTime: 1}, {elemsNumber: 10, selectionPerTime: 1}, {elemsNumber: 10, selectionPerTime: 1}],

  qualifyConditions: [{minRankPos: 1, maxRankPos: 40, rankId: 'rankingInicial', season: 'previus'}],

  playoff: {
    idConfig: 'sc1-P',
    isIV: false,
    isNeutral: true,
    name: 'Single Elimination',
    participantsNumber: 40,
    roundHalfWeeks: [[20, 21], [24,25], [28,30]],
    roundHalfWeeksSchedule: [20, 24, 28],
    roundsNumber: 3,
  },
  drawRulesValidate: []
}

const stageInfo1: IStagePlayoffInfo = {
  id: 'sp11986',
  season: 1986,
}

const stageConfig2: IStagePlayoffConfig = {
  type: 'playoff',
  idConfig: 'sc2',
  name: 'Stage sc2',
  dayOfDrawDate: {day: 174, interv: 80},
  halfWeekOfStartDate: 48,
  halfWeekOfEndDate: 65,

  qualifyConditions: [{rankId: 'sr_sc1', season: 'current', minRankPos: 1, maxRankPos: 10}],

  bombos: [{elemsNumber: 10, selectionPerTime: 1}],

  playoff: {
    idConfig: 'sc2-P',
    isIV: true,
    isNeutral: true,
    name: 'Single Elimination',
    participantsNumber: 10,
    roundHalfWeeks: [[55, 57]],
    roundHalfWeeksSchedule: [50],
    roundsNumber: 1,
  },
  drawRulesValidate: []
}

const stageInfo2: IStagePlayoffInfo = {
  id: 'sp21986',
  season: 1986,
}
// const stageConfig2: IStageGroupConfig = {}
// const stageInfo2: IStageGroupInfo = {}

export default {
  s1: {info: stageInfo1, config: stageConfig1},
  s2: {info: stageInfo2, config: stageConfig2},
}