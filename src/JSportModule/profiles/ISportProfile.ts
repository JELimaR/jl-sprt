
import Team from "../data/Team";
import { A_TeamTableItem } from "../Ranking/A_TeamTableItem";
import { A_Result, IA_ResultInfo } from "../Match/A_Result";
import { A_MatchPlay } from "../Match/A_MatchPlay";
import { A_Match } from "../Match/A_Match";
import { A_Serie } from "../Match/A_Serie";
import { TMatchScore, TSerieScore } from "../Match/scores";
import { TypeHalfWeekOfYear } from "../../JCalendar/JDateTimeModule";
import { arr2, TypeBaseStageOption } from "../data";

/**
 * Info genérica para crear un Match desde el profile.
 * Contiene solo datos estructurales/de scheduling, no lógica de deporte.
 * Para matches dentro de una serie, A_Serie los crea internamente.
 */
export interface IMatchCreationInfo {
  id: string;
  hw: TypeHalfWeekOfYear;
  season: number;
  homeTeam: Team;
  awayTeam: Team;
  allowedDraw: boolean;
  isNeutral: boolean;
}

/**
 * Info genérica para crear una Serie desde el profile.
 */
export interface ISerieCreationInfo {
  teamOne: Team;
  teamTwo: Team;
  hws: arr2<TypeHalfWeekOfYear>;
  season: number;
  id: string;
  opt: TypeBaseStageOption;
}

/**
 * Interfaz que encapsula todo lo específico de un deporte.
 * Cada deporte implementa su propio profile.
 * El profile es la fábrica completa: crea Match, Serie, Result, MatchPlay, TableItem.
 * Agregar un nuevo deporte = crear un nuevo profile + sus clases concretas.
 * 
 * MatchScoreType: tipo del score del partido (number para futbol/basketball, IVolleyScore para volleyball, etc.)
 * Res: tipos de resultado posibles ('W' | 'D' | 'L' para futbol, 'W' | 'L' para basketball, etc.)
 * Punt: tipos de puntuación ('gf' | 'ga' para futbol, 'pf' | 'pa' para basketball, etc.)
 */
export interface ISportProfile<MatchScoreType extends TMatchScore, SerieScoreType extends TSerieScore, Res extends string, Punt extends string> {

  /**
   * Crea un partido completo con toda la lógica específica del deporte.
   */
  createMatch(info: IMatchCreationInfo): A_Match<MatchScoreType>;

  /**
   * Crea una serie (ida/vuelta o partido único) con la lógica específica del deporte.
   * Cada deporte define cómo se resuelve el desempate de una serie.
   */
  createSerie(info: ISerieCreationInfo): A_Serie<MatchScoreType, SerieScoreType>;

  /**
   * Crea un resultado vacío para un partido entre dos equipos.
   */
  createResult(teamOneId: string, teamTwoId: string): A_Result<MatchScoreType>;

  /**
   * Crea la simulación de un partido.
   * @param globalResult resultado global de la serie (para ida y vuelta)
   */
  // // NO SE DEBE USAR un globalResult - en su caso, referencia al partido anterior
  createMatchPlay(globalResult?: A_Result<MatchScoreType>): A_MatchPlay<MatchScoreType>;

  /**
   * Crea un item de tabla para un equipo en un BaseStage.
   */
  createTableItem(team: Team, bsId: string): A_TeamTableItem<Res, Punt>;

  /**
   * Actualiza un item de tabla a partir del resultado de un partido.
   */
  updateTableFromResult(
    tti: A_TeamTableItem<Res, Punt>,
    resultInfo: IA_ResultInfo<MatchScoreType>,
    teamId: string
  ): void;
}

/**
 * Tipo para usar ISportProfile de forma genérica sin propagar los tipos Res/Punt.
 */
export type AnySportProfile = ISportProfile<any, any, string, string>;
