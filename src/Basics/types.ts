
export interface arr2<T> {
	0: T,
	1: T
}

export const CATEGORIES: string[] = ['S', 'S23', 'S21', 'S19', 'S17', 'S15', 'S13'];
export type TypeJCategory = 'S' | 'S23' | 'S21' | 'S19' | 'S17' | 'S15' | 'S13';

export type TypeCategoryList<T> = { [K in TypeJCategory]?: T};