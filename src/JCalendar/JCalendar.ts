import { IJDateTimeCreator, JDateTime, TypeIntervalOfDay } from "./JDateTimeModule";
import { JEvent } from "./Event/JEvent";


export default class JCalendar {
  private _eventsMap: Map<number, JEvent[]> = new Map<number, JEvent[]>();
  // private _events: JEvent[] = [];
  private _initDate: JDateTime;
  private _now: JDateTime;

  constructor(dti: IJDateTimeCreator) {
    this._now = new JDateTime(dti);
    this._initDate = this._now.copy();
  }

  addEvent(event: JEvent) {
    let eventsArr = this._eventsMap.get(event.dateTime.absolute)
    if (!eventsArr) {
      eventsArr = [];
    }
    eventsArr.push(event)
    this._eventsMap.set(event.dateTime.absolute, eventsArr)
  }

  get now(): JDateTime { return this._now.copy() }
  set now(dt: JDateTime) { this._now = dt.copy() }

  get init(): JDateTime { return this._initDate }

  // potecialmente elminable
  get events(): JEvent[] {
    let out: JEvent[] = [];
    // let keys: number[] = Array.from(this._eventsMap.keys())
    // keys = keys.sort()
    // keys.forEach((k: number) => {
    //   if (k >= this._now.absolute) {
    //     out.push(...this._eventsMap.get(k)!)
    //   }
    // })

    this._eventsMap.forEach((events: JEvent[]) => {
      out.push(...events)
    })
    out.sort((a: JEvent, b: JEvent) => {
      return JDateTime.difBetween(a.dateTime, b.dateTime);
    })
    return out;
  }

  getNextEvents(): { dt: JDateTime, events: JEvent[] } {
    let events = this._eventsMap.get(this.getNextKey());
    if (!events) {
      events = []
    }

    return {
      dt: new JDateTime({
        day: Math.round(this.getNextKey() / 300),
        interv: this.getNextKey() % 300 as TypeIntervalOfDay
      }),
      events
    };
  }

  private getNextKey(): number {
    // let out: JEvent[] = [];
    let out = -1;
    let keys: number[] = Array.from(this._eventsMap.keys())
    keys = keys.sort((a,b) => a-b);
    let i = 0
    while (i < keys.length && out < this._now.absolute) {
      if (keys[i] > this._now.absolute) {
        out = keys[i];
      }
      i++
    }
    return out;

  }

  advance() {
    this._now.addInterv(1)
  }

  getCurrentEventList(): JEvent[] {
    let out = this._eventsMap.get(this._now.absolute)
    if (!!out) {
      return out
    } else {
      return []
    }
  }

}