import { CollectionsUtilsFunctions } from 'jl-utlts';
import LB, { ILBConfig } from './Basics/LB';
import { TypeHalfWeekOfYear } from './Logica/Calendar/types';

const CUF = CollectionsUtilsFunctions.getInstance();

let teamsList: string[] = [];
for (let i = 1; i <= 70; i++) {
  teamsList.push(`T${i}`);
}
// configuracion de la fed o conf o fih
// fuente global de datos externa
export const dataCreateLB = (): ILBConfig => {
  const cant: number = 10;
  const IV: boolean = true;
  let wks: TypeHalfWeekOfYear[] = [];
  let wksass: TypeHalfWeekOfYear[] = [];
  for (let i = 0; i < LB.getCantFchs(cant, IV); i++) {
    const wksItem = (4 * i + 12) as TypeHalfWeekOfYear;
    const wksassItem = i < 4 ? 10 : ((4 * i) as TypeHalfWeekOfYear);
    if (wksItem <= wksassItem)
      throw new Error(`se debe asignar la fech antes de jugarse`);
    wks.push(wksItem);
    wksass.push(wksassItem);
  }
  return {
    partsNumber: cant,
    isIV: IV,
    fechHalfWeeks: wks,
    fechHalfWeeksAssignation: wksass,
    temp: 1,
  };
};

export const teamSelection = (cant: number) => {
  let teams: string[] = CUF.shuffled(teamsList, 0);
  return teams.slice(0, cant);
};
