// ============================================================================
// JSport Library - Public API Exports
// ============================================================================

// Calendar
export { default as JCalendar } from './JCalendar/JCalendar';
export { JDateTime, JDate, JTime } from './JCalendar/JDateTimeModule';
export type { IJDateTimeCreator, TypeHalfWeekOfYear, TypeIntervalOfDay } from './JCalendar/JDateTimeModule';
export { DateToString } from './JCalendar/DateToString';

// Ranking
export { Ranking } from './JSportModule/Ranking/Ranking';
export type { TypeRanking } from './JSportModule/Ranking/Ranking';
export type { IGenericRankItem, IRankItem, TypeTableMatchState, IRankingMetadata, TypeRankingGenerator, TypeRankedEntity } from './JSportModule/Ranking/interfaces';
export { A_TeamTableItem } from './JSportModule/Ranking/A_TeamTableItem';
export type { AnyTeamTableItem, SortFunc, IA_TeamTableItemBase } from './JSportModule/Ranking/A_TeamTableItem';
export { RankingStore } from './JSportModule/Ranking/RankingStore';

// Tournament
export { default as Tournament } from './Tournament/Tournament';
export { default as Phase } from './Tournament/Phase';
export { globalFinishedRankingsMap } from './Tournament/globalFinishedRankingsMap';

// Sport Profiles
export type { ISportProfile, AnySportProfile, IMatchCreationInfo, ISerieCreationInfo } from './JSportModule/profiles/ISportProfile';

// Match (abstract base classes)
export { A_Match } from './JSportModule/Match/A_Match';
export { A_MatchPlay } from './JSportModule/Match/A_MatchPlay';
export { A_Result } from './JSportModule/Match/A_Result';
export { A_Serie } from './JSportModule/Match/A_Serie';

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
export { tournamentFromGSG } from './JSportModule/GeneralStageGraph/tournamentFromGSG';
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
import fede_inst_Example from './examples/fede_inst_Example';
import graphExample from './examples/graphExample';
import specialStageGroupExample from './examples/specialStageGroupExample';
import stageExample01 from './examples/stageExample01';
import stageExample02 from './examples/stageExample02';
import stageExample03 from './examples/stageExample03';
import stageLeagueExample from './examples/stageLeagueExample';
import systemExample_01 from './examples/systemExample_01';

/**
 * Ejecuta un ejemplo específico.
 * Descomenta el que quieras probar y ejecuta con `npm start`.
 */
function runExamples() {
  // baseStageExample();
  // volleyBaseStageExample();
  // stageExample01();
  // stageExample02();
  // stageLeagueExample();
  // specialStageGroupExample();
  // stageExample03();
  // graphExample();
  // systemExample_01();
  // fede_inst_Example();
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