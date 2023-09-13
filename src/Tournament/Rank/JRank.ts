// import JStageGroup from '../Stage/StageGroup/JStageGroup';
import League from '../Stage/StageGroup/League';
import Team from '../Team';
import JMatch from '../Match/JMatch';
import SingleElmination from '../Stage/StagePlayoff/SingleElmination';
import { JRound } from '../Stage/StagePlayoff/Round/JRound';
// import JStagePlayoff from '../Stage/StagePlayoff/JStagePlayoff';
import TeamTableItem, { ITeamTableItem } from './TeamTableItem';
// import JSubStage from '../Stage/JSubStage';
import BaseStage, { IBaseStageConfig, IBaseStageInfo } from '../Stage/BaseStage';
import StagePlayoff from '../Stage/StagePlayoff/StagePlayoff';

// JRankHistoric
// JRankRecent - x years
// JRankStage
// JRankRound
// JRankLeague
// JRankTemporal - solo para JRankLeague

export interface JRankItem {
  team: Team;
  rank: number;
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
  //  static getCoefStageParallel(para: JStageParallels): any {
    // let rank: TypeRanking = this.getRankStageParallel(para);

    

  //   return {
  //     state: (para.isFinished) ? 'final' : 'partial',
  //     table: rank,
  //   };
  // }

  /**
   * 
   */
  // static getRankStageParallel(para: JStageParallels): TypeRanking {
  //   let out: JRankItem[] = (!para.prevStage)
  //     ? [...para.tournamentConfig.participantsRank]
  //     : [...this.getRankStageParallel(para.prevStage).table]

  //   para.forEachSubStage((ss: JSubStage) => {
  //     const ttis: IJTeamTableItem[] = ss.relativeTable;
  //     const rankMin: number = ss.config.rankMinValue;
  //     ttis.forEach((tti: IJTeamTableItem, i: number) => {
  //       out[i + rankMin - 1] = {
  //         team: tti.team,
  //         rank: i + rankMin,
  //       }
  //     })
  //   })

  //   return {
  //     state: (para.isFinished) ? 'final' : 'partial',
  //     table: out,
  //   };
  // }
  
  /**
   * 
   */
  // static getTableStageGroup(stageGroup: StageGroup): ITeamTableItem[] {
  //   let teamsTTI: ITeamTableItem[] = []; // pasar a map

  //   stageGroup.groups.forEach((g: League) => {
  //     teamsTTI = teamsTTI.concat(this.getTableBase(g, 'last'));
  //   })

  //   teamsTTI.sort((a: ITeamTableItem, b: ITeamTableItem) => {
  //     if (b.pos - a.pos !== 0) {
  //       return a.pos - b.pos
  //     }
  //     if (a.ps - b.ps !== 0) {
  //       return b.ps - a.ps
  //     }
  //     if (a.sg - b.sg !== 0) {
  //       return b.sg - a.sg
  //     }
  //     return b.gf - a.gf
  //   })
  //   return teamsTTI;
  // }

  /**
   * 
   */
  static getTableStagePlayoff(stagePlayoff: StagePlayoff): ITeamTableItem[] {
    let teamsTTI: ITeamTableItem[] = []; // pasar a map

    let playoff: SingleElmination = stagePlayoff.playoff;
    teamsTTI = JRankCalculator.getTableBase(playoff, 'last');// teamsTTI.concat(rnk.getCalculatedTable(condition));

    playoff.rounds.forEach((r: JRound, idx: number) => {
      r.losers.forEach((loser: Team) => {
        let item = teamsTTI.find((value: ITeamTableItem) => value.team.id === loser.id)
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
  static getTableBase(base: BaseStage<IBaseStageInfo, IBaseStageConfig>, caso: 'partial' | 'last'): ITeamTableItem[] {
    let teamsTTI: TeamTableItem[] = []; // pasar a map
    base.participants.forEach((team: Team) => {
      teamsTTI.push(new TeamTableItem(team));
    })
    const condition = BaseStage.getTableCondition(caso);
    base.matches.forEach((m: JMatch) => {
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

    teamsTTI.sort((a: TeamTableItem, b: TeamTableItem) => {
      if (base instanceof SingleElmination) {
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
    if (base instanceof League) {
      return teamsTTI.map((tti: TeamTableItem, idx: number) => {
        return { ...tti.getInterface(), pos: idx + 1 }
      });
    } else if (base instanceof SingleElmination) {
      return teamsTTI.map((tti: TeamTableItem) => {
        return { ...tti.getInterface(), pos: 1 }
      });
    } else {
      throw new Error(`no esta implementado este caso en 'JRank.getTableBase()'`)
    }
  }
}


