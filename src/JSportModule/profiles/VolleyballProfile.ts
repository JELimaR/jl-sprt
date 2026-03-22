
import Team from "../data/Team";
import { A_Result, IA_ResultInfo } from "../Match/A_Result";
import { A_MatchPlay } from "../Match/A_MatchPlay";
import { IVolleyScore } from "../Match/VolleyScore";
import VolleyTeamTableItem, { VolleyMatchResults, VolleyMatchPuntuations } from "../Ranking/VolleyTeamTableItem";
import { ISportProfile } from "./ISportProfile";

/**
 * Profile para Volleyball.
 * Score: IVolleyScore (sets ganados + puntos por set)
 * Resultados: W3_0, W3_1, W3_2, L2_3, L1_3, L0_3
 * Puntuaciones: sw (sets won), sl (sets lost), pf (points for), pa (points against)
 * 
 * Series ida/vuelta en volleyball:
 * Se juegan dos partidos. Si tras ambos los equipos están empatados en puntos de partido
 * (ej: ambos ganaron 3-0, o ambos ganaron 3-2), se juega un Set de Oro (Golden Set):
 *   - Set único a 15 puntos con diferencia mínima de 2.
 *   - Ignora sets y puntos anteriores de la serie.
 *   - Se juega inmediatamente después del segundo encuentro.
 * Esto requiere una generalización de Serie que soporte lógica de desempate por deporte.
 */
export class VolleyballProfile implements ISportProfile<IVolleyScore, VolleyMatchResults, VolleyMatchPuntuations> {

  createResult(teamOneId: string, teamTwoId: string): A_Result<IVolleyScore> {
    // TODO: implementar VolleyResult extends A_Result<IVolleyScore>
    throw new Error('VolleyResult no implementado aún');
  }

  createMatchPlay(globalResult?: A_Result<IVolleyScore>): A_MatchPlay<IVolleyScore> {
    // TODO: implementar VolleyMatchPlay extends A_MatchPlay<IVolleyScore>
    throw new Error('VolleyMatchPlay no implementado aún');
  }

  createTableItem(team: Team, bsId: string): VolleyTeamTableItem {
    return new VolleyTeamTableItem(team, bsId);
  }

  updateTableFromResult(
    tti: VolleyTeamTableItem,
    resultInfo: IA_ResultInfo<IVolleyScore>,
    teamId: string
  ): void {
    const isHome = resultInfo.teamOneScore.team === teamId;
    const myScore = isHome
      ? resultInfo.teamOneScore.score
      : resultInfo.teamTwoScore.score;
    const theirScore = isHome
      ? resultInfo.teamTwoScore.score
      : resultInfo.teamOneScore.score;

    // sets
    tti.addSw(myScore.setsWon);
    tti.addSl(theirScore.setsWon);

    // puntos totales de todos los sets
    const myPoints = myScore.setPoints.reduce((sum, p) => sum + p, 0);
    const theirPoints = theirScore.setPoints.reduce((sum, p) => sum + p, 0);
    tti.addPf(myPoints);
    tti.addPa(theirPoints);

    // resultado según sets ganados/perdidos
    const resultKey = `${resultInfo.teamWinner === teamId ? 'W' : 'L'}${myScore.setsWon}_${theirScore.setsWon}` as VolleyMatchResults;
    tti.addMatchResult(resultKey);
  }
}
