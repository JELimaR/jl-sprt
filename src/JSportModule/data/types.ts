
export interface arr2<T> {
	0: T,
	1: T
}

export type TypeCategory = 'S' | 'S23' | 'S21' | 'S19' | 'S17' | 'S15' | 'S13';
export const CATEGORIES: TypeCategory[] = ['S', 'S23', 'S21', 'S19', 'S17', 'S15', 'S13'];

export type TypeCategoryList<T> = { [K in TypeCategory]?: T};
export const getCategoryList = <T>(generic: T): TypeCategoryList<T> => {
  return {
    'S': generic, 'S23': generic, 'S21': generic, 'S19': generic, 'S17': generic, 'S15': generic, 'S13': generic
  }
}
