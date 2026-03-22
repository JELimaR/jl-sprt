
import Team from "../data/Team";
import { A_Result, IA_ResultInfo } from "../Match/A_Result";
import ScoreResult from "../Match/ScoreResult";
import ScoreMatchPlay from "../Match/ScoreMatchPlay";
import AFTeamTableItem, { AFMatchResults, AFMatchPuntuations } from "../Ranking/AFTeamTableItem";
import { ISportProfile } from "./ISportProfile";

/**
 * Profile para American Football.
 * Score: number (puntos: touchdowns, field goals, safeties, etc.)
 * Resultados: W, L (no hay empate, overtime lo resuelve)
 * Puntuaciones: pf (points for), pa (points against)
 * 
 * Series ida/vuelta: no es un formato habitual en american football.
 * En caso de usarse, se acumularían puntos globales como en fútbol.
 */
export class AmericanFootballProfile implements ISportProfile<number, AFMatchResults, AFMatchPuntuations> {

  createResult(teamOneId: string, teamTwoId: string): ScoreResult {
    return new ScoreResult(teamOneId, teamTwoId);
  }

  createMatchPlay(globalResult?: A_Result<number>): ScoreMatchPlay {
    return new ScoreMatchPlay(globalResult as ScoreResult | undefined);
  }

  createTableItem(team: Team, bsId: string): AFTeamTableItem {
    return new AFTeamTableItem(team, bsId);
  }

  updateTableFromResult(
    tti: AFTeamTableItem,
    resultInfo: IA_ResultInfo<number>,
    teamId: string
  ): void {
    const isHome = resultInfo.teamOneScore.team === teamId;
    const myScore = isHome
      ? resultInfo.teamOneScore.score
      : resultInfo.teamTwoScore.score;
    const theirScore = isHome
      ? resultInfo.teamTwoScore.score
      : resultInfo.teamOneScore.score;

    tti.addPf(myScore);
    tti.addPa(theirScore);

    // American football no tiene empate (overtime)
    if (resultInfo.teamWinner === teamId) {
      tti.addWM();
    } else {
      tti.addLM();
    }
  }
}
