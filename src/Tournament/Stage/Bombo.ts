import { CollectionsUtilsFunctions } from "jl-utlts";

const CUF = CollectionsUtilsFunctions.getInstance();

// export interface IBomboInfo {
	// elemsNumber: number;
	// selectionPerTime: number[];
// }

export default class Bombo<T> {
	public _elements: T[];
	private _stack: T[] = [];
	private _state: 'reseted' | 'started' | 'finished';

	constructor(elements: T[]) {
		this._elements = elements;
		this._state = 'reseted';
	}

  get state() {    return this._state  }

	private start(): void {
		if (this._state === 'reseted') {
			this._stack = [...this._elements];
      this._stack = CUF.shuffled<T>({ array: this._stack});
		}
		this._state = 'started';
	}

  private finish(): void {
		this._state = 'finished';
	}

  getNextElement(): T {
		if (this._state !== 'started') this.start();
		let out: T | undefined = this._stack.shift();
    if (!out) throw new Error(`no hay elementos para elegir en Bombo.getNextElement`)

    if (this._stack.length == 0)
      this.finish();
    
		return out;
	}
	
	reset(): void {
		this._state = 'reseted';
	}
}