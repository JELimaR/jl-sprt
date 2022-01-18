import JMatch from '../Basics/JMatch';
import LB, { ILBConfig, JFech } from '../Basics/LB';
import { IJDateTime, IJDateTimeCreator, JDateTime } from './Calendar/JDateTime';

export abstract class JEvent {
  private _dateTime: JDateTime;
  constructor(dtc: IJDateTimeCreator) {
    this._dateTime = new JDateTime(dtc);
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

export class JEventMatch extends JEvent { // evento que dura algunos intervalos
  private _match: JMatch
  constructor(dtc: IJDateTimeCreator, match: JMatch) {
    super(dtc);
    this._match = match;
  }

  ejecute(params: any): any {
      
  }
}

export class JEventCreateNewLB extends JEvent { // evento que implica una configuracion necesaria 
  constructor(dtc: IJDateTimeCreator) {
    super(dtc);
  }
  ejecute(lbconfig: ILBConfig): LB { // solicitar datos primero
    return new LB(lbconfig)
  }
}

export class JEventFechAssignation extends JEvent { // evento que implica una configuracion necesaria
  _fech: JFech
  constructor(dtc: IJDateTimeCreator, fech: JFech) {
    super(dtc);
    this._fech = fech
  }

  ejecute() {
      this._fech.matches.forEach((match: JMatch) => {
        console.log(match)
      })
  }
}

export class JCalendarLB {
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
