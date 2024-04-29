import { TypeHalfWeekOfYear } from "../../JCalendar"
import { ITournamentFromGSGData } from "./tournamentFromGSG"

export function createStandardGSGDataFromNParticipants(N: number): ITournamentFromGSGData {
  return {
    name: 'none',
    gsgData: {
      initialCreator: {
        tournamentId: 'none_id',
        qualyrankList: [...Array(N).keys()].map(i => {
          return { origin: 'none', pos: i + 1 }
        }),
        rankGroupNumbers: [...Array(N).keys()].map((_) => 1)
      },
      phaseArr: [{
        id: 1,
        stages: [{ count: N, stage: { type: "group", opt: 'neutral', value: Math.round(N / 10) } }]
      }]
    },
    matchList: [...Array(N).keys()].map(i => i + 2 as TypeHalfWeekOfYear),
    schedList: [...Array(N).keys()].map(i => i + 1 as TypeHalfWeekOfYear),
    qualyRules: []
  }
}