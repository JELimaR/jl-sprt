
import Team from "../../data/Team";
import { IA_ResultInfo } from "../../Match/A_Result";
import VolleyResult from "./VolleyResult";
import VolleyMatchPlay from "./VolleyMatchPlay";
import VolleyMatch from "./VolleyMatch";
import VolleySerie from "./VolleySerie";
import { IVolleyScore } from "./VolleyScore";
import VolleyTeamTableItem, { VolleyMatchResults, VolleyMatchPuntuations } from "./VolleyTeamTableItem";
import { ISportProfile, IMatchCreationInfo, ISerieCreationInfo } from "../ISportProfile";

/**
 * Profile para Volleyball.
 * Score: IVolleyScore (sets ganados + puntos por set)
 * Resultados: W3_0, W3_1, W3_2, L2_3, L1_3, L0_3
 * Puntuaciones: sw (sets won), sl (sets lost), pf (points for), pa (points against)
 */
export class VolleyballProfile implements ISportProfile<IVolleyScore, VolleyMatchResults, VolleyMatchPuntuations> {

  createMatch(info: IMatchCreationInfo): VolleyMatch {
    return new VolleyMatch(
      info.id, info.homeTeam, info.awayTeam,
      info.hw, info.season, info.allowedDraw,
    );
  }

  createSerie(info: ISerieCreationInfo): VolleySerie {
    return new VolleySerie(
      info.id, info.teamOne, info.teamTwo,
      info.hws, info.season, info.opt,
    );
  }

  createResult(teamOneId: string, teamTwoId: string): VolleyResult {
    return new VolleyResult(teamOneId, teamTwoId);
  }

  createMatchPlay(globalResult?: VolleyResult): VolleyMatchPlay {
    return new VolleyMatchPlay(globalResult);
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

    tti.addSw(myScore.setsWon);
    tti.addSl(theirScore.setsWon);

    const myPoints = myScore.setPoints.reduce((sum, p) => sum + p, 0);
    const theirPoints = theirScore.setPoints.reduce((sum, p) => sum + p, 0);
    tti.addPf(myPoints);
    tti.addPa(theirPoints);

    const resultKey = `${resultInfo.teamWinner === teamId ? 'W' : 'L'}${myScore.setsWon}_${theirScore.setsWon}` as VolleyMatchResults;
    tti.addMatchResult(resultKey);
  }
}
