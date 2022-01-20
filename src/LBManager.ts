import { CollectionsUtilsFunctions } from 'jl-utlts';
const CUF = CollectionsUtilsFunctions.getInstance();

import { JFech } from './Basics/Fech/JFech';
import LB, { ILBConfig } from './Basics/LB';
import { dataCreateLB } from './GlobalData';
import { JDateTime } from './Logica/DateTimeClasses/JDateTime';
import { TypeHalfWeekOfYear } from './Logica/DateTimeClasses/types';
import { JEvent } from './Logica/Event/JEvent';
import JCalendar from './Logica/JCalendar';
import {
  JEventCreateNewLB,
} from './Logica/JCalendarLB';

/************************************************************************/
export default class LBManager {
  public lb: LB | undefined;
  public dt: JDateTime = new JDateTime({ day: 1, interv: 0 });
  public calendar: JCalendar = new JCalendar();

  constructor() {
    this.calendar.addEvent(
      new JEventCreateNewLB({
        dateTime: { day: 3, interv: 100 },
        calendar: this.calendar,
        lbconfig: dataCreateLB(),
      })
    );
  }

  get nextEvent(): JEvent | null {
    return this.calendar.events.filter(
      (event: JEvent) => event.dateTime.absolute > this.dt.absolute
    )[0];
  }

  advance(): JEvent | null {
    this.dt.addInterv(1);
    return this.nextEvent;
  }

  getEventNow(dt?: JDateTime): JEvent[] {
    return this.calendar.events.filter(
      (event: JEvent) => event.dateTime.absolute === this.dt.absolute
    );
  }

  setLB(lb: LB) {
    this.lb = lb;
  }
}
