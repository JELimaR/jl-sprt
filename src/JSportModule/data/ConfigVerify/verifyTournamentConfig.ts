
import { getStageGenericRank, getStagesOfTournament, getTournamentGenericRank, IPhaseConfig, IStageConfig, ITournamentConfig } from "../../data";
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
    if (prevP.hwEnd > nextP.hwStart) {
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
        if (tq.maxRankPos > getStageGenericRank(sourceStage).length) {
          throw new Error(`
            La stage ${stageConfig.idConfig} necesita que hayan al menos ${tq.maxRankPos} elementos en su source: ${sourceStage.idConfig}.
            En la stage ${sourceStage.idConfig} solo genera/participan ${getStageGenericRank(sourceStage).length} en total.`)
        }

        // Orden temporal fuente -> consumidor (evita F2/F6, ver docs/plans/RUNTIME_VALIDATIONS.md):
        // el stage que PRODUCE el ranking (`rs_<sourceStage>`) debe TERMINAR antes de que
        // ARRANQUE el stage que lo consume. Si no, cuando se dispare Event_StageStart del
        // consumidor, `rs_<sourceStage>` todavía no fue escrito por Event_StageEnd y lanza
        // "No existe ranking". La verificación de fases ya cubre el orden entre fases, pero
        // esto ata el hwEnd concreto de la fuente al hwStart concreto del consumidor.
        if (tq.rankId.startsWith('rs_') && sourceStage.hwEnd >= stageConfig.hwStart) {
          throw new Error(
            `La stage ${stageConfig.idConfig} (hwStart=${stageConfig.hwStart}) consume el ` +
            `ranking de ${sourceStage.idConfig}, pero esa fuente termina en hwEnd=${sourceStage.hwEnd}, ` +
            `que NO es anterior al inicio del consumidor. La fuente debe terminar antes de que ` +
            `arranque el stage que la consume. (verifyTournamentConfig)`
          )
        }
      }
    })

  })

  // getTournamentGenericRank(config);

  //
  config.phases.forEach((p : IPhaseConfig) => verifyPhaseConfig(p))

  return true;
}