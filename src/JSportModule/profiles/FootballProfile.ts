
import Team from "../data/Team";
import { IA_ResultInfo } from "../Match/A_Result";
import ScoreResult from "../Match/ScoreResult";
import ScoreMatchPlay from "../Match/ScoreMatchPlay";
import GoalTeamTableItem, { GoalMatchResults, GoalMatchPuntuations } from "../Ranking/GoalTeamTableItem";
import { ISportProfile } from "./ISportProfile";

/**
 * Profile para fútbol.
 * Score: number (goles)
 * Resultados: W (win), D (draw), L (loss)
 * Puntuaciones: gf (goles a favor), ga (goles en contra)
 */
export class FootballProfile implements ISportProfile<number, GoalMatchResults, GoalMatchPuntuations> {

  createResult(teamOneId: string, teamTwoId: string): ScoreResult {
    return new ScoreResult(teamOneId, teamTwoId);
  }

  createMatchPlay(globalResult?: ScoreResult): ScoreMatchPlay {
    return new ScoreMatchPlay(globalResult as ScoreResult | undefined);
  }

  createTableItem(team: Team, bsId: string): GoalTeamTableItem {
    return new GoalTeamTableItem(team, bsId);
  }

  updateTableFromResult(
    tti: GoalTeamTableItem,
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

    // puntuaciones
    tti.addGf(myScore);
    tti.addGa(theirScore);

    // resultados
    if (resultInfo.teamWinner === teamId) {
      tti.addWM();
    } else if (resultInfo.teamLoser === teamId) {
      tti.addLM();
    } else {
      tti.addDM();
    }
  }
}
