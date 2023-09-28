
import { getStageGenericRank, getStagesOfTournament, getTournamentGenericRank, IPhaseConfig, IStageConfig, ITournamentConfig } from "../data";
import { verifyPhaseConfig } from "./verifyPhaseConfig";

export function verifyTournamentConfig(config: ITournamentConfig): boolean {
  // verificar el inicio y fin de las phases luego que se puede determinar sus halfWeekOfStartDate y halfWeekOfEndDate
  config.phases.forEach((ipc: IPhaseConfig) => {
    if (ipc.hwStart < config.hwStart) {
      throw new Error(`La phase ${ipc.idConfig} comienza antes (${ipc.hwStart})
      que el tournament: ${config.idConfig} comience (${config.hwStart})`)
    }
    if (ipc.hwEnd > config.hwEnd) {
      throw new Error(`La phase ${ipc.idConfig} termina luego (${ipc.hwEnd})
      que el tournament: ${config.idConfig} termine (${config.hwEnd})`)
    }
  })

  for (let i = 1; i < config.phases.length; i++) {
    const prevP = config.phases[i - 1];
    const nextP = config.phases[i]
    if (prevP.hwEnd >= nextP.hwStart) {
      throw new Error(`la phase ${prevP.n} termina despues (hw = ${prevP.hwEnd})
      de que la phase ${nextP.n} comienze (hw = ${nextP.hwStart}).
      (Tournament.constructor)`)
    }
  }

  // verifico el tamaño de las fuentes de las stages dentro del tournament
  const stages: IStageConfig[] = getStagesOfTournament(config);
  stages.forEach((stageConfig: IStageConfig, _, arr: IStageConfig[]) => {
    stageConfig.qualifyConditions.forEach((tq) => {
      // para cada fuente de stageConfig verifico si esa fuente esta dentro del tournament
      const sourceStage = arr.find(e => tq.rankId.slice(3, 80) == e.idConfig);
      if (sourceStage) { // esta dentro del tournament
        if (tq.maxRankPos > getStageGenericRank(sourceStage).list.length) {
          throw new Error(`
            La stage ${stageConfig.idConfig} necesita que hayan al menos ${tq.maxRankPos} elementos en su source: ${sourceStage.idConfig}.
            En la stage ${sourceStage.idConfig} solo genera/participan ${getStageGenericRank(sourceStage).list.length} en total.`)
        }
      }
    })

  })

  getTournamentGenericRank(config);

  //
  config.phases.forEach((p : IPhaseConfig) => verifyPhaseConfig(p))

  return true;
}