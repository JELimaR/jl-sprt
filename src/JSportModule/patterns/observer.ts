
export interface IJSubject {
	addObserver(observer: IJObserver<any>): void;
	removeObserver(observer: IJObserver<any>): void;
	notify(): void
}

export interface IJObserver<S extends IJSubject> {
	update(subject: S): void;
}