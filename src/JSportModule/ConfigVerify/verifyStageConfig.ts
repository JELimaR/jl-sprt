import { TypeHalfWeekOfYear } from "../../JCalendar/JDateTimeModule";
import { arr2, getStageGenericRank, getStageGenericSource, ILeagueConfig, IStageConfig, IStageGroupConfig, IStagePlayoffConfig, TQualyCondition } from "../data";
import { sizeGeneric } from "../interfaces";
import { verifyLeagueConfig, verifySingleEliminationConfig } from "./verifyBaseStageConfig";

/*export */function verifyStageConfig(config: IStageConfig): boolean { // quitar el export
  if (config.hwStart > config.hwEnd) {
    throw new Error(`La fecha de start ${config.hwStart} debe ser menor a la de end ${config.hwEnd}.
    (Stage.constructor)`)
  }
  // fechas
  // llevar esto a una funcion aparte
  let halfWeekOfMatches: TypeHalfWeekOfYear[] = [];
  let halfweekOfSchedule: TypeHalfWeekOfYear[] = [];
  if (config.type == 'playoff') {
    const spConfig = config as IStagePlayoffConfig;
    spConfig.bsConfig.roundHalfWeeks.forEach((value: arr2<TypeHalfWeekOfYear>) => {
      halfWeekOfMatches.push(value[0]);
      if (spConfig.bsConfig.opt == 'h&a') halfWeekOfMatches.push(value[1]);
    })
    halfweekOfSchedule = [...spConfig.bsConfig.roundHalfWeeksSchedule];
  } else {
    const sgConfig = config as IStageGroupConfig;
    halfWeekOfMatches = [...sgConfig.bsConfig.turnHalfWeeks]
    halfweekOfSchedule = [...sgConfig.bsConfig.turnHalfWeeksSchedule];
  }

  for (let i = 0; i < halfWeekOfMatches.length; i++) {
    const j = (config.type == 'playoff' && config.bsConfig.opt == 'h&a') ? Math.trunc(i / 2) : i;
    // cada turn o round debe ser programada antes de que se juegue
    if (halfWeekOfMatches[i] < halfweekOfSchedule[j]) {
      throw new Error(
        `no se cumple que halfWeekOfMatches (${halfWeekOfMatches[i]}) es menor a halfweekOfSchedule (${halfweekOfSchedule[i]}).
        Para ${config.idConfig}. (Stage.constructor)`
      )
    }
    // cada turn o round debe jugarse despues del inicio y antes del fin de la stage
    if (halfWeekOfMatches[i] < config.hwStart || halfWeekOfMatches[i] > config.hwEnd) {
      throw new Error(
        `la hw Of Match ${halfWeekOfMatches[i]} debe estar entre la hw of start ${config.hwStart} y la hw of end ${config.hwEnd}.
        Para ${config.idConfig}. (Stage.constructor)`
      )
    }

    // cada turn o round debe ser programada despues del inicio y antes del fin de la stage
    if (halfweekOfSchedule[i] < config.hwStart || halfweekOfSchedule[i] > config.hwEnd) {
      throw new Error(
        `la hw Of schedule ${halfweekOfSchedule[i]} debe estar entre la hw of start ${config.hwStart} y la hw of end ${config.hwEnd}.
        Para ${config.idConfig}. (Stage.constructor)`
      )
    }
  }

  // no debe haber fechas de matches repetidas
  if (halfWeekOfMatches.length !== new Set(halfWeekOfMatches).size) {
    throw new Error(`No pueden haber hw of matches repetidas:
    ${halfWeekOfMatches} - En ${config.idConfig}.
    (Stage.constructor)`)
  }

  // la suma de clasificados a la stage debe coincidir con los participantes de los bombos!
  let sumRankingQualies = 0;
  config.qualifyConditions.forEach((qc: TQualyCondition) => sumRankingQualies += qc.maxRankPos - qc.minRankPos + 1);
  let bomboParticipantsCount = 0;
  config.bombos.forEach((b: number) => bomboParticipantsCount += b);
  if (sumRankingQualies !== bomboParticipantsCount) {
    throw new Error(`no coinciden ${sumRankingQualies} y ${bomboParticipantsCount} (Stage.constructor)`)
  }

  // el tamaño del GenericRank de la stage debe ser igual al tamaño del SourceRank
  if (sizeGeneric(getStageGenericSource(config)) !== sizeGeneric(getStageGenericRank(config))) {
    throw new Error(`
    el tamaño del GenericRank (${sizeGeneric(getStageGenericSource(config))}) de la stage
    debe ser igual al tamaño del SourceRank (${sizeGeneric(getStageGenericRank(config))}). (verifyStageConfig)`)
  }

  return true;
}
/**********************************************************************************************************************************************************************
 * 
 */
export function verifyStageGroupConfig(config: IStageGroupConfig): boolean {
  verifyStageConfig(config);

  let groupsParticipantsCount = 0;
  config.participantsPerGroup.forEach((g) => groupsParticipantsCount += g);
  let bomboParticipantsCount = 0;
  config.bombos.forEach((b: number) => bomboParticipantsCount += b)

  if (bomboParticipantsCount !== groupsParticipantsCount) {
    throw new Error(`En StageGroup constructor:
    La cantidad de participantes de los grupos ${groupsParticipantsCount} no coincide con la cantidad definida por los bombos ${bomboParticipantsCount}`)
  }

  config.participantsPerGroup.forEach((gp: number) => {
    const gConfig: ILeagueConfig = {
      ...config.bsConfig,
      participantsNumber: gp,
    }
    verifyLeagueConfig(gConfig);
  })

  return true;
}

/**********************************************************************************************************************************************************************
 * 
 */
export function verifyStagePlayoffConfig(config: IStagePlayoffConfig): boolean {
  verifyStageConfig(config);
  verifySingleEliminationConfig(config.bsConfig);
  return true;
}