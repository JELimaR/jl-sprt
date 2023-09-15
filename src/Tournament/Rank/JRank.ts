// import JStageGroup from '../Stage/StageGroup/JStageGroup';
import League from '../Stage/StageGroup/League';
import Team from '../Team';
import JMatch from '../Match/JMatch';
import SingleElmination from '../Stage/StagePlayoff/SingleElmination';

import TeamTableItem, { } from './TeamTableItem';
import BaseStage, { IBaseStageConfig, IBaseStageInfo } from '../Stage/BaseStage';
import StageGroup from '../Stage/StageGroup/StageGroup';
// import StagePlayoff from '../Stage/StagePlayoff/StagePlayoff';
import { JRound } from '../Stage/StagePlayoff/Round/JRound';
import StagePlayoff from '../Stage/StagePlayoff/StagePlayoff';
import Stage, { IStageConfig, IStageInfo } from '../Stage/Stage';

// JRankHistoric
// JRankRecent - x years
// JRankStage
// JRankRound
// JRankLeague
// JRankTemporal - solo para JRankLeague

export type TypeTableMatchState = 'partial' | 'finished';

export interface RankItem {
  team: Team;
  rank: number;
}

export type TypeRanking = {
  rankId: string;
  // state: 'partial' | 'final';
  table: RankItem[];
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


  static getStageRelativeRank(stage: Stage<IStageInfo, IStageConfig>): TypeRanking {
    let ttiArr: TeamTableItem[];
    // throw new Error(`not implemented yet in RankCalculator.getStageRelativeRank`)

    if (stage instanceof StagePlayoff) {
      ttiArr = this.getTableStagePlayoff(stage, 'finished');
    } else if (stage instanceof StageGroup) {
      ttiArr = this.getTableStageGroup(stage, 'finished');
    } else {
      throw new Error(`not implemented yet in RankCalculator.getStageRelativeRank`)
    }

    const rankItemArr: RankItem[] = ttiArr.map((tti, idx) => {
      return {
        team: tti.team,
        rank: idx + 1
      }
    })

    return {
      rankId: 'sr_' + stage.config.idConfig,
      // state: (stage.isFinished) ? 'final' : 'partial',
      table: rankItemArr,
    }
  }

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
  static getTableStageGroup(stageGroup: StageGroup, ttms: TypeTableMatchState): TeamTableItem[] {
    // throw new Error(`not implemented yet in RankCalculator.getTableStageGroup`)
    let out: TeamTableItem[] = []; // pasar a map

    stageGroup.groups.forEach((g: League) => {
      out = out.concat(this.getTableBase(g, 'finished'));
    })

    out.sort((a,b) => simpleSortFunc(a,b,false))

    return out;
  }

  /**
   * 
   */
  static getTableStagePlayoff(stagePlayoff: StagePlayoff, ttms: TypeTableMatchState): TeamTableItem[] {
    let out: TeamTableItem[] = []; // pasar a map

    let playoff: SingleElmination = stagePlayoff.playoff;
    out = JRankCalculator.getTableBase(playoff, ttms);

    playoff.rounds.forEach((r: JRound, idx: number) => {
      r.losers.forEach((loser: Team) => {
        let item = out.find((value: TeamTableItem) => value.team.id === loser.id)
        if (item) item.pos = playoff.rounds.length + 1 - idx;
      })
    });
    out.sort((a, b) => simpleSortFunc(a, b, true));
    return out;
  }

  /**
   * 
   */
  static getTableBase(base: BaseStage<IBaseStageInfo, IBaseStageConfig>, ttms: TypeTableMatchState): TeamTableItem[] {
    let out: TeamTableItem[] = calcTableValues(base, ttms);
    // const teamsTTI: TeamTableItem[] = calcTableValues(base, ttms)

    // ordenar segun criterio 'simpleSortFunc'
    // out = teamsTTI.map((tti: TeamTableItem) => tti.getInterface());
    out.sort((a, b) => simpleSortFunc(a, b, base instanceof SingleElmination));

    // la posicion se establece de formas distintas segun el tipo de BaseStage
    if (base instanceof League) {
      out.map((itti, idx) => itti.pos = idx + 1)
    }

    return out;
  }
}

const simpleSortFunc = (a: TeamTableItem, b: TeamTableItem, isSE: boolean) => {
  if (isSE) {
    if (a.pj - b.pj !== 0) {
      return b.pj - a.pj
    }
  }
  if (b.pos - a.pos !== 0) {
    return a.pos - b.pos
  }
  if (a.ps - b.ps !== 0) {
    return b.ps - a.ps;
  }
  if (a.sg - b.sg !== 0) {
    return b.sg - a.sg;
  }
  return b.gf - a.gf;
}

const calcTableValues = (base: BaseStage<IBaseStageInfo, IBaseStageConfig>, ttms: TypeTableMatchState): TeamTableItem[] => {
  // para cada match, calcular los valores de la tabla de de cada team!
  // valores: pg, pp, pg, pe, gf, ge
  const out: TeamTableItem[] = []; // pasar a map
  base.participants.forEach((team: Team) => out.push(new TeamTableItem(team)));
  // 
  const matchConditionFunc = BaseStage.getTableCondition(ttms);

  base.matches.forEach((m: JMatch) => {
    if (matchConditionFunc(m) && !!m.result) {
      let htti: TeamTableItem | undefined = out.find(t => t.team.id === m.homeTeam.id);
      let atti: TeamTableItem | undefined = out.find(t => t.team.id === m.awayTeam.id);

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
  })

  return out;
}
