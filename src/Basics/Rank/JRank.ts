import JStageGroup from '../Stage/StageGroup/JStageGroup';
import JLeague from '../Stage/StageGroup/JLeague';
import JTeam from '../JTeam';
import JMatch from '../Match/JMatch';
import JSingleElmination from '../Stage/StagePlayoff/JSingleElmination';
import { JRound } from '../Stage/StagePlayoff/Round/JRound';
import JStagePlayoff from '../Stage/StagePlayoff/JStagePlayoff';
import JTeamTableItem, { IJTeamTableItem } from './JTeamTableItem';
import JStageParallels from '../Stage/JStageParallels';
import JSubStage from '../Stage/JSubStage';
import JBase from '../Stage/JBase';

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

export type TypeRanking = {
  state: 'partial' | 'final',
  table: JRankItem[]
}

/**************************************** */

export class JRankCalculator {

  /**
   * 
   */
   static getCoefStageParallel(para: JStageParallels): any {
    let rank: TypeRanking = this.getRankStageParallel(para);

    

    return {
      state: (para.isFinished) ? 'final' : 'partial',
      table: rank,
    };
  }

  /**
   * 
   */
  static getRankStageParallel(para: JStageParallels): TypeRanking {
    let out: JRankItem[] = (!para.prevStage)
      ? [...para.tournamentConfig.participantsRank]
      : [...this.getRankStageParallel(para.prevStage).table]

    para.forEachSubStage((ss: JSubStage) => {
      const ttis: IJTeamTableItem[] = ss.relativeTable;
      const rankMin: number = ss.config.rankMinValue;
      ttis.forEach((tti: IJTeamTableItem, i: number) => {
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
  static getTableStageGroup(stageGroup: JStageGroup): IJTeamTableItem[] {
    let teamsTTI: IJTeamTableItem[] = []; // pasar a map

    stageGroup.groups.forEach((g: JLeague) => {
      teamsTTI = teamsTTI.concat(g.table);
    })

    teamsTTI.sort((a: IJTeamTableItem, b: IJTeamTableItem) => {
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
  static getTableStagePlayoff(stagePlayoff: JStagePlayoff): IJTeamTableItem[] {
    let teamsTTI: IJTeamTableItem[] = []; // pasar a map

    let playoff: JSingleElmination = stagePlayoff.playoff;
    teamsTTI = stagePlayoff.playoff.table;// teamsTTI.concat(rnk.getCalculatedTable(condition));

    playoff.rounds.forEach((r: JRound, idx: number) => {
      r.losers.forEach((lt: JTeam) => {
        let item = teamsTTI.find((value: IJTeamTableItem) => value.team.id === lt.id)
        if (item) item.pos = playoff.rounds.length + 1 - idx;
      })
    });
    teamsTTI.sort((a: IJTeamTableItem, b: IJTeamTableItem) => {
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
  static getTableBase(base: JBase, condition: (m: JMatch) => boolean): IJTeamTableItem[] {
    let teamsTTI: JTeamTableItem[] = []; // pasar a map
    base.teams.forEach((team: JTeam) => {
      teamsTTI.push(new JTeamTableItem(team));
    })
    base.matches/*.forEach((r: JRound) => {
			r.matches*/.forEach((m: JMatch) => {
      if (condition(m) && !!m.result) {
        let htti: JTeamTableItem | undefined = teamsTTI.find(t => t.team.id === m.homeTeam.id);
        let atti: JTeamTableItem | undefined = teamsTTI.find(t => t.team.id === m.awayTeam.id);
        if (htti && atti) {
          // gls HT
          htti.addGf(m.result.teamOneScore.score);
          htti.addGe(m.result.teamTwoScore.score);

          // gls AT
          atti.addGf(m.result.teamTwoScore.score);
          atti.addGe(m.result.teamOneScore.score);

          // add pj
          if (m.result.teamWinner === htti.team.id) {
            htti.addPg();
            atti.addPp();
          } else if (m.result.teamWinner === atti.team.id) {
            htti.addPp();
            atti.addPg();
          } else {
            htti.addPe();
            atti.addPe();
          }
        } else throw new Error(`non finded`);
      }
      // })
    })

    teamsTTI.sort((a: JTeamTableItem, b: JTeamTableItem) => {
      if (base instanceof JSingleElmination) {
        if (a.pj - b.pj !== 0) {
          return b.pj - a.pj
        }
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
      return teamsTTI.map((tti: JTeamTableItem, idx: number) => {
        return { ...tti.getInterface(), pos: idx + 1 }
      });
    } else if (base instanceof JSingleElmination) {
      return teamsTTI.map((tti: JTeamTableItem) => {
        return { ...tti.getInterface(), pos: 1 }
      });
    } else {
      throw new Error(`no esta implementado este caso en 'JRank.getCalculatedTable()'`)
    }
  }
}


