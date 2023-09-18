// import { CollectionsUtilsFunctions } from 'jl-utlts';
// const CUF = CollectionsUtilsFunctions.getInstance();

import baseStageExample from './examples/baseStageExample';
import specialStageGroupExample from './examples/specialStageGroupExample';
import stageExample01 from './examples/stageExample01';
import stageExample02 from './examples/stageExample02';
import stageLeagueExample from './examples/stageLeagueExample';

function app() {

  baseStageExample();

  stageExample01();

  stageExample02();

  stageLeagueExample();

  specialStageGroupExample();

  // console.log(JDateTime.createFromHalfWeekOfYearAndYear(90, 1, 'start', 1).getDateTime())
  // console.log(JDateTime.createFromHalfWeekOfYearAndYear(90, 1, 'start', 1).getIJDateTimeCreator())
}


app();