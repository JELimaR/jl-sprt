
/**
 * se crea IJTorunamentConfig como ejemplo
 */

import { IJTournamentConfig } from "../Basics/JTournament";
import { TypeStageParallelInfo } from "../Basics/Stage/JStageParallels";
import { JDateTime } from "../Calendar/DateTime/JDateTime";
import { getExampleTeams } from "../Entities/ExampleData";
import { calculateParticipantsPerGroupArray } from "./validationFunctions";

const selection = getExampleTeams(32).map((t, idx) => { return { team: t, rank: idx + 1 } })

const configExample: IJTournamentConfig = {
  entity: 'hellos',
  category: 'S',
  name: 'my fisrt tournament',
  participantsRank: selection, // el numero de parts debe ser igual a la suma de participantsNumber.news de cada stage
  // nextStageQualified: [],
  season: 1,
}

const stagesExample: TypeStageParallelInfo[] = [
  {
    stageId: 0,
    one: {
      type: 'group',
      info: {
        ssId: 'S0-L1-SG',
        participantsNumber: 32,
        prevQualies: { rankPosMin: 1, rankPosMax: 32 },
        createDate: JDateTime.createFromHalfWeekOfYearAndYear(90, configExample.season, 'start', 1).getIJDateTimeCreator(),
        initDate: { day: 20, interv: 0 },
        finalDate: { day: 350, interv: 0 },
        drawDate: JDateTime.createFromHalfWeekOfYearAndYear(90, configExample.season, 'start', 2).getIJDateTimeCreator(),
        isNeutral: true,
        isIV: true,
        thereIsDraw: false,
        allowedDraw: true,
        rankMinValue: 1,
        bombos: [ // la suma de cant debe ser igual al total de partsNumber y la suma de selection debe ser igual al max participant per group
          { cant: 8, selectionPerTime: 1 },
          { cant: 8, selectionPerTime: 1 },
          { cant: 8, selectionPerTime: 1 },
          { cant: 8, selectionPerTime: 1 },
        ],
        groupsNumber: 8,
        participantsPerGroup: calculateParticipantsPerGroupArray(32, 8),
        drawRulesValidate: [],
        fechHalfWeeks: [
          95, 96, 97,
        ],
        fechHalfWeeksSchedule: [
          90, 90, 90
        ],
      }
    }
  },
  {
    stageId: 1,
    one: {
      type: 'playoff', // ultimos
      info: {
        ssId: 'S1-L1-SP',
        participantsNumber: 16,
        roundsNumber: 3,
        prevQualies: { rankPosMin: 1, rankPosMax: 16 },
        createDate: JDateTime.createFromHalfWeekOfYearAndYear(98, configExample.season, 'start', 1).getIJDateTimeCreator(),
        initDate: { day: 155, interv: 0 },
        finalDate: { day: 350, interv: 0 },
        drawDate: JDateTime.createFromHalfWeekOfYearAndYear(98, configExample.season, 'start', 3).getIJDateTimeCreator(),
        isNeutral: true,
        isIV: false,
        thereIsDraw: false,
        rankMinValue: 1,
        bombos: [
          { cant: 8, selectionPerTime: 1 },
          { cant: 8, selectionPerTime: 1 },
        ],
        drawRulesValidate: [],
        roundHalfWeeks: [
          [98, 98], [99,99], [100,100],
        ],
        roundHalfWeeksSchedule: [
          98, 99, 100,
        ],
      }
    },
  },
  {
    stageId: 2,
    one: {
      type: 'playoff', // ultimos
      info: {
        ssId: 'S2-L1-SP',
        participantsNumber: 2,
        roundsNumber: 1,
        prevQualies: { rankPosMin: 1, rankPosMax: 2 },
        createDate: JDateTime.createFromHalfWeekOfYearAndYear(101, configExample.season, 'start', 1).getIJDateTimeCreator(),
        initDate: { day: 155, interv: 0 },
        finalDate: { day: 350, interv: 0 },
        drawDate: JDateTime.createFromHalfWeekOfYearAndYear(101, configExample.season, 'start', 2).getIJDateTimeCreator(),
        isNeutral: true,
        isIV: false,
        thereIsDraw: false,
        rankMinValue: 1,
        bombos: [
          { cant: 2, selectionPerTime: 1 },
        ],
        drawRulesValidate: [],
        roundHalfWeeks: [
          [101,101],
        ],
        roundHalfWeeksSchedule: [
          101,
        ],
      }
    },
    two: {
      type: 'playoff', // ultimos
      info: {
        ssId: 'S2-L2-SP',
        participantsNumber: 2,
        roundsNumber: 1,
        prevQualies: { rankPosMin: 3, rankPosMax: 4 },
        createDate: JDateTime.createFromHalfWeekOfYearAndYear(101, configExample.season, 'start', 1).getIJDateTimeCreator(),
        initDate: { day: 155, interv: 0 },
        finalDate: { day: 350, interv: 0 },
        drawDate: JDateTime.createFromHalfWeekOfYearAndYear(101, configExample.season, 'start', 2).getIJDateTimeCreator(),
        isNeutral: true,
        isIV: false,
        thereIsDraw: false,
        rankMinValue: 3,
        bombos: [
          { cant: 2, selectionPerTime: 1 },
        ],
        drawRulesValidate: [],
        roundHalfWeeks: [
          [101,101],
        ],
        roundHalfWeeksSchedule: [
          101,
        ],
      }
    },
  },
]

export default {
  tournamentconfig: configExample,
  stages: stagesExample,
  participantsRank: selection, // el numero de parts debe ser igual a la suma de participantsNumber.news de cada stage
}