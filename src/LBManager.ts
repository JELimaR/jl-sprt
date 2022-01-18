import LB, { ILBConfig, JFech } from "./Basics/LB";
import { JDateTime } from './Logica/Calendar/JDateTime';
import { JCalendarLB, JEventCreateNewLB, JEvent, JEventFechAssignation } from './Logica/JCalendarLB';

export default class LBManager {

    public lb: LB | undefined;
    public _nextEvent: JEvent | null;
    constructor(
        public calendar: JCalendarLB = new JCalendarLB(),
        public dt: JDateTime = new JDateTime({day: 1, interv: 0}),
        ) {
            this.calendar.addEvent(new JEventCreateNewLB({day:3, interv:100}));
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
                new JEventFechAssignation(
                    {
                        day: JDateTime.subWeeks(dateOfFech, 3).getDateTime().date.dayAbsolute,
                        interv: 0
                    },
                    fech
                )
            )
        })
    }

}