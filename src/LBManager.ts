import { JFech } from "./Basics/JFech";
import LB, { ILBConfig } from "./Basics/LB";
import { JDateTime } from './Logica/Calendar/JDateTime';
import { TypeHalfWeekOfYear } from "./Logica/Calendar/types";
import { JCalendarLB, JEventCreateNewLB, JEvent, JEventFechAssignation } from './Logica/JCalendarLB';

const dataCreateLB = (): ILBConfig => {
	const cant: number = 10;
	const IV: boolean = true;
	let wks: TypeHalfWeekOfYear[] = [];
	for (let i=0; i < LB.getCantFchs(cant,IV); i++) {
		wks.push(4*i+12 as TypeHalfWeekOfYear);
	}
	return {partsNumber: cant, isIV: IV, hws: wks, temp: 89}
}

export default class LBManager {

    public lb: LB | undefined;
    public _nextEvent: JEvent | null;
    constructor(
        public calendar: JCalendarLB = new JCalendarLB(),
        public dt: JDateTime = new JDateTime({day: 1, interv: 0}),
        ) {
            this.calendar.addEvent(new JEventCreateNewLB({
				dateTime: {day:3, interv:100},
				calendar: this.calendar,
				lbconfig: dataCreateLB()
			}));
            this._nextEvent = this.nextEvent;
    }

    private get nextEvent(): JEvent {
        return this.calendar.events.filter((event: JEvent) => 
                event.dateTime.absolute > this.dt.absolute
            )[0];
    }

    advance() {
        this.dt.addInterv(100);
    }

    getEventNow(dt?: JDateTime): JEvent[] {
        return this.calendar.events.filter((event: JEvent) => 
                event.dateTime.absolute === this.dt.absolute
            );
    }

    setLB(lb: LB) {
        this.lb = lb;       
    }

    setAsignation(): void {
        this.lb!.fechs.forEach((fech: JFech) => {
            const dateOfFech = new JDateTime({day: fech.halfWeek*4, interv: 0});
            this.calendar.addEvent(
                new JEventFechAssignation({
                    dateTime: {
                        day: JDateTime.subWeeks(dateOfFech, 3).getDateTime().date.dayAbsolute,
                        interv: 0
                    },
					calendar: this.calendar,
                    fech
				})
            )
        })
    }

}