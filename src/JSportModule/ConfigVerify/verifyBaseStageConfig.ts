import { TypeHalfWeekOfYear } from "../../JCalendar/JDateTimeModule";
import robinRoundSchedulingFunction from "../../Tournament/Stage/StageGroup/League/RoundRobin"; // ojo con esta import
import { arr2, IBaseStageConfig, ILeagueConfig, ISingleElminationConfig } from "../data";

export function verifyBaseStageConfig(config: IBaseStageConfig): boolean {
  const aux = config as ISingleElminationConfig;
  if (aux.roundsNumber) {
    const seConfig = config as ISingleElminationConfig;
    return verifySingleEliminationConfig(seConfig);
  } else {
    const lConfig = config as ILeagueConfig;
    return verifyLeagueConfig(lConfig);
  }
}

/********************************************************************************************************************************
 * Se deben realizar las siguientes verificaciones:
 * * existe sch para la cantidad de participants
 * * la cantidad de halfweeks asignada para cada turn coincide con la cantidad de turns que corresponde
 * * la cantidad de halfweeks asignada para la programacion de cada turn coincide con la cantidad de turns que corresponde
 * * cada turn es asignada antes de que se juege.
 */
function verifyLeagueConfig(config: ILeagueConfig): boolean {
  if (
    config.participantsNumber < 2 ||
    config.participantsNumber > 20 ||
    !Number.isInteger(config.participantsNumber)
  ) {
    throw new Error(`no existe sch para el valor: ${config.participantsNumber}`);
  }
  let sch: arr2<number>[][] = robinRoundSchedulingFunction(
    config.participantsNumber,
    config.opt,
  );
  if (sch.length !== config.turnHalfWeeks.length) {
    throw new Error(`cantidad de wks incorrecta
    se esperaban: ${sch.length} y se presentan: ${config.turnHalfWeeks.length}`);
  }
  if (config.turnHalfWeeks.length !== config.turnHalfWeeksSchedule.length) {
    throw new Error(`cantidad de wks de assignation incorrecta
    se esperaban: ${config.turnHalfWeeks.length} y se presentan: ${config.turnHalfWeeksSchedule.length}`);
  }

  config.turnHalfWeeks.forEach((e: TypeHalfWeekOfYear, idx: number) => {
    if (config.turnHalfWeeksSchedule[idx] > e) {
      throw new Error(`La fecha (turn) debe programarse antes de la hw prevista para jugarse.
      turnHalfWeeksSchedule: ${config.turnHalfWeeksSchedule[idx]},
      fecha prevista de juego (roundHalfWeeks): ${e}`)
    }
  })
  return true;
}
/********************************************************************************************************************************
 * Se deben realizar las siguientes verificaciones
 * * la cantidad de rounds es compatible con la cantidad de participants
 * * la cantidad de halfweeks asignada para cada round coincide con la cantidad de rounds que corresponde
 * * la cantidad de halfweeks asignada para la programacion de cada round coincide con la cantidad de rounds que corresponde
 * * cada round es creada y asignada antes de que se juege y luego de que termine la ronda anterior
 */
function verifySingleEliminationConfig(config: ISingleElminationConfig): boolean {
  if (maxNumberRound(config.participantsNumber) < config.roundsNumber) {
    throw new Error(`la cantidad de rounds: ${config.roundsNumber} es
    mayor a la cantidad posible de rounds: ${maxNumberRound(config.participantsNumber)} para la cantidad de
    participants: ${config.participantsNumber}`)
  }
  if (config.roundsNumber !== config.roundHalfWeeks.length) {
    throw new Error(`cantidad de wks(arr2) incorrecta
    se esperaban: ${config.roundsNumber} y se presentan: ${config.roundHalfWeeks.length}`);
  }
  if (config.roundHalfWeeks.length !== config.roundHalfWeeksSchedule.length) {
    throw new Error(`cantidad de wks de assignation incorrecta
    se esperaban: ${config.roundHalfWeeks.length} y se presentan: ${config.roundHalfWeeksSchedule.length}`);
  }

  config.roundHalfWeeks.forEach((e: arr2<TypeHalfWeekOfYear>, idx: number, arr: arr2<TypeHalfWeekOfYear>[]) => {
    // console.log('roundHalfWeeksSchedule', config.roundHalfWeeksSchedule[idx])
    // console.log('roundHalfWeeks', e[0], e[1])
    // console.log()
    if (config.roundHalfWeeksSchedule[idx] > e[0]) {
      throw new Error(`La ronda debe programarse antes de la hw prevista para jugarse.
      roundHalfWeeksSchedule: ${config.roundHalfWeeksSchedule[idx]},
      fecha prevista (roundHalfWeeks): ${e}`)
    }
    if (idx > 0) {
      // console.log(` `, idx)
      if (config.roundHalfWeeksSchedule[idx] < arr[idx - 1][1]) {
        throw new Error(
      `La ronda debe programarse despues de la hw prevista para jugarse la ronda anterior (es decir luego que termine la ronda anterior).
      fecha prevista fin (roundHalfWeeks) de la ronda ${idx} es: ${arr[idx - 1][1]},
      roundHalfWeeksSchedule de la ronda ${idx + 1} es: ${config.roundHalfWeeksSchedule[idx]}`)
      }
    }
    // console.log(`******************************************************************************`)
  })
  return true;
}

function maxNumberRound(partsNumber: number): number {
  let out: number = 0;
  while ((partsNumber % 2) === 0) {
    out++;
    partsNumber /= 2;
  }
  return out;
}