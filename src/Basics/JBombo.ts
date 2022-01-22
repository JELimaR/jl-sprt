import { CollectionsUtilsFunctions } from "jl-utlts";

const CUF = CollectionsUtilsFunctions.getInstance();

export default class JBombo<T> {
	public _elements: T[];
	private _stack: T[] = [];
	private _selectionPerTime: number;
	private _state: 'created' | 'started' | 'finished';

	constructor(elements: T[], selectionPerTime: number) {
		this._elements = elements;
		this._selectionPerTime = selectionPerTime;
		this._state = 'created';
	}

	private start(): void {
		if (this._state === 'created' || this._state === 'finished') {
			this._stack = [...this._elements];
		}
		this._state = 'started'
	}

	getElements(): T[] {
		if (this._state !== 'started') this.start();
		let out: T[] = [];
		for (let idx = 0; idx < this._selectionPerTime; idx++) {
			this._stack = CUF.shuffled<T>(this._stack);
			const ele: T | undefined = this._stack.pop();
			if (ele) {
				out.push(ele);
			} else {
				// throw new Error('no hay para elegir');
			}
		}
		if (this._stack.length === 0) this._state = 'finished';
		return out;
	}
}