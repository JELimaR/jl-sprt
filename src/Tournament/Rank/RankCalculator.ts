// import JStageGroup from '../Stage/StageGroup/JStageGroup';
import JMatch from '../Match/JMatch';
import BaseStage, { IBaseStageConfig, IBaseStageInfo } from '../Stage/BaseStage';
import League from '../Stage/StageGroup/League/League';
import SingleElmination from '../Stage/StagePlayoff/SingleElimination/SingleElmination';
import TeamTableItem, { } from './TeamTableItem';
// import { TGS } from '../types';
// import StagePlayoff from '../Stage/StagePlayoff/StagePlayoff';
// import StageGroup from '../Stage/StageGroup/StageGroup';
import { JRound } from '../Stage/StagePlayoff/SingleElimination/JRound';
import Team from '../Team';
import { RankItem, TypeRanking } from './ranking';
import { TGS } from '../types';
import StagePlayoff from '../Stage/StagePlayoff/StagePlayoff';
import StageGroup from '../Stage/StageGroup/StageGroup';

// JRankHistoric
// JRankRecent - x years
// JRankStage
// JRankRound
// JRankLeague
// JRankTemporal - solo para JRankLeague



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


  // static getStageRelativeRank(stage: TGS): TypeRanking {
  //   let ttiArr: TeamTableItem[];

  //   if (stage instanceof StagePlayoff) {
  //     ttiArr = this.getTableStagePlayoff(stage, 'finished');
  //   } else if (stage instanceof StageGroup) {
  //     ttiArr = this.getTableStageGroup(stage, 'finished');
  //   } else {
  //     throw new Error(`not implemented yet in RankCalculator.getStageRelativeRank`)
  //   }

  //   const rankItemArr: RankItem[] = ttiArr.map((tti, idx) => {
  //     return {
  //       team: tti.team,
  //       rank: idx + 1,
  //       originId: tti.bsId
  //     }
  //   })

  //   return {
  //     rankId: 'sr_' + stage.config.idConfig,
  //     // state: (stage.isFinished) ? 'final' : 'partial',
  //     table: rankItemArr,
  //   }
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
  // static getTableStageGroup(stageGroup: StageGroup, ttms: TypeTableMatchState): TeamTableItem[] {
  //   let out: TeamTableItem[] = []; // pasar a map

  //   stageGroup.groups.forEach((g: League) => {
  //     out = out.concat(g.getTable(ttms));
  //   })

  //   out.sort((a, b) => simpleSortFunc(a, b, false)) // usar la media de puntos

  //   return out;
  // }

  /**
   * 
   */
  // static getTableStagePlayoff(stagePlayoff: StagePlayoff, ttms: TypeTableMatchState): TeamTableItem[] {
  //   let out: TeamTableItem[] = []; // pasar a map

  //   let playoff: SingleElmination = stagePlayoff.playoff;
  //   out = playoff.getTable(ttms);

  //   playoff.rounds.forEach((r: JRound, idx: number) => {
  //     r.losers.forEach((loser: Team) => {
  //       let item = out.find((value: TeamTableItem) => value.team.id === loser.id)
  //       if (item) item.pos = playoff.rounds.length + 1 - idx;
  //     })
  //   });
  //   out.sort((a, b) => simpleSortFunc(a, b, true));
  //   return out;
  // }

  /**
   * 
   */
  // static getTableBase(base: BaseStage<IBaseStageInfo, IBaseStageConfig>, ttms: TypeTableMatchState): TeamTableItem[] {
  //   let out: TeamTableItem[] = base.calcTableValues(ttms);

  //   out.sort((a, b) => simpleSortFunc(a, b, base instanceof SingleElmination));

  //   // la posicion se establece de formas distintas segun el tipo de BaseStage
  //   if (base instanceof League) {
  //     out.map((itti, idx) => itti.pos = idx + 1)
  //   }

  //   return out;
  // }
}


