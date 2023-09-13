import { CollectionsUtilsFunctions } from "jl-utlts";

const CUF = CollectionsUtilsFunctions.getInstance();

export interface IBomboInfo<T> {
	elements: T[];
	selectionPerTime: number;
}

export default class Bombo<T> {
	public _elements: T[];
	private _stack: T[] = [];
	private _selectionPerTime: number;
	private _state: 'reseted' | 'started';

	constructor(elements: T[], selectionPerTime: number) {
		this._elements = elements;
		this._selectionPerTime = selectionPerTime;
		this._state = 'reseted';
	}

	private start(): void {
		if (this._state === 'reseted') {
			this._stack = [...this._elements];
		}
		this._state = 'started'
	}

	getNextElements(): T[] {
		if (this._state !== 'started') this.start();
		let out: T[] = [];
		for (let idx = 0; idx < this._selectionPerTime; idx++) {
			this._stack = CUF.shuffled<T>({ array: this._stack});
			const ele: T | undefined = this._stack.shift();
			if (ele) {
				out.push(ele);
			} else {
				// throw new Error('no hay para elegir');
			}
		}
		return out;
	}

	/**
	 * Devuelve todos los elementos en un orden aleatorio.
	 * Se utiliza para el uso en StagePlayoff
	 * @returns 
	 */
	getAllElementsPlayoff(): T[] {
		if (this._state !== 'started') this.start();
		let out: T[] = CUF.shuffled<T>({ array: this._stack });
		this._stack.forEach((v: T,i:number,arr) => arr.shift())
		this._stack.shift();
		return out;
	}
	
	reset(): void {
		this._state = 'reseted';
	}
}