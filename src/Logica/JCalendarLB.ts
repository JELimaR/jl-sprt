import { JFech } from '../Basics/Fech/JFech';
import JMatch from '../Basics/Match/JMatch';
import LB, { ILBConfig } from '../Basics/LB';
import { teamSelection } from '../GlobalData';
import { IJDateTime, IJDateTimeCreator, JDateTime } from './DateTimeClasses/JDateTime';
import { TypeHalfWeekOfYear } from './DateTimeClasses/types';
import { IJEventInfo, JEvent } from './Event/JEvent';
import JCalendar from './JCalendar';
import { JEventMatch } from '../Basics/Match/JMatchEvent';
import { JEventTeamDraw } from '../Basics/JEventTeamDraw';


/**
 * renombrar eventos para aclarar que son de LB
 */

/** es necesario este evento? */
export interface IJEventCreateNewLBCreator extends IJEventInfo {
  lbconfig: ILBConfig;
}

export class JEventCreateNewLB extends JEvent {
  // evento que implica una configuracion necesaria
  private _lbconfig: ILBConfig;
  constructor(eclbc: IJEventCreateNewLBCreator) {
    super(eclbc);
    this._lbconfig = eclbc.lbconfig;
  }
  ejecute(): LB {
    // setear datos en algun momento, si no se seteo nada debe dar error o solicitarlo
    const lb: LB = new LB(this._lbconfig);
    this.calendar.addEvent(
      new JEventTeamDraw({
        dateTime: { day: 5, interv: 100 },
        calendar: this.calendar,
        lb,
        teams: teamSelection(lb.config.partsNumber)
      })
    );
    return lb;
  }
}


