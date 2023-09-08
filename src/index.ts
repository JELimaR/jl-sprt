// import { CollectionsUtilsFunctions } from 'jl-utlts';
// const CUF = CollectionsUtilsFunctions.getInstance();

import { JRankCalculator } from './Tournament/Rank/JRank';
import League from './Tournament/Stage/StageGroup/League';
import SingleElmination from './Tournament/Stage/StagePlayoff/SingleElmination';
import { JDateTime } from './Calendar/DateTime/JDateTime';
import JCalendar from './Calendar/JCalendar';
import { getExampleTeams } from './Entities/ExampleData';
import baseStageExample from './baseStageExample';

function app() {

  baseStageExample();
    
  // console.log(JDateTime.createFromHalfWeekOfYearAndYear(90, 1, 'start', 1).getDateTime())
  // console.log(JDateTime.createFromHalfWeekOfYearAndYear(90, 1, 'start', 1).getIJDateTimeCreator())
}


app();