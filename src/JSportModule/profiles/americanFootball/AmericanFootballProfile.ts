
import Team from "../../data/Team";
import { IA_ResultInfo } from "../../Match/A_Result";
import AFResult from "./AFResult";
import AFMatchPlay from "./AFMatchPlay";
import AFMatch from "./AFMatch";
import AFSerie from "./AFSerie";
import AFTeamTableItem, { AFMatchResults, AFMatchPuntuations } from "./AFTeamTableItem";
import { ISportProfile, IMatchCreationInfo, ISerieCreationInfo } from "../ISportProfile";

/**
 * Profile para American Football.
 * Score: number (puntos)
 * Resultados: W, L (no hay empate)
 * Puntuaciones: pf (points for), pa (points against)
 */
export class AmericanFootballProfile implements ISportProfile<number, number, AFMatchResults, AFMatchPuntuations> {

  createMatch(info: IMatchCreationInfo): AFMatch {
    return new AFMatch(
      info.id, info.homeTeam, info.awayTeam,
      info.hw, info.season, info.allowedDraw,
    );
  }

  createSerie(info: ISerieCreationInfo): AFSerie {
    return new AFSerie(
      info.id, info.teamOne, info.teamTwo,
      info.hws, info.season, info.opt,
    );
  }

  createResult(teamOneId: string, teamTwoId: string): AFResult {
    return new AFResult(teamOneId, teamTwoId);
  }

  createMatchPlay(globalResult?: AFResult): AFMatchPlay {
    return new AFMatchPlay(globalResult);
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

    if (resultInfo.teamWinner === teamId) {
      tti.addWM();
    } else {
      tti.addLM();
    }
  }
}
