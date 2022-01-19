import { JFech } from '../Basics/JFech';
import JMatch from '../Basics/JMatch';
import LB, { ILBConfig } from '../Basics/LB';
import { teamSelection } from '../GlobalData';
import { IJDateTime, IJDateTimeCreator, JDateTime } from './Calendar/JDateTime';
import { TypeHalfWeekOfYear } from './Calendar/types';

export interface IJEventCreator {
  dateTime: IJDateTimeCreator;
  calendar: JCalendar;
}

export abstract class JEvent {
  private _dateTime: JDateTime;
  private _calendar: JCalendar;
	private _state: 'created' | 'process' | 'finished';

  constructor(ec: IJEventCreator) {
    this._dateTime = new JDateTime(ec.dateTime);
    this._calendar = ec.calendar;
		this._state = 'created';
  }

  get dateTime(): JDateTime {
    return this._dateTime;
  }
  get calendar(): JCalendar {
    return this._calendar;
  }

  /*abstract*/ advance() { // para los eventos que duran mas de un intervalo y tienen acciones y estados
    console.log('advance event');
  }

  abstract ejecute(): any;
}

/**
 * renombrar eventos para aclarar que son de LB
 */
export interface IJEventMatchLBCreator extends IJEventCreator {
  match: JMatch;
}

export class JEventMatchLB extends JEvent {
  // evento que dura algunos intervalos
  private _match: JMatch;
  constructor(emc: IJEventMatchLBCreator) {
    super(emc);
    this._match = emc.match;
  }

  ejecute(): void {
		this._match.start();
    console.log(`playing match ${this._match.id}`);
		while (this._match.state !== 'finished') {
			this._match.advance();
		}
		console.log(`\tresult:`)
		const res = this._match.result;
		console.log(`\t\t ${this._match.lcl.id}: ${res.lclGls}`);
		console.log(`\t\t ${this._match.vst.id}: ${res.vstGls}`);
  }
}

/** es necesario este evento? */
export interface IJEventCreateNewLBCreator extends IJEventCreator {
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
      new JEventTeamAssignationLB({
        dateTime: { day: 5, interv: 100 },
        calendar: this.calendar,
        lb,
      })
    );
    return lb;
  }
}

export interface IJEventTeamAssignationLBCreator extends IJEventCreator {
  lb: LB;
}

export class JEventTeamAssignationLB extends JEvent {
  // evento que implica una configuracion necesaria
  private _lb: LB;
  constructor(etc: IJEventTeamAssignationLBCreator) {
    super(etc);
    this._lb = etc.lb;
  }

  ejecute() {
    console.log('ejecuting team assignation');
    this._lb.assign(teamSelection(this._lb.partsNumber), this.calendar);
    console.log('end team assignation');
  }
}

export interface IJEventFechAssignatioLBCreator extends IJEventCreator {
  fech: JFech;
}

export class JEventFechAssignationLB extends JEvent {
  // evento que implica una configuracion necesaria
  _fech: JFech;
  constructor(efc: IJEventFechAssignatioLBCreator) {
    super(efc);
    this._fech = efc.fech;
  }

  ejecute() {
    console.log(`ejecuting match scheduling for fech number: ${this._fech.id}`);
    // el evento debe crearse en el match
    this._fech.matches.forEach((match: JMatch) => {
      const dt = JDateTime.halfWeekOfYearToDateTime(
        this._fech.halfWeek,
        1,
        'end'
      );
      match.schedule(dt);
      this.calendar.addEvent(
        new JEventMatchLB({
          dateTime: dt.getIJDateTimeCreator(),
          calendar: this.calendar,
          match,
        })
      );
    });
  }
}

export class JCalendar {
  private _events: JEvent[] = [];

  constructor() {}

  addEvent(event: JEvent) {
    this._events.push(event);
    this._events.sort((a: JEvent, b: JEvent) => {
      return JDateTime.difBetween(a.dateTime, b.dateTime);
    });
  }

  get events(): JEvent[] {
    // cambiar a IJEvent
    return this._events;
  }
}

export class JCalendarLB extends JCalendar {}
