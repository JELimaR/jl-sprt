import { CollectionsUtilsFunctions } from "jl-utlts";
import { randomFloat } from "../../JSportModule/Match/randomSource";

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
      // Se inyecta la fuente de aleatoriedad compartida (randomSource) para que el
      // sorteo sea reproducible con reseedRandom(seed), igual que la simulación.
      this._stack = CUF.shuffled<T>({ array: this._stack, randFunction: randomFloat });
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