// ============================================================================
// JSport Library - Public API Exports
// ============================================================================

// Calendar (re-exported from the jl-calendar package)
export { JCalendar, JDateTime, JDate, JTime, DateToString, JEvent, JInstantEvent, JDurativeEvent } from 'jl-calendar';
export type { IJDateTimeCreator, TypeHalfWeekOfYear, TypeIntervalOfDay, IJEventInfo, IEventResolution, JEventStatus, JEventLifecycle, TickResult } from 'jl-calendar';

// Ranking
export { Ranking } from './JSportModule/Ranking/Ranking';
export type { TypeRanking } from './JSportModule/Ranking/Ranking';
export type { IGenericRankItem, IRankItem, TypeTableMatchState, IRankingMetadata, TypeRankingGenerator, TypeRankedEntity } from './JSportModule/Ranking/interfaces';
export { A_TeamTableItem } from './JSportModule/Ranking/A_TeamTableItem';
export type { AnyTeamTableItem, SortFunc, IA_TeamTableItemBase } from './JSportModule/Ranking/A_TeamTableItem';
export { RankingStore } from './JSportModule/Ranking/RankingStore';
export type { RankingStoreListener } from './JSportModule/Ranking/RankingStore';

// Tournament
export { default as Tournament } from './Tournament/Tournament';
export { default as Phase } from './Tournament/Phase';
export { SimulationContext, createSimulationContext } from './Tournament/SimulationContext';
export { TournamentConfigStore } from './Tournament/TournamentConfigStore';
export { teamsAssign } from './Tournament/teamsAssign';

// Sport Profiles
export type { ISportProfile, AnySportProfile, IMatchCreationInfo, ISerieCreationInfo } from './JSportModule/profiles/ISportProfile';
export { FootballProfile } from './JSportModule/profiles/football/FootballProfile';
export type { FootballMatchResults, FootballMatchPuntuations, IFootballTeamTableItem } from './JSportModule/profiles/football/FootballTeamTableItem';
export { VolleyballProfile } from './JSportModule/profiles/volleyball/VolleyballProfile';
export type { VolleyMatchResults, VolleyMatchPuntuations, IVolleyTeamTableItem } from './JSportModule/profiles/volleyball/VolleyTeamTableItem';
export type { IVolleyScore } from './JSportModule/profiles/volleyball/VolleyScore';

// Match (abstract base classes)
export { A_Match } from './JSportModule/Match/A_Match';
export type { TypeMatchState } from './JSportModule/Match/A_Match';
export { A_MatchPlay } from './JSportModule/Match/A_MatchPlay';
export { A_Result } from './JSportModule/Match/A_Result';
export type { IA_ResultInfo, TypeTotalScore } from './JSportModule/Match/A_Result';
export { A_Serie } from './JSportModule/Match/A_Serie';
export { randomFloat, reseedRandom } from './JSportModule/Match/randomSource';

// Stages
export { default as Stage } from './Tournament/Stage/Stage';
export type { TGS } from './Tournament/Stage/Stage';
export { default as StageGroup } from './Tournament/Stage/StageGroup/StageGroup';
export { default as League } from './Tournament/Stage/StageGroup/League/League';
export { Turn } from './Tournament/Stage/StageGroup/League/Turn';
export type { ITurnInfo } from './Tournament/Stage/StageGroup/League/Turn';

// Eventos concretos (necesarios para discriminar eventos del calendario).
// WARNING: exponer estas clases para hacer `instanceof` es un workaround temporal.
// La solución definitiva es un contrato kind/label en el JEvent base (ver docs/BUGS.md).
export { Event_StageStart } from './Tournament/Stage/Event_StageStart';
export { Event_StageEnd } from './Tournament/Stage/Event_StageEnd';
export { Event_ScheduleOfTurnMatches } from './Tournament/Stage/StageGroup/League/Event_ScheduleOfTurnMatches';
export { JEventMatch } from './JSportModule/Match/EventMatch';

// Data & Config types
export type {
  IElementInfo,
  ITournamentConfig,
  IPhaseConfig,
  IStageConfig,
  IStageGroupConfig,
  IStagePlayoffConfig,
  IBaseStageConfig,
  ILeagueConfig,
  ISingleElminationConfig,
  TypeBaseStageOption,
  TQualyCondition,
} from './JSportModule/data/elementsConfig';

// API & Server
export { SportAPIController } from './JSportModule/SportAPI';
export type { ISportFactory, IEntityController, IElementController, ISportAPIController } from './JSportModule/apiInterfaces';
export { default as SportServerAPI } from './JSportServerModule';

// GeneralStageGraph
export { GeneralStageGraph } from './JSportModule/GeneralStageGraph/GeneralStageGraph';
export { createGSG } from './JSportModule/GeneralStageGraph/GSGCreators';
export type { TInitialCreator, TPhaseCreator } from './JSportModule/GeneralStageGraph/GSGCreators';
export { tournamentFromGSG } from './JSportModule/GeneralStageGraph/tournamentFromGSG';
export { createStandardGSGDataFromNParticipants } from './JSportModule/GeneralStageGraph/createStandardGSGDataFromNParticipants';
export type { ITournamentFromGSGData } from './JSportModule/GeneralStageGraph/tournamentFromGSG';

// Entities
export { Institution } from './JSportModule/data/Entities/Institution';
export type { IInstitutionData, IInstitutionCreator } from './JSportModule/data/Entities/Institution';
export { Federation } from './JSportModule/data/Entities/Federation';
export type { IFederationData, IFederationCreator } from './JSportModule/data/Entities/Federation';
export { Confederation } from './JSportModule/data/Entities/Confederation';
export type { IConfederationData } from './JSportModule/data/Entities/Confederation';
export { default as Team } from './JSportModule/data/Team';

// Geographic Entities
export { Continent, Country, Town } from './JSportModule/data/Entities/GeogEntity';
export type { IContinentData, ICountryData, ITownData } from './JSportModule/data/Entities/GeogEntity';

// Data types
export type { TypeCategory, TypeCategoryList } from './JSportModule/data/types';
export { CATEGORIES } from './JSportModule/data/types';

// Example data (useful for seeding)
export { getContinentData, getCountriesData, getTownsData } from './examples/APIExample/geogData';
export { getInstitutionsData, getFederationData, getConfederationData } from './examples/APIExample/entitiesData';

// ============================================================================
// Examples runner - solo se ejecuta si este archivo se corre directamente
// ============================================================================

import APIExample from './examples/APIExample';
import baseStageExample from './examples/baseStageExample';
import volleyBaseStageExample from './examples/volleyBaseStageExample';
import americanFootballBaseStageExample from './examples/americanFootballBaseStageExample';
import fede_inst_Example from './examples/fede_inst_Example';
// import graphExample from './examples/graphExample';
import specialStageGroupExample from './examples/specialStageGroupExample';
import stageExample01 from './examples/stageExample01';
import stageExample02 from './examples/stageExample02';
import stageExample03 from './examples/stageExample03';
import stageLeagueExample from './examples/stageLeagueExample';
import systemExample_01 from './examples/systemExample_01';
import confederationExample from './examples/confederationExample';

/**
 * Ejecuta un ejemplo específico.
 * Descomenta el que quieras probar y ejecuta con `npm start`.
 */
function runExamples() {
  baseStageExample();
  volleyBaseStageExample();
  americanFootballBaseStageExample();
  stageExample01();
  stageExample02();
  stageLeagueExample();
  specialStageGroupExample();
  stageExample03();
  // graphExample();
  systemExample_01();
  fede_inst_Example();
  confederationExample();
  APIExample();
}

// Se ejecuta solo si se invoca directamente (npm start / node dist/index.js)
if (require.main === module) {
  runExamples();

  const formatMemoryUsage = (data: number) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;
  const memoryData = process.memoryUsage();
  console.log({
    rss: `${formatMemoryUsage(memoryData.rss)} -> Resident Set Size`,
    heapTotal: `${formatMemoryUsage(memoryData.heapTotal)} -> total heap`,
    heapUsed: `${formatMemoryUsage(memoryData.heapUsed)} -> used heap`,
    external: `${formatMemoryUsage(memoryData.external)} -> V8 external`,
  });
}