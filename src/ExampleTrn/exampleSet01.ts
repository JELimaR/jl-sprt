
/**
 * se crea IJTorunamentConfig como ejemplo
 */

import { IJTournamentConfig } from "../Basics/JTournament";
import { TypeStageParallelInfo } from "../Basics/Stage/JStageParallels";
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
        participantsNumber: 24,
        prevQualies: { rankPosMin: 9, rankPosMax: 32 },
        createDate: { day: 1, interv: 1 },
        initDate: { day: 20, interv: 0 },
        finalDate: { day: 350, interv: 0 },
        drawDate: { day: 5, interv: 0 },
        isNeutral: false,
        isIV: true,
        thereIsDraw: false,
        allowedDraw: true,
        rankMinValue: 9,
        bombos: [ // la suma de cant debe ser igual al total de partsNumber y la suma de selection debe ser igual al max participant per group
          { cant: 4, selectionPerTime: 1 },
          { cant: 4, selectionPerTime: 1 },
          { cant: 8, selectionPerTime: 2 },
          { cant: 8, selectionPerTime: 2 },
        ],
        groupsNumber: 4,
        participantsPerGroup: calculateParticipantsPerGroupArray(24, 4),
        drawRulesValidate: [],
        fechHalfWeeks: [
          20, 22, 24, 26, 27, 28, 30, 32, 35, 38,
        ],
        fechHalfWeeksSchedule: [
          10, 10, 10, 10, 10, 20, 22, 24, 26, 27
        ],
      }
    }
  },
  {
    stageId: 1,
    one: {
      type: 'group', // ultimos
      info: {
        ssId: 'S1-L1-SG',
        participantsNumber: 16,
        prevQualies: { rankPosMin: 1, rankPosMax: 16 },
        createDate: { day: 150, interv: 0 },
        initDate: { day: 155, interv: 0 },
        finalDate: { day: 350, interv: 0 },
        drawDate: { day: 152, interv: 0 },
        isNeutral: false,
        isIV: true,
        allowedDraw: true,
        thereIsDraw: false,
        rankMinValue: 1,
        bombos: [
          { cant: 8, selectionPerTime: 2 },
          { cant: 4, selectionPerTime: 1 },
          { cant: 4, selectionPerTime: 1 },
        ],
        groupsNumber: 4,
        participantsPerGroup: calculateParticipantsPerGroupArray(16, 4),
        drawRulesValidate: [],
        fechHalfWeeks: [
          65, 66, 67, 68, 70, 72
        ],
        fechHalfWeeksSchedule: [
          65, 65, 65, 65, 65, 65
        ],
      }
    },
  },
  {
    stageId: 2,
    one: {
      type: 'playoff',
      info: {
        ssId: 'S2-L1-SP',
        roundsNumber: 2, // calcular clasificados
        participantsNumber: 8,
        prevQualies: { rankPosMin: 1, rankPosMax: 8 }, // max + 1 - min debe ser igual a participantsNumber
        createDate: { day: 300, interv: 0 }, // debe crearse luego de terminada la anterior (finalDate) debido a que cuando se crea, se determinan los participantes
        initDate: { day: 301, interv: 0 }, // debe iniciar luego de drawDate
        finalDate: { day: 350, interv: 0 }, // debe c
        drawDate: { day: 300, interv: 150 }, // debe ser luego de que se crea y antes de iniciarse
        isNeutral: true,
        isIV: true,
        thereIsDraw: false,
        rankMinValue: 1,
        bombos: [
          { cant: 4, selectionPerTime: 1 }, // siempre es uno
          { cant: 4, selectionPerTime: 1 }, // siempre es uno
        ],
        drawRulesValidate: [],
        roundHalfWeeks: [ // el ultimo debe ser previo a final date
          [92, 94], [95, 96],
        ],
        roundHalfWeeksSchedule: [
          90, 95
        ],
      }
    }
  },
  {
    stageId: 3,
    one: {
      type: 'playoff',
      info: {
        ssId: 'S3-L1-SP',
        roundsNumber: 1,
        participantsNumber: 2,
        prevQualies: { rankPosMin: 1, rankPosMax: 2 },
        createDate: { day: 348, interv: 0 },
        initDate: { day: 344, interv: 0 },
        finalDate: { day: 350, interv: 0 },
        drawDate: { day: 348, interv: 150 },
        isNeutral: true,
        isIV: false,
        rankMinValue: 1,
        thereIsDraw: false,
        bombos: [
          { cant: 2, selectionPerTime: 1 }, // siempre es uno
        ],
        drawRulesValidate: [],
        roundHalfWeeks: [ // cambiar a round
          [103, 103],
        ],
        roundHalfWeeksSchedule: [
          101
        ],
      }
    },
    two: {
      type: 'playoff',
      info: {
        ssId: 'S3-L2-SP',
        roundsNumber: 1,
        participantsNumber: 2,
        prevQualies: { rankPosMin: 3, rankPosMax: 4 },
        createDate: { day: 348, interv: 0 },
        initDate: { day: 344, interv: 0 },
        finalDate: { day: 350, interv: 0 },
        drawDate: { day: 348, interv: 150 },
        isNeutral: true,
        isIV: false,
        thereIsDraw: false,
        rankMinValue: 3,
        bombos: [
          { cant: 2, selectionPerTime: 1 }, // siempre es uno
        ],
        drawRulesValidate: [],
        roundHalfWeeks: [ // cambiar a round
          [103, 103],
        ],
        roundHalfWeeksSchedule: [
          101
        ],
      }
    },
    three: {
      type: 'playoff',
      info: {
        ssId: 'S3-L3-SP',
        roundsNumber: 1,
        participantsNumber: 2,
        prevQualies: { rankPosMin: 31, rankPosMax: 32 },
        createDate: { day: 348, interv: 0 },
        initDate: { day: 344, interv: 0 },
        finalDate: { day: 350, interv: 0 },
        drawDate: { day: 348, interv: 150 },
        isNeutral: true,
        isIV: false,
        thereIsDraw: false,
        rankMinValue: 31,
        bombos: [
          { cant: 2, selectionPerTime: 1 }, // siempre es uno
        ],
        drawRulesValidate: [],
        roundHalfWeeks: [ // cambiar a round
          [103, 103],
        ],
        roundHalfWeeksSchedule: [
          101
        ],
      }
    }
  }
]

export default {
  tournamentconfig: configExample,
  stages: stagesExample,
  participantsRank: selection, // el numero de parts debe ser igual a la suma de participantsNumber.news de cada stage
}