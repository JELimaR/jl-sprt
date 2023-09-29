import { TypeBaseStageOption } from "./JSportModule";
import { StageNode } from "./nodes";

export abstract class RealStageNode extends StageNode {
  constructor(
    sid: string,
    participants: number,
    public opt: TypeBaseStageOption,
  ) {
    super(sid, participants);
  }
}

export class StageGroupNode extends RealStageNode {
  constructor(
    sid: string,
    participants: number,
    opt: TypeBaseStageOption,
    public groupsNumber: number,
  ) {
    super(sid, participants, opt);
    // bien definido si no da errror
    calculateParticipantsPerGroupArray(this.participants, this.groupsNumber);
  }

  getParticipantsPerGroup(): number[] {
    return calculateParticipantsPerGroupArray(this.participants, this.groupsNumber);
  }

  getRanksGroups(): number[] {
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
    if (this.opt == 'h&a') out *= 2;
    return out;
  }
}

export class StagePlayoffNode extends RealStageNode {
  constructor(
    sid: string,
    participants: number,
    opt: TypeBaseStageOption,
    public roundsNumber: number,
  ) {
    super(sid, participants, opt);
    // bien definido si:
    if (Math.trunc(participants / 2 ** this.roundsNumber) !== (participants / 2 ** this.roundsNumber))
      throw new Error(`no se puede haber ${roundsNumber} rounds
      para la cantidad de participantes proporcionada: ${participants}`)
  }

  getRanksGroups(): number[] {
    let out: number[] = [];
    let ws = this.participants / 2;
    for (let r = 0; r < this.roundsNumber; r++) {
      out.unshift(ws);
      ws /= 2;
    }
    out.unshift(out[0]);
    return out;
  }

  getHwsNumber(): number {
    let out = this.roundsNumber;
    if (this.opt == 'h&a') out *= 2;
    return out;
  }
}
/****************************************************************************************************************************************** */




export const calculateParticipantsPerGroupArray = (pn: number, gn: number): number[] => {
  if (pn / gn < 3) throw new Error(`parts number: ${pn} and groups: ${gn}`)
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