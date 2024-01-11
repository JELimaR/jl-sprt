
import { getPhaseRankToGenerateIds, getPhaseSourceIds, IPhaseConfig, IStageConfig } from "../../data";

export function verifyPhaseConfig(config: IPhaseConfig): boolean {
  // las stages deben comenzar luego del comienzo de la phase
  // las stages deben terminar antes del fin de la phase
  config.stages.forEach((stageConfig: IStageConfig) => {
    if (stageConfig.hwStart < config.hwStart) {
      throw new Error(`La stage ${stageConfig.idConfig} comienza antes (${stageConfig.hwStart})
      que la phase: ${config.idConfig} comienza (${stageConfig.hwStart})`)
    }
    if (stageConfig.hwEnd > config.hwEnd) {
      throw new Error(`La stage ${stageConfig.idConfig} termina despues (${stageConfig.hwEnd})
      que que la phase: ${config.idConfig} termina (${config.hwEnd})`)
    }
  })
  // las stages de la phase no pueden depender de otras stages de la phase
  // por tanto, en las ranksToGenerateIds no pueden haber elementos de sourcesIds
  // HACER ESTA VERIFICACION EN TOURNAMENT Y LUEGO MÁS ARRIBA
  const ranksToGenerateIds = getPhaseRankToGenerateIds(config);
  const sourcesIds = getPhaseSourceIds(config);
  const duplicates = sourcesIds.filter((rd: string) => ranksToGenerateIds.includes(rd));
  if (duplicates.length > 0) {
    throw new Error(`
      Dentro de la Phase ${config.idConfig}, eexistenxisten dependencias internas entre las stages: ${duplicates.toString()}
    `)
  }

  return true;
}
/**********************************************************************************************************************************************************************
 * 
 */
// export function verifySortedStagesPhaseConfig(config: ISortedStagesPhaseConfig): boolean {
//   return true;
// }

/**********************************************************************************************************************************************************************
 * 
 */
// export function verifyParallelStagesPhaseConfig(config: IParallelStagesPhaseConfig): boolean {
//   return true;
// }