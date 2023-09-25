import baseStageExample from './examples/baseStageExample';
import specialStageGroupExample from './examples/specialStageGroupExample';
import stageExample01 from './examples/stageExample01';
import stageExample02 from './examples/stageExample02';
import stageExample03 from './examples/stageExample03';
import stageLeagueExample from './examples/stageLeagueExample';
import tournamentExample01 from './examples/tournamentExample01';
import tournamentExample02 from './examples/tournamentExample02';

/**
 * PENDIENTES
 * 1 - generar las drawrules - falta probarlas
 * 2 - un sistema para hacer un ranking de tournament
 * 3 - combinacion de ranking, por ejemplo previo al inicio de un stage cualqueira
 * 4 - AGREGAR COMENTARIOS
 * 5 - separar en modulos independientes - completados: ()
 * 6 - empezar a trabajar con las organizations
 * 7 - PHASES de tournament - falta definir las dependencias entre phases
 * 8 - todas las verificaciones deben poder realizarse con los config e info
 * 9 - en la primera ronda de un SE, peude pasar que 2 del mismo grupo (origen) se enfrenten si no hay draw
 * 10 - Crear el modulo ElementConfigVerificationModule
 * 11 - en las quayconditions no pueden repetirse las mismas sources en un stage
 */

function app() {

  // baseStageExample();

  // stageExample01();

  // stageExample02();

  // stageLeagueExample();

  // specialStageGroupExample();

  // stageExample03()

  // tournamentExample01();

  tournamentExample02();

  // console.log(JDateTime.createFromHalfWeekOfYearAndYear(90, 1, 'start', 1).getDateTime())
  // console.log(JDateTime.createFromHalfWeekOfYearAndYear(90, 1, 'start', 1).getIJDateTimeCreator())
}


app();