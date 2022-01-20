import { JDateTime } from "./DateTimeClasses/JDateTime";
import { JEvent } from "./Event/JEvent";

export default class JCalendar {
    private _events: JEvent[] = [];

    constructor() {}

    addEvent(event: JEvent) {
        this._events.push(event);
        this._events.sort((a: JEvent, b: JEvent) => {
        return JDateTime.difBetween(a.dateTime, b.dateTime);
        });
    }

    get events(): JEvent[] {
        // cambiar a IJEvent?
        return this._events;
    }

}

export class JCalendarLB extends JCalendar {}