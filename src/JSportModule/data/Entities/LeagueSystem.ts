
// cambiar league system por division system

import { createStandardGSGDataFromNParticipants } from "../../GeneralStageGraph/createStandardGSGDataFromNParticipants";
import { TPhaseCreator } from "../../GeneralStageGraph/GSGCreators";
import { calcParticipantsNumber, ITournamentFromGSGData, tournamentFromGSG } from "../../GeneralStageGraph/tournamentFromGSG";
import { IGenericRankItem } from "../../interfaces";
import { TypeCategory } from "../types";
import { verifyDivisionArr } from "./verifyLeagueSystem";

export interface ILevelConfig {
  level: number;
  fromGSGData: ITournamentFromGSGData; 
}

export interface ICupSystemCreator {
  category: TypeCategory;
  cups: ILevelConfig[];
}

export class CupSystem {
  _category: TypeCategory;
  _competitions: ILevelConfig[] = [];

  constructor(icsc: ICupSystemCreator) {
    this._category = icsc.category;
    this._competitions = icsc.cups;
  }
}

/**************************************************************************************************************** */
/** */
export interface IDivisionCondition {
  N: number;
  r: number;
  p: number;
  // pr: number;
  // pp: number;
}
export interface IDivisionConfig extends ILevelConfig {
  condition: IDivisionCondition;
  // preRelegateNumber: number;
  // prePromoteNumber: number;
}

export interface ILeagueSystemCreator {
  category: TypeCategory;
  isTransition: boolean;
  divisions: IDivisionConfig[];
  // postRegular: IDivisionConfig[];
}

// hay uno por season
export default class LeagueSystem {

  _isTransition: boolean;
  _category: TypeCategory;
  _competitions: IDivisionConfig[] = [];
  // _postSeason: IDivisionConfig[] = [];

  constructor(ilsc: ILeagueSystemCreator) {
    verifyDivisionArr(ilsc.divisions, ilsc.isTransition)
    this._category = ilsc.category;
    this._competitions = ilsc.divisions;
    this._isTransition = ilsc.isTransition;
    // actualizo los qualyRules con los promotes y relegates
    this._competitions = this._competitions.map((idc: IDivisionConfig, idx: number) => {
      let participantsNumber = idc.condition.N;
      const qualyList = [...idc.fromGSGData.qualyRules];
      // debe haber un campeon
      qualyList.push({ minRankPos: 1, maxRankPos: 1 })
      // ascensos directos
      if (idx != 0) {
        qualyList.push({ minRankPos: 1, maxRankPos: idc.condition.p })
      }
      // descensos directos
      if (idx < this._competitions.length - 1) {
        qualyList.push({ minRankPos: participantsNumber - idc.condition.r + 1, maxRankPos: participantsNumber })
      }
      idc = {
        ...idc,
        fromGSGData: {
          ...idc.fromGSGData,
          qualyRules: qualyList
        }
      }
      tournamentFromGSG(idc.fromGSGData)
      return idc;
    })
  }

  getDivisionConfigList(): IDivisionConfig[] {
    return [...this._competitions]
  }

  getTeamsCount(): number {
    let out: number = 0;
    this._competitions.forEach(idc => out += idc.condition.N)
    return out;
  }

  getGenericRankOrdered() {
    let out: IGenericRankItem[] = []
    this._competitions.forEach((idc: IDivisionConfig) => {
      out.push(
        ...idc.fromGSGData.gsgData.initialCreator.qualyrankList
      )
    })
    return out;
  }

  static getLeagueSystemTransitionCondition(prev: IDivisionCondition[], next: IDivisionCondition[]): IDivisionCondition[] {
    const D1 = prev.length;
    const D2 = next.length;
    const D = Math.min(D1, D2)
    for (let d = 0; d < D - 1; d++) {
      if (prev[d].N / next[d].N > 1.4 || next[d].N / prev[d].N > 1.4) {
        console.log('prev', prev)
        console.log('next', next)
        throw new Error(`El cociente entre N1 (${prev[d].N}) y N2 (${next[d].N}) debe ser mayor a 1.4
        [N1/N2] y [N2/N1]
        En LeagueSystem.getLeagueSystemTransitionCondition`)
      }
    }
    let transition: IDivisionCondition[] = [];
    prev.forEach((idc: IDivisionCondition) => transition.push({
      N: idc.N,
      p: idc.p,
      // pp: idc.pp,
      // pr: idc.pr,
      r: 0
    }))

    /**
     * Se denotara por N el nivel en consideracion, L el nivel superior y M el nivel inferior
     * Luego 1 se refiere al LS previo, t al de transicion y 2 al final o next
     * La cantidad de part en N2 es
     * + la cantidad de part en Nt
     * + el factor de interaccion con el nivel superior (los que vienen desde arriba menos los que van hacia arriba: Lr - Np)
     * + el factor de interaccion con el nivel inferior (los que vienen desde abajo menos los que van hacia abajo: Mp - Nr)
     * N2 = Nt + (Lr - Np) + (Mp - Nr) -> en cada ecuacion tenemos 2 ingognitas,
     *                                    por tanto definimos que cada Np de t sea igual al Np de 1
     * Despejo entonces Nr para calcularlo en cada d => Nr = (Nt - N2) + Mp + (Lr - Np)
     */
    for (let d = 0; d < D1; d++) {
      const Nt = prev[d].N;
      const N2 = next[d] ? next[d].N : 0;
      let Mp = d + 1 < D1 ? transition[d + 1].p : 0;
      const Lr = d - 1 >= 0 ? transition[d - 1].r : 0;
      const Np = transition[d].p;
      let Nr = (Nt - N2) + Mp + (Lr - Np);
      if (d > D2 - 2) {
        // en caso que la division d sea mayor a la cantidad de divisiones de next: no hay descensos y todos son ascensos
        Nr = 0
        Mp = Nt;
      } else if (d == D1 - 1) {
        // en caso que la division d sea la ultima a la cantidad de divisiones de prev: no hay descensos
        Nr = 0
      } else {
        // en caso que Nr resulte negativo, ajustamos el valor  de Mp
        if (Nr <= 0) {
          const mustBe = d - 1 == D1 ? 0 : Math.round(Nt / 15)
          Mp += mustBe - Nr;
          Nr = (Nt - N2) + Mp + (Lr - Np);
        }
      }

      transition[d].r = Nr;
      if (d + 1 < D1)
        transition[d + 1].p = Mp
    }
    // verificamos 
    const arr = transition.map((condition: IDivisionCondition, idx: number) => {
      const idconfig: IDivisionConfig = {
        level: idx + 1,
        condition: {
          ...condition
        },
        fromGSGData: createStandardGSGDataFromNParticipants(condition.N)
      }
      // console.log(idconfig.fromGSGData.gsgData.phaseArr.map(p => p.stages.map(s => s.count)))
      return idconfig
    })
    verifyDivisionArr(arr, true)

    return transition

  }

}


