
import { A_ResultSerie } from './A_ResultSerie';
import { A_Match } from './A_Match';
import Team from '../data/Team';
import { TypeBaseStageOption } from '../data';

/**
 * Clase abstracta que representa una serie genérica (ida y vuelta o partido único).
 * 
 * MatchScoreType: tipo del score de cada match individual.
 * SerieScoreType: tipo del score de la serie (puede diferir del match).
 * 
 * Cada deporte extiende esta clase y define:
 * - Cómo se crea el resultado de serie y los matches (en el constructor)
 * - Cómo se determina el ganador/perdedor (winner/loser abstractos)
 * - Cuándo la serie está terminada (isFinished abstracto)
 */
export abstract class A_Serie<MatchScoreType, SerieScoreType> {

  protected _id: string;
  protected _teamOne: Team;
  protected _teamTwo: Team;
  protected _opt: TypeBaseStageOption;
  protected _resultSerie: A_ResultSerie<SerieScoreType>;
  protected _matches: A_Match<MatchScoreType>[];

  constructor(
    id: string,
    teamOne: Team,
    teamTwo: Team,
    opt: TypeBaseStageOption,
    resultSerie: A_ResultSerie<SerieScoreType>,
    matches: A_Match<MatchScoreType>[],
  ) {
    this._id = id;
    this._teamOne = teamOne;
    this._teamTwo = teamTwo;
    this._opt = opt;
    this._resultSerie = resultSerie;
    this._matches = matches;
  }

  get id(): string { return this._id }
  get opt(): TypeBaseStageOption { return this._opt }
  get resultSerie(): A_ResultSerie<SerieScoreType> { return this._resultSerie }
  get matches(): A_Match<MatchScoreType>[] { return this._matches }

  abstract get isFinished(): boolean;
  abstract get winner(): Team;
  abstract get loser(): Team;
}
