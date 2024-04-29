import { calcParticipantsNumber, tournamentFromGSG } from "../../GeneralStageGraph/tournamentFromGSG";
import { IDivisionConfig, ILevelConfig } from "./LeagueSystem";

export const verifyCompetitionOrder = (arr: ILevelConfig[]) => {
  // let out = arr.sort((a, b) => a.level - b.level);
  // for (let l = 1; l < out.length; l++) {
  //   const minorLevel = out[l - 1].fromGSGData.gsgData.initialCreator.qualyrankList;
  //   const mayorLevel = out[l].fromGSGData.gsgData.initialCreator.qualyrankList;
  //   if (minorLevel[0].pos > mayorLevel[0].pos) {
  //     throw new Error(`
  //     En verifyLeagueSystem.verifyCompetitionOrder`)
  //   }
  // }
}

export const verifyDivisionArr = (divisions: IDivisionConfig[], isTransition: boolean) => {
  verifyCompetitionOrder(divisions)
  divisions.forEach((idc: IDivisionConfig, i: number) => {
    // tournamentFromGSG(idc.fromGSGData)
    // verifico la cantidad de participantes del GSGData
    const participants = idc.condition.N;
    // if (participants !== calcParticipantsNumber(idc.fromGSGData)) {
    //   console.log(idc)
    //   throw new Error(`En la divisionConfig el tournamentFromGSGData es para ${calcParticipantsNumber(idc.fromGSGData)} teams
    //   y debe ser para ${idc.participantsNumber}
    //   En verifyLeagueSystem.verifyDivisionArr`)
    // }
    const promoteCount = idc.condition.p //+ idc.prePromoteNumber;
    const relegateCount = idc.condition.r // + idc.preRelegateNumber;
    if (!(promoteCount + relegateCount <= participants)) {
      throw new Error(`La suma de (promoteCount + relegateCount) ${promoteCount + relegateCount}
      debe ser menor a la cantidad de participantes: ${participants}
      En verifyLeagueSystem.verifyDivisionArr`)
    }

    // veririfico los ascensos y descensos
    // en el primer nivel no hay ascensos
    if (i == 0) {
      if (promoteCount != 0) {
        throw new Error(`en el primer nivel no hay ascensos
        En verifyLeagueSystem.verifyDivisionArr`)
      }
      // en niveles intermedios debe haber ascensos y descensos
    } else if (i != divisions.length - 1) {
      if (promoteCount == 0 || relegateCount == 0 && !isTransition) {
        throw new Error(`en niveles intermedios debe haber ascensos y descensos
        En verifyLeagueSystem.verifyDivisionArr`)
      }
      // en el ultimo nivel no hay descensos
    } else {
      if (relegateCount != 0) {
        throw new Error(`en el ultimo nivel no hay descensos
        En verifyLeagueSystem.verifyDivisionArr`)
      }
    }
  })

  // verifico que conicidan las cantdades de ascenso y descenso
  // cuando es un ls de transicion, no tienen que ser iguales los:
  // divisions[i].promoteNumber y divisions[i-1].relegateNumber;
  if (divisions.length > 1) {
    for (let i = 1; i < divisions.length; i++) {
      const promote = divisions[i].condition.p;
      const relegate = divisions[i - 1].condition.r;
      if (promote != relegate && !isTransition) {
        throw new Error(`La cantidad de relegate: ${relegate} de nivel ${i}
        no coincide con la cantidad de promote: ${promote} del nivel ${i + 1}.
        En verifyLeagueSystem.verifyDivisionArr`)
      }
      // const prePromote = divisions[i].prePromoteNumber;
      // const preRelegate = divisions[i - 1].preRelegateNumber;
      // if (prePromote != preRelegate) {
      //   throw new Error(`La cantidad de preRelegate: ${preRelegate} de nivel ${i}
      //   no coincide con la cantidad de prePromote: ${prePromote} del nivel ${i + 1}.
      //   En verifyLeagueSystem.verifyDivisionArr`)
      // }
    }
  }

  // verifico que la cantidad de aprticipantes sea menor o igual a la cantidad de relegates + promotes
  divisions.forEach((idc: IDivisionConfig, i: number) => {
    const participants = idc.condition.N//calcParticipantsNumber(idc.fromGSGData)
    // const sumPR = idc.promoteNumber + idc.prePromoteNumber + idc.preRelegateNumber + idc.relegateNumber;
    const sumPR = idc.condition.p + idc.condition.r;
    if (participants < sumPR) {
      throw new Error(`La cantidad de participantes en el nivel ${i} = ${participants} debe ser mayor o como mucho igual
      a la suma ${sumPR} de la cantidad de ascensos y descensos
      En verifyLeagueSystem.verifyDivisionArr`)
    }
  })
}