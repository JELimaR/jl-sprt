import JStageGroup from '../Stage/JStageGroup';
import { JFech } from '../Fech/JFech';
import JLeague from '../JLeague';
import JTeam from '../JTeam';
import JMatch from '../Match/JMatch';
import JSingleElmination from '../JSingleElmination';
import { JRound } from '../Round/JRound';
import JStagePlayoff from '../Stage/JStagePlayoff';
import TeamTableItem, { ITeamTableItem } from './JTeamTableItem';
import JTournament from '../../JTournament';
import JStageParallels from '../Stage/JStageParallels';
import JSubStage from '../Stage/JSubStage';

// JRankHistoric
// JRankRecent - x years
// JRankStage
// JRankRound
// JRankLeague
// JRankTemporal - solo para JRankLeague

export interface JRankItem {
  team: JTeam;
  rank: number
}

export type TypeTanking = {
  state: 'partial' | 'final',
  table: JRankItem[]
}

/**************************************** */

export class JRankCalculator {

  /**
   * 
   */
  static getRankStageParallel(para: JStageParallels): TypeTanking {
    let out: JRankItem[] = (!para.prevStage)
      ? [...para.tournamentConfig.participantsRank]
      : [...this.getRankStageParallel(para.prevStage).table]

    para.forEachSubStage((ss: JSubStage) => {
      const ttis: ITeamTableItem[] = ss.relativeTable;
      const rankMin: number = ss.config.rankMinValue;
      ttis.forEach((tti: ITeamTableItem, i: number) => {
        out[i + rankMin - 1] = {
          team: tti.team,
          rank: i + rankMin,
        }
      })
    })

    return {
      state: (para.isFinished) ? 'final' : 'partial',
      table: out,
    };
  }
  /**
   * 
   */
  static getTableStageGroup(stageGroup: JStageGroup): ITeamTableItem[] {
    let teamsTTI: ITeamTableItem[] = []; // pasar a map

    stageGroup.groups.forEach((g: JLeague) => {
      teamsTTI = teamsTTI.concat(g.table);
    })

    teamsTTI.sort((a: ITeamTableItem, b: ITeamTableItem) => {
      if (b.pos - a.pos !== 0) {
        return a.pos - b.pos
      }
      if (a.ps - b.ps !== 0) {
        return b.ps - a.ps
      }
      if (a.sg - b.sg !== 0) {
        return b.sg - a.sg
      }
      return b.gf - a.gf
    })
    return teamsTTI;
  }

  /**
   * 
   */
  static getTableStagePlayoff(stagePlayoff: JStagePlayoff): ITeamTableItem[] {
    let teamsTTI: ITeamTableItem[] = []; // pasar a map

    let playoff: JSingleElmination = stagePlayoff.playoff;
    teamsTTI = stagePlayoff.playoff.table;// teamsTTI.concat(rnk.getCalculatedTable(condition));

    playoff.rounds.forEach((r: JRound, idx: number) => {
      r.losers.forEach((lt: JTeam) => {
        let item = teamsTTI.find((value: ITeamTableItem) => value.team.id === lt.id)
        if (item) item.pos = playoff.rounds.length + 1 - idx;
      })
    });
    teamsTTI.sort((a: ITeamTableItem, b: ITeamTableItem) => {
      if (b.pos - a.pos !== 0) {
        return a.pos - b.pos
      }
      if (a.ps - b.ps !== 0) {
        return b.ps - a.ps
      }
      if (a.sg - b.sg !== 0) {
        return b.sg - a.sg
      }
      return b.gf - a.gf
    })
    return teamsTTI;
  }

  /**
   * 
   */
  static getTableBase(base: JSingleElmination | JLeague, condition: (m: JMatch) => boolean): ITeamTableItem[] {
    let teamsTTI: TeamTableItem[] = []; // pasar a map
    base.teams.forEach((team: JTeam) => {
      teamsTTI.push(new TeamTableItem(team));
    })
    base.matches/*.forEach((r: JRound) => {
			r.matches*/.forEach((m: JMatch) => {
      if (condition(m) && !!m.result) {
        let htti: TeamTableItem | undefined = teamsTTI.find(t => t.team.id === m.homeTeam.id);
        let atti: TeamTableItem | undefined = teamsTTI.find(t => t.team.id === m.awayTeam.id);
        if (htti && atti) {
          // gls HT
          htti.addGf(m.result.teamOneScore.score);
          htti.addGe(m.result.teamTwoScore.score);

          // gls AT
          atti.addGf(m.result.teamTwoScore.score);
          atti.addGe(m.result.teamOneScore.score);

          // add pj
          if (m.result.winner === 'L') {
            htti.addPg();
            atti.addPp();
          } else if (m.result.winner === 'V') {
            htti.addPp();
            atti.addPg();
          } else {
            htti.addPe();
            atti.addPe();
          }
        }
        // throw new Error(`non finded`);
      }
      // })
    })

    teamsTTI.sort((a: TeamTableItem, b: TeamTableItem) => {
      if (a.pj - b.pj !== 0) {
        return b.pj - a.pj
      }
      if (a.ps - b.ps !== 0) {
        return b.ps - a.ps
      }
      if (a.sg - b.sg !== 0) {
        return b.sg - a.sg
      }
      return b.gf - a.gf
    })
    if (base instanceof JLeague) {
      return teamsTTI.map((tti: TeamTableItem, idx: number) => {
        return { ...tti.getInterface(), pos: idx + 1 }
      });
    } else if (base instanceof JSingleElmination) {
      return teamsTTI.map((tti: TeamTableItem) => {
        return { ...tti.getInterface(), pos: 1 }
      });
    } else {
      throw new Error(`no esta implementado este caso en 'JRank.getCalculatedTable()'`)
    }
  }
}


