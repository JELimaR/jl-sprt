import { IElementInfo, IStageConfig, ITCCInfo } from "../JSportModule";
import Stage from "./Stage/Stage";

export interface arr2<T> {
	0: T,
	1: T
}

export type TypeJCategory = 'S' | 'S23' | 'S21' | 'S19' | 'S17' | 'S15' | 'S13';
export const CATEGORIES: TypeJCategory[] = ['S', 'S23', 'S21', 'S19', 'S17', 'S15', 'S13'];

export type TypeCategoryList<T> = { [K in TypeJCategory]?: T};

export type TGS = Stage<IElementInfo, IStageConfig>;