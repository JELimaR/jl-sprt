
import { createGSG, TInitialCreator, TPhaseCreator } from "../../JSportModule/GeneralStageGraph/GSGCreators";
import { TypeCategory } from "../../jl-sprt-core";

export function leaguePhaseArr(): TPhaseCreator[] {

  const phaseArr: TPhaseCreator[] = [
    {
      id: 1,
      stages: [{ count: 1, stage: { type: "group", opt: "h&a", value: 1 } }],
    },
  ];

  return phaseArr
}

function leagueInit(FED_ID: string, N: number, posOffset: number, division: number, category: TypeCategory): TInitialCreator {

  const iniCreator: TInitialCreator = {
    tournamentId: `${category}_F001_D${String(division).padStart(2, '0')}`,
    qualyrankList: Array.from({ length: N }, (_, i) => ({
      origin: `fr_${category}_${FED_ID}`,
      pos: posOffset + i + 1,
    })),
    rankGroupNumbers: [N]
  };

  return iniCreator;
  
}