
import { IJObserver, IJSubject } from "../../patterns/observer";
import { IJDateTimeCreator, JDateTime } from "../DateTime/JDateTime";
import JCalendar from "../JCalendar";
import { IJEventInfo, JEvent } from "./JEvent";

export interface IJEventCreatorInfo extends IJEventInfo {
    dateTime: IJDateTimeCreator;
    calendar: JCalendar;
  }
  
export abstract class JEventCreator<T> extends JEvent implements IJSubject {
    private _state: 'created' | 'realised';
		private _observers: IJObserver<JEventCreator<T>>[] = [];
		private _element: T | undefined;

    constructor(ec: IJEventCreatorInfo) {
				super(ec)
        //this._dateTime = new JDateTime(ec.dateTime);
        //this._calendar = ec.calendar;
        this._state = 'created';
    }

		get element(): T { 
			if (!this._element) throw new Error('element non created');
			return this._element 
		}
		set element(ele: T) { 
			this._element = ele;
		}
		get state(): 'created' | 'realised' { return this._state }
		set state(state: 'created' | 'realised') { this._state = state}

		addObserver(obs: IJObserver<JEventCreator<T>>): void {
			this._observers.push(obs);
		}

		removeObserver(obs: IJObserver<JEventCreator<T>>): void {	}

		notify(): void {
			this._observers.forEach((obs: IJObserver<JEventCreator<T>>) => {
				obs.update(this);
			})
		}

    abstract ejecute(): void;
}