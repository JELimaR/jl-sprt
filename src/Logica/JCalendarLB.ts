import { JFech } from '../Basics/JFech';
import JMatch from '../Basics/JMatch';
import LB, { ILBConfig } from '../Basics/LB';
import { IJDateTime, IJDateTimeCreator, JDateTime } from './Calendar/JDateTime';
import { TypeHalfWeekOfYear } from './Calendar/types';


export interface IJEventCreator {
	dateTime: IJDateTimeCreator,
	calendar: JCalendar,
}

export abstract class JEvent {
  private _dateTime: JDateTime;
  private _calendar: JCalendar;

  constructor(ec: IJEventCreator) {
    this._dateTime = new JDateTime(ec.dateTime);
	this._calendar = ec.calendar;
  }

  get dateTime(): JDateTime {
    return this._dateTime;
  }

  /*abstract*/ advance() {
    console.log('advance event');
  }

  abstract ejecute(params: any): any;
}

/**
 * renombrar eventos para aclarar que son de LB
 */
export interface IJEventMatchCreator extends IJEventCreator {
	match: JMatch
}

export class JEventMatch extends JEvent { // evento que dura algunos intervalos
  private _match: JMatch
  constructor(emc: IJEventMatchCreator) {
    super(emc);
    this._match = emc.match;
  }

  ejecute(params: any): any {
      
  }
}

/** es necesario este evento? */
export interface IJEventCreateNewLBCreator extends IJEventCreator {
	lbconfig: ILBConfig;
}

export class JEventCreateNewLB extends JEvent { // evento que implica una configuracion necesaria 
  private _lbconfig: ILBConfig
  constructor(eclbc: IJEventCreateNewLBCreator) {
    super(eclbc);
	this._lbconfig = eclbc.lbconfig;
  }
  ejecute(): LB { // setear datos en algun momento, si no se seteo nada debe dar error o solicitarlo
    return new LB(this._lbconfig)
  }
}

export interface IJEventFechCreator extends IJEventCreator {
	fech: JFech
}

export class JEventFechAssignation extends JEvent { // evento que implica una configuracion necesaria
  _fech: JFech;
  constructor(efc: IJEventFechCreator) {
    super(efc);
    this._fech = efc.fech;
  }

  ejecute() {
      this._fech.matches.forEach((match: JMatch) => {
        console.log(match)
      })
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

  get events(): JEvent[] { // cambiar a IJEvent
    return this._events;
  }
}

export class JCalendarLB extends JCalendar {
  
}
