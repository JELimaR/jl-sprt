
import { TeamMatch } from "../data/Team";
import { A_Result } from "./A_Result";

/**
 * Clase abstracta que define el contrato de la simulación de un partido.
 * Cada deporte debe implementar su propia lógica de simulación.
 * 
 * ScoreType: number para futbol/basketball, IVolleyScore para volleyball, etc.
 */
export abstract class A_MatchPlay<ScoreType> {
  protected _time: number;
  protected _result: A_Result<ScoreType> | undefined;
  protected _globalResult: A_Result<ScoreType> | undefined;
  protected _teamOne: TeamMatch | undefined;
  protected _teamTwo: TeamMatch | undefined;

  constructor(globalResult?: A_Result<ScoreType>) {
    this._time = -1;
    this._globalResult = globalResult;
  }

  get time(): number { return this._time; }
  get result(): A_Result<ScoreType> | undefined { return this._result; }
  get globalResult(): A_Result<ScoreType> | undefined { return this._globalResult; }

  abstract init(one: TeamMatch, two: TeamMatch): void;
  abstract advance(): void;
}
