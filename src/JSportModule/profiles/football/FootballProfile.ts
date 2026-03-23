
import Team from "../../data/Team";
import { IA_ResultInfo } from "../../Match/A_Result";
import FootballResult from "./FootballResult";
import FootballMatchPlay from "./FootballMatchPlay";
import FootballMatch from "./FootballMatch";
import FootballSerie from "./FootballSerie";
import FootballTeamTableItem, { FootballMatchResults, FootballMatchPuntuations } from "./FootballTeamTableItem";
import { ISportProfile, IMatchCreationInfo, ISerieCreationInfo } from "../ISportProfile";

/**
 * Profile para fútbol.
 * Score: number (goles)
 * Resultados: W (win), D (draw), L (loss)
 * Puntuaciones: gf (goles a favor), ga (goles en contra)
 */
export class FootballProfile implements ISportProfile<number, FootballMatchResults, FootballMatchPuntuations> {

  createMatch(info: IMatchCreationInfo): FootballMatch {
    return new FootballMatch(
      info.id, info.homeTeam, info.awayTeam,
      info.hw, info.season, info.allowedDraw,
    );
  }

  createSerie(info: ISerieCreationInfo): FootballSerie {
    return new FootballSerie(
      info.id, info.teamOne, info.teamTwo,
      info.hws, info.season, info.opt,
    );
  }

  createResult(teamOneId: string, teamTwoId: string): FootballResult {
    return new FootballResult(teamOneId, teamTwoId);
  }

  createMatchPlay(globalResult?: FootballResult): FootballMatchPlay {
    return new FootballMatchPlay(globalResult);
  }

  createTableItem(team: Team, bsId: string): FootballTeamTableItem {
    return new FootballTeamTableItem(team, bsId);
  }

  updateTableFromResult(
    tti: FootballTeamTableItem,
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

    tti.addGf(myScore);
    tti.addGa(theirScore);

    if (resultInfo.teamWinner === teamId) {
      tti.addWM();
    } else if (resultInfo.teamLoser === teamId) {
      tti.addLM();
    } else {
      tti.addDM();
    }
  }
}
