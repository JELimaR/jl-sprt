
import { IJObserver, IJSubject } from "../../JSportModule/patterns/observer";
import { IJEventInfo, JEvent } from "./JEvent";

export interface IEvent_CreatorInfo extends IJEventInfo {

  }
  
export abstract class Event_Creator<T> extends JEvent implements IJSubject {
    private _state: 'created' | 'realised';
		private _observers: IJObserver<Event_Creator<T>>[] = [];
		private _element: T | undefined;

    constructor(ec: IEvent_CreatorInfo) {
				super(ec)
        this._state = 'created';
    }

		get element(): T { 
			if (!this._element) throw new Error('element non created yet');
			return this._element 
		}
		set element(element: T) { 
			this._element = element;
		}
		get state(): 'created' | 'realised' { return this._state }
		set state(state: 'created' | 'realised') { this._state = state}

		addObserver(obs: IJObserver<Event_Creator<T>>): void {
			this._observers.push(obs);
		}

		removeObserver(obs: IJObserver<Event_Creator<T>>): void {	}

		notify(): void {
			this._observers.forEach((obs: IJObserver<Event_Creator<T>>) => {
				obs.update(this);
			})
		}

    abstract execute(): void;
}