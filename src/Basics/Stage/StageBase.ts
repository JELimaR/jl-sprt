import JCalendar from "../../Calendar/JCalendar";
import Team from "../Team";
import JMatch from "../Match/JMatch";
import { ITeamTableItem } from "../Rank/TeamTableItem";
import { arr2 } from "../types";
import { ITCCConfig, ITCCInfo, TCC } from "../../patterns/templateConfigCreator";

export interface IStageBaseConfig extends ITCCConfig {
  participantsNumber: number;
  isIV: boolean;
  isNeutral: boolean;
}

export interface IStageBaseInfo extends ITCCInfo {
  id: string;
  season: number;
}

export default abstract class StageBase<I extends IStageBaseInfo, C extends IStageBaseConfig> extends TCC<I, C> {

  /**
   * Creacion de una SB. Se asigna la config y la info
   * Quedan desconocidos los participants y por tanto no se crean los turns/rounds
   *        -> ESTOS SE CREAN EN LA ASIGNACION -> función assign()
   * 
   * Se realizan las siguientes verificaciones correspondientes de creacion
   * * existe sch para la cantidad de participants
   * * la cantidad de halfweeks asignada para cada turn coincide con la cantidad de turns que corresponde
   * * la cantidad de halfweeks asignada para la programacion de cada turn coincide con la cantidad de turns que corresponde
   */
  
  constructor(info: I, config: C) {
    super(info, config);
    // try {
    //   // this.constructorVerification(config);
    // } catch (error) {
    //   console.log(error)
    // }
  }

  // abstract constructorVerification(config: C): Error | 'ok';

  abstract get matches(): JMatch[];
  abstract get teams(): Team[];

  get isFinished(): boolean {
    return this.matches.every((m: JMatch) => m.state === 'finished');
  }

  abstract get table(): ITeamTableItem[];

  abstract assign(participants: Team[] | arr2<Team>[], cal: JCalendar): void;
}