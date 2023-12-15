
import { TypeHalfWeekOfYear } from "../../JCalendar/JDateTimeModule";
import { arr2, TypeBaseStageOption } from "../data";
import { IGenericRankItem } from "../data/Ranking/interfaces";
import { Ranking } from "../data/Ranking/Ranking";
import { GeneralStageGraph } from "./GeneralStageGraph";
import { IStageNodeData, StageNode } from "./nodes";

export interface IRealStageNodeData extends IStageNodeData {
  opt: TypeBaseStageOption;
  bombos?: number[];
  draw?: true;
  // rank
}
export abstract class RealStageNode<D extends IRealStageNodeData> extends StageNode<D> {
  constructor(data: D) {
    super(data);
  }

  abstract getHwsNumber(): number;
  abstract getHwsFromList(list: TypeHalfWeekOfYear[]): arr2<TypeHalfWeekOfYear>[] | TypeHalfWeekOfYear[];

  // /**
  //  * 
  //  */
  // getRelativeRanking(_: GeneralStageGraph): Ranking[] {
  //   let out: Ranking[] = [];

  //   let current = 0;
  //   this.getRanksGroups().forEach((value: number) => {
  //     const items: IGenericRankItem[] = [];
  //     for (let i = current; i < current + value; i++) items.push({ origin: this.getId(), pos: i + 1 });
  //     const rank = Ranking.fromTypeRanking({ context: 'sr_' + this.getId(), items, teams: [] });

  //     out.push(rank);
  //     current += value;
  //   })

  //   return out;
  // }
  getRanksGroups(): Ranking[] {
    let current = 0;
    
    return this.getRanksGroupNumbers().map((n: number) => {
      const curr_aux = current;
      current += n;
      return Ranking.fromQualyCondition({
        rankId: 'rs_' + this.getId(),
        season: 'current',
        minRankPos: curr_aux + 1,
        maxRankPos: curr_aux + n,
      })
    })
  }

  abstract getRanksGroupNumbers(): number[];
}
/**
 * GROUP
 */
export interface IStageGroupNodeData extends IRealStageNodeData {
  groupsNumber: number;
}
export class StageGroupNode extends RealStageNode<IStageGroupNodeData> {
  constructor(data: IStageGroupNodeData) {
    super(data);
    // bien definido si no da errror
    calculateParticipantsPerGroupArray(this.data.participants, this.data.groupsNumber);
  }
  
  getParticipantsPerGroup(): number[] {
    return calculateParticipantsPerGroupArray(this.data.participants, this.data.groupsNumber);
  }

  getRanksGroupNumbers(): number[] {
    let out: number[] = [];
    const ppg = [...this.getParticipantsPerGroup()];
    for (let p = 0; p < ppg[0]; p++) {
      out[p] = 0;
      ppg.forEach((partsInGroup: number, gidx: number) => {
        if (p < partsInGroup) out[p]++;
      })
    }
    return out;
  }

  getHwsNumber(): number {
    let out = 0;
    out = this.getParticipantsPerGroup()[0];
    out = (out % 2 == 0) ? out - 1 : out;
    if (this.data.opt == 'h&a') out *= 2;
    return out;
  }

  getHwsFromList(list: TypeHalfWeekOfYear[]): TypeHalfWeekOfYear[] {
    return list;
  }
}
/**
 * PLAYOFF
 */
export interface IStagePlayoffNodeData extends IRealStageNodeData {
  roundsNumber: number;
}
export class StagePlayoffNode extends RealStageNode<IStagePlayoffNodeData> {
  constructor(data: IStagePlayoffNodeData) {
    super(data);
    // bien definido si:
    if (Math.trunc(data.participants / 2 ** data.roundsNumber) !== (data.participants / 2 ** data.roundsNumber))
      throw new Error(`no puede haber ${data.roundsNumber} rounds
      para la cantidad de participantes proporcionada: ${data.participants}.
      stage: ${this.getId()}`)
  }

  getRanksGroupNumbers(): number[] {
    let out: number[] = [];
    let ws = this.data.participants / 2;
    for (let r = 0; r < this.data.roundsNumber; r++) {
      out.unshift(ws);
      ws /= 2;
    }
    out.unshift(out[0]);
    return out;
  }

  getHwsNumber(): number {
    let out = this.data.roundsNumber;
    if (this.data.opt == 'h&a') out *= 2;
    return out;
  }

  getHwsFromList(list: TypeHalfWeekOfYear[]): arr2<TypeHalfWeekOfYear>[] {
    const out: arr2<TypeHalfWeekOfYear>[] = [];

    if (this.data.opt !== 'h&a') {
      for (let i = 0; i < list.length; i++) {
        out.push([list[i], list[i]]);
      }
    } else {
      for (let i = 0; i < list.length; i += 2) {
        out.push([list[i], list[i + 1]]);
      }
    }

    return out;
  }

  getSchedHwsFromList(list: TypeHalfWeekOfYear[]): TypeHalfWeekOfYear[] {
    const out: TypeHalfWeekOfYear[] = [];

    if (this.data.opt !== 'h&a') {
      for (let i = 0; i < list.length; i++) {
        out.push(list[i]);
      }
    } else {
      for (let i = 0; i < list.length; i += 2) {
        out.push(list[i]);
      }
    }

    return out;
  }
}
/****************************************************************************************************************************************** */

export const calculateParticipantsPerGroupArray = (pn: number, gn: number): number[] => {
  if (pn / gn < 3) throw new Error(`parts number: ${pn} and groups: ${gn}. Pocos participantes por grupo (menos de 3)`)
  if (pn / gn > 20) throw new Error(`parts number: ${pn} and groups: ${gn}. Muchos participantes por grupo (mas de 20)`)
  let out: number[] = [];

  const divUp = Math.ceil(pn / gn);
  const divDown = Math.floor(pn / gn);
  // console.log('div up', divUp);
  // console.log('div down', divDown);

  let total = pn;
  if (divDown !== divUp) {
    if (divUp % 2 !== 0) throw new Error(`no puede haber gr de ${divUp} y de ${divDown} en un mismo stagegroup`)
    total = total - divUp;
    out.push(divUp);
    while (total % divDown !== 0) {
      total = total - divUp;
      out.push(divUp);
    }
  }
  while (total !== 0) {
    total = total - divDown;
    out.push(divDown);
  }

  // console.log(out);

  return out;
}