
import Team from "../data/Team";
import { A_TeamTableItem } from "../Ranking/A_TeamTableItem";
import { A_Result, IA_ResultInfo } from "../Match/A_Result";
import { A_MatchPlay } from "../Match/A_MatchPlay";
import { TeamMatch } from "../data/Team";

/**
 * Interfaz que encapsula todo lo específico de un deporte.
 * Cada deporte implementa su propio profile.
 * 
 * ScoreType: tipo del score del partido (number para futbol/basketball, IVolleyScore para volleyball, etc.)
 * Res: tipos de resultado posibles ('W' | 'D' | 'L' para futbol, 'W' | 'L' para basketball, etc.)
 * Punt: tipos de puntuación ('gf' | 'ga' para futbol, 'pf' | 'pa' para basketball, etc.)
 */
export interface ISportProfile<ScoreType, Res extends string, Punt extends string> {

  /**
   * Crea un resultado vacío para un partido entre dos equipos.
   */
  createResult(teamOneId: string, teamTwoId: string): A_Result<ScoreType>;

  /**
   * Crea la simulación de un partido.
   * @param globalResult resultado global de la serie (para ida y vuelta)
   */
  createMatchPlay(globalResult?: A_Result<ScoreType>): A_MatchPlay<ScoreType>;

  /**
   * Crea un item de tabla para un equipo en un BaseStage.
   */
  createTableItem(team: Team, bsId: string): A_TeamTableItem<Res, Punt>;

  /**
   * Actualiza un item de tabla a partir del resultado de un partido.
   * Cada deporte sabe cómo traducir un resultado a estadísticas de tabla.
   * 
   * @param tti item de tabla a actualizar
   * @param resultInfo resultado del partido
   * @param teamId id del equipo al que corresponde el item
   */
  updateTableFromResult(
    tti: A_TeamTableItem<Res, Punt>,
    resultInfo: IA_ResultInfo<ScoreType>,
    teamId: string
  ): void;
}
