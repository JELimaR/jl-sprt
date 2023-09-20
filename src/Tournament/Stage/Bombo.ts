import { CollectionsUtilsFunctions } from "jl-utlts";

const CUF = CollectionsUtilsFunctions.getInstance();

// export interface IBomboInfo {
	// elemsNumber: number;
	// selectionPerTime: number[];
// }

export default class Bombo<T> {
	public _elements: T[];
	private _stack: T[] = [];
	// private _selectionPerTime: number[];
	private _state: 'reseted' | 'started' | 'finished';

  // phase: number = 0;

	constructor(elements: T[]) {
		this._elements = elements;
		// this._selectionPerTime = selectionPerTime;
		this._state = 'reseted';

    let sum = 0;
    // this._selectionPerTime.forEach(n => sum += n);
    // if (sum !== this._elements.length) {
    //   throw new Error(`en Bombo constructor: suma de selectionPerTime ${sum} no es igual a la cantidad de elementos ${this._elements.length}`)
    // }
	}

  get state() {    return this._state  }

	private start(): void {
		if (this._state === 'reseted') {
			this._stack = [...this._elements];
      this._stack = CUF.shuffled<T>({ array: this._stack});
		}
		this._state = 'started';
    // this.phase = 0;
	}

  private finish(): void {
		this._state = 'finished';
	}

	// getNextElements(): T[] {
	// 	if (this._state !== 'started') this.start();
	// 	let out: T[] = [];
	// 	for (let idx = 0; idx < this._selectionPerTime[this.phase]; idx++) {
  //     this._stack = CUF.shuffled<T>({ array: this._stack});
	// 		const ele: T | undefined = this._stack.shift();
	// 		if (ele) {
  //       out.push(ele);
	// 		} else {
  //       throw new Error('no hay para elegir');
	// 		}
	// 	}
  //   this.phase++;
	// 	return out;
	// }

  getNextElement(): T {
		if (this._state !== 'started') this.start();
		let out: T | undefined = this._stack.shift();
    if (!out) throw new Error(`no hay elementos para elegir en Bombo.getNextElement`)

    if (this._stack.length == 0)
      this.finish();
    
		return out;
	}

	/**
	 * Devuelve todos los elementos en un orden aleatorio.
	 * Se utiliza para el uso en StagePlayoff
	 * @returns 
	 */
	// getAllElementsPlayoff(): T[] {
	// 	if (this._state !== 'started') this.start();
	// 	let out: T[] = CUF.shuffled<T>({ array: this._stack });
	// 	this._stack.forEach((v: T,i:number,arr) => arr.shift())
	// 	this._stack.shift();
	// 	return out;
	// }
	
	reset(): void {
		this._state = 'reseted';
	}
}