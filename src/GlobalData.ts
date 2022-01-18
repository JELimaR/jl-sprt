
let teamsList: string[] = [];
for (let i=1;i<=70;i++){
	teams.push(`T${i}`)
}

import { TypeHalfWeekOfYear } from "./Logica/Calendar/types";
import { JCalendarLB, JEventCreateNewLB, JEvent, JEventFechAssignationLB } from './Logica/JCalendarLB';

// configuracion de la fed o conf o fih
// fuente global de datos externa
export const dataCreateLB = (): ILBConfig => {
	const cant: number = 10;
	const IV: boolean = true;
	let wks: TypeHalfWeekOfYear[] = [];
	for (let i=0; i < LB.getCantFchs(cant,IV); i++) {
		wks.push(4*i+12 as TypeHalfWeekOfYear);
	}
	return {partsNumber: cant, isIV: IV, hws: wks, temp: 1}
}

export const teamSelection = (cant: number) => {
	let teams: string[] = CUF.shuffled(teamsList,0);
	return teams.slice(0,cant);
}