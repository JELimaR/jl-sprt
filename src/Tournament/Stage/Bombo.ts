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

	getElements(): T[] {
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
	
	reset(): void {
		this._state = 'reseted';
	}
}